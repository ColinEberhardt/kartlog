<script>
  import { onMount } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { updateSession, getSession } from '../lib/firestore/sessions.js';
  import { getUserTyres } from '../lib/firestore/tyres.js';
  import { getUserTracks } from '../lib/firestore/tracks.js';
  import { getUserEngines } from '../lib/firestore/engines.js';
  import { getUserChassis } from '../lib/firestore/chassis.js';
  import { getWeatherCodeOptions, getWeatherDescription } from '../lib/sessionFormat.js';
  import { fetchWeatherForSession } from '../lib/weather.js';
  import Card from '@smui/card';
  import Textfield from '@smui/textfield';
  import Select, { Option } from '@smui/select';
  import Checkbox from '@smui/checkbox';
  import FormField from '@smui/form-field';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';

  export let params = {};
  let sessionId = params.id;

  // Session Information
  let date = '';
  let circuitId = '';
  let temp = '';
  let weatherCode = 0; // WMO Weather interpretation code
  let session = '';

  // Equipment Setup
  let tyreId = '';
  let engineId = '';
  let chassisId = '';

  // Kart Setup
  let rearSprocket = '';
  let frontSprocket = '';
  let caster = '';
  let rideHeight = '';
  let jet = '';
  let rearInner = '';
  let rearOuter = '';
  let frontInner = '';
  let frontOuter = '';

  // Session Results
  let laps = '';
  let fastest = '';

  // Race Information (optional)
  let isRace = false;
  let entries = '';
  let startPos = '';
  let endPos = '';
  let penalties = '';
  let notes = '';

  let tyres = [];
  let tracks = [];
  let engines = [];
  let chassis = [];
  let loading = false;
  let error = '';
  let initialLoading = true;
  let showRetired = false;
  let fetchingWeather = false;

  // Automatically check 'Include retired Equipment' if any selected item is retired
  $: if (
    allTyres.length > 0 && sessionTyreId && allTyres.find(t => t.id === sessionTyreId && t.retired) ||
    allEngines.length > 0 && sessionEngineId && allEngines.find(e => e.id === sessionEngineId && e.retired) ||
    allChassis.length > 0 && sessionChassisId && allChassis.find(c => c.id === sessionChassisId && c.retired)
  ) {
    showRetired = true;
  }

  const weatherCodeOptions = getWeatherCodeOptions();

  let allTyres = [];
  let allEngines = [];
  let allChassis = [];
  let sessionTyreId = '';
  let sessionEngineId = '';
  let sessionChassisId = '';

  // Update filtered lists when showRetired changes
  $: {
    if (allTyres.length > 0) {
      tyres = showRetired ? allTyres : allTyres.filter(tyre => !tyre.retired || tyre.id === sessionTyreId);
    }
    if (allEngines.length > 0) {
      engines = showRetired ? allEngines : allEngines.filter(engine => !engine.retired || engine.id === sessionEngineId);
    }
    if (allChassis.length > 0) {
      chassis = showRetired ? allChassis : allChassis.filter(c => !c.retired || c.id === sessionChassisId);
    }
  }

  const loadData = async () => {
    try {
      initialLoading = true;
      const [sessionData, tyresData, tracksData, enginesData, chassisData] = await Promise.all([
        getSession(sessionId),
        getUserTyres(),
        getUserTracks(),
        getUserEngines(),
        getUserChassis()
      ]);

      // Load existing data first to know which IDs are currently selected
      sessionTyreId = sessionData.tyreId || '';
      sessionEngineId = sessionData.engineId || '';
      sessionChassisId = sessionData.chassisId || '';

      // Store all data
      allTyres = tyresData;
      allEngines = enginesData;
      allChassis = chassisData;
      tracks = tracksData;

      // Filter tyres, but always include the one currently used in this session
      tyres = showRetired ? tyresData : tyresData.filter(tyre => !tyre.retired || tyre.id === sessionTyreId);
      // Filter engines, but always include the one currently used in this session
      engines = showRetired ? enginesData : enginesData.filter(engine => !engine.retired || engine.id === sessionEngineId);
      // Filter chassis, but always include the one currently used in this session
      chassis = showRetired ? chassisData : chassisData.filter(c => !c.retired || c.id === sessionChassisId);

      // Load existing data
      const sessionDate = sessionData.date ? (sessionData.date.toDate ? sessionData.date.toDate() : new Date(sessionData.date)) : new Date();
      const year = sessionDate.getFullYear();
      const month = String(sessionDate.getMonth() + 1).padStart(2, '0');
      const day = String(sessionDate.getDate()).padStart(2, '0');
      const hours = String(sessionDate.getHours()).padStart(2, '0');
      const minutes = String(sessionDate.getMinutes()).padStart(2, '0');
      date = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      circuitId = sessionData.circuitId || '';
      temp = sessionData.temp ? sessionData.temp.toString() : '';
      weatherCode = sessionData.weatherCode || 0;
      session = sessionData.session || '';
      tyreId = sessionTyreId;
      engineId = sessionEngineId;
      chassisId = sessionChassisId;
      rearSprocket = sessionData.rearSprocket ? sessionData.rearSprocket.toString() : '';
      frontSprocket = sessionData.frontSprocket ? sessionData.frontSprocket.toString() : '';
      caster = sessionData.caster || 'Half';
      rideHeight = sessionData.rideHeight || 'Middle';
      jet = sessionData.jet ? sessionData.jet.toString() : '';
      rearInner = sessionData.rearInner ? sessionData.rearInner.toString() : '';
      rearOuter = sessionData.rearOuter ? sessionData.rearOuter.toString() : '';
      frontInner = sessionData.frontInner ? sessionData.frontInner.toString() : '';
      frontOuter = sessionData.frontOuter ? sessionData.frontOuter.toString() : '';
      laps = sessionData.laps ? sessionData.laps.toString() : '';
      fastest = sessionData.fastest ? sessionData.fastest.toString() : '';
      isRace = sessionData.isRace || false;
      entries = sessionData.entries ? sessionData.entries.toString() : '';
      startPos = sessionData.startPos ? sessionData.startPos.toString() : '';
      endPos = sessionData.endPos ? sessionData.endPos.toString() : '';
      penalties = sessionData.penalties || '';
      notes = sessionData.notes || '';
    } catch (err) {
      error = err.message;
    } finally {
      initialLoading = false;
    }
  };

  const setDefaultDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    date = `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!date || !circuitId || !session || !temp || !tyreId || !engineId || !chassisId || !laps) {
      error = 'Please fill in all required fields';
      return;
    }

    // Validate numeric fields that are required
    if (isNaN(Number(temp)) || Number(temp) <= 0) {
      error = 'Temperature must be a valid positive number';
      return;
    }

    if (isNaN(Number(laps)) || Number(laps) <= 0) {
      error = 'Laps must be a valid positive number';
      return;
    }

    // Validate optional numeric fields (Kart Setup) if they are provided
    const optionalNumericFields = [
      { value: rearSprocket, name: 'Rear sprocket' },
      { value: frontSprocket, name: 'Front sprocket' },
      { value: jet, name: 'Jet size' },
      { value: rearInner, name: 'Rear inner pressure' },
      { value: rearOuter, name: 'Rear outer pressure' },
      { value: frontInner, name: 'Front inner pressure' },
      { value: frontOuter, name: 'Front outer pressure' }
    ];
    
    for (const field of optionalNumericFields) {
      if (field.value && (isNaN(Number(field.value)) || Number(field.value) <= 0)) {
        error = `${field.name} must be a valid positive number if provided`;
        return;
      }
    }

    if (fastest && (isNaN(Number(fastest)) || Number(fastest) <= 0)) {
      error = 'Fastest lap time must be a valid positive number';
      return;
    }

    // Validate race fields if it's a race
    if (isRace) {
      if (!entries || !startPos || !endPos) {
        error = 'For race sessions, please enter entries, start position, and end position';
        return;
      }
      if ([entries, startPos, endPos].some(field => isNaN(Number(field)) || Number(field) <= 0)) {
        error = 'Race fields must be valid positive numbers';
        return;
      }
    }

    loading = true;
    error = '';

    try {
      const sessionData = {
        date,
        circuitId,
        temp,
        weatherCode,
        session,
        tyreId,
        engineId,
        chassisId,
        rearSprocket: rearSprocket || null,
        frontSprocket: frontSprocket || null,
        caster: caster || null,
        rideHeight: rideHeight || null,
        jet: jet || null,
        rearInner: rearInner || null,
        rearOuter: rearOuter || null,
        frontInner: frontInner || null,
        frontOuter: frontOuter || null,
        laps,
        fastest: fastest || null,
        isRace,
        entries: isRace ? entries : null,
        startPos: isRace ? startPos : null,
        endPos: isRace ? endPos : null,
        penalties: penalties || null,
        notes: notes || null
      };

      await updateSession(sessionId, sessionData);
      push(`/sessions/view/${sessionId}`);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    loadData();
  });
  
  const fetchWeather = async () => {
    if (!circuitId) {
      error = 'Please select a track first';
      return;
    }
    if (!date) {
      error = 'Please select a date and time first';
      return;
    }
    fetchingWeather = true;
    error = '';
    try {
      const result = await fetchWeatherForSession({ circuitId, date, tracks });
      temp = result.temp;
      weatherCode = result.weatherCode;
    } catch (err) {
      error = `Failed to fetch weather: ${err.message}`;
    } finally {
      fetchingWeather = false;
    }
  };
</script>

<div class="edit-page">
  <div class="page-header">
    <h1>Edit Karting Session</h1>
    <Button href="/sessions" tag="a" use={[link]} variant="outlined">← Back to Sessions</Button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if initialLoading}
    <div class="loading-state">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading session data...</p>
    </div>
  {:else}
    <Card style="padding: 2rem;">
      <form on:submit|preventDefault={handleSubmit}>
      <!-- Session Information Section -->
      <div class="form-section">
        <h3>Session Information</h3>
        
        <div class="form-group">
          <Textfield bind:value={session} label="Session Name" required style="width: 100%;" />
        </div>

        <div class="form-group">
          <Textfield type="datetime-local" bind:value={date} label="Date & Time" required style="width: 100%;" />
        </div>

        <div class="form-group">
          <Select bind:value={circuitId} label="Circuit" required style="width: 100%;">
            <Option value="">Select a track...</Option>
            {#each tracks as track (track.id)}
              <Option value={track.id}>{track.name}</Option>
            {/each}
          </Select>
          {#if tracks.length === 0}
            <p class="no-items">
              No tracks found. <a href="/tracks/new">Add a track first</a>.
            </p>
          {/if}
        </div>

        <div class="weather-fetch-section">
          <Button 
            type="button" 
            onclick={fetchWeather} 
            disabled={!circuitId || fetchingWeather}
            variant="outlined"
            style="margin-bottom: 1rem;">
            {fetchingWeather ? 'Fetching Weather...' : '🌤️ Get Weather'}
          </Button>
        </div>

        <div class="form-row">
          <div class="form-group">
            <Textfield bind:value={temp} label="Temperature (°C)" required input$inputmode="decimal" style="width: 100%;" />
          </div>

          <div class="form-group">
            <Select bind:value={weatherCode} label="Weather Conditions" required style="width: 100%;">
              {#each weatherCodeOptions as option (option.code)}
                <Option value={option.code}>{option.description}</Option>
              {/each}
            </Select>
          </div>
        </div>
      </div>

      <!-- Equipment Setup Section -->
      <div class="form-section">
        <h3>Equipment Setup</h3>
        
        <div class="form-group checkbox-group">
          <FormField>
            <Checkbox bind:checked={showRetired} />
            {#snippet label()}
            Include retired Equipment
            {/snippet}
          </FormField>
        </div>

        <div class="form-group">
          <Select bind:value={tyreId} label="Tyre Used" required style="width: 100%;">
            <Option value="">Select a tyre...</Option>
            {#each tyres as tyre (tyre.id)}
              <Option value={tyre.id}>{tyre.name || `${tyre.make} ${tyre.type}`}</Option>
            {/each}
          </Select>
          {#if tyres.length === 0}
            <p class="no-items">
              No active tyres found. <a href="/tyres/new">Add a tyre first</a>.
            </p>
          {/if}
        </div>

        <div class="form-group">
          <Select bind:value={engineId} label="Engine" required style="width: 100%;">
            <Option value="">Select an engine...</Option>
            {#each engines as engine (engine.id)}
              <Option value={engine.id}>{engine.name || `${engine.make} ${engine.model}`}</Option>
            {/each}
          </Select>
          {#if engines.length === 0}
            <p class="no-items">
              No active engines found. <a href="/engines/new">Add an engine first</a>.
            </p>
          {/if}
        </div>

        <div class="form-group">
          <Select bind:value={chassisId} label="Chassis" required style="width: 100%;">
            <Option value="">Select a chassis...</Option>
            {#each chassis as c (c.id)}
              <Option value={c.id}>{c.name || `${c.make} ${c.model}`}</Option>
            {/each}
          </Select>
          {#if chassis.length === 0}
            <p class="no-items">
              No active chassis found. <a href="/chassis/new">Add a chassis first</a>.
            </p>
          {/if}
        </div>
      </div>

      <!-- Kart Setup Section -->
      <div class="form-section">
        <h3>Kart Setup</h3>
        
        <div class="form-row">
          <div class="form-group">
            <Textfield bind:value={rearSprocket} label="Rear Sprocket (teeth)" input$inputmode="numeric" style="width: 100%;" />
          </div>

          <div class="form-group">
            <Textfield bind:value={frontSprocket} label="Front Sprocket (teeth)" input$inputmode="numeric" style="width: 100%;" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <Textfield bind:value={caster} label="Caster" style="width: 100%;" />
          </div>

          <div class="form-group">
            <Textfield bind:value={rideHeight} label="Ride Height" style="width: 100%;" />
          </div>
        </div>

        <div class="form-group">
          <Textfield bind:value={jet} label="Jet Size" input$inputmode="numeric" style="width: 100%;" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <Textfield bind:value={rearInner} label="Rear Inner Pressure (psi)" input$inputmode="decimal" style="width: 100%;" />
          </div>

          <div class="form-group">
            <Textfield bind:value={rearOuter} label="Rear Outer Pressure (psi)" input$inputmode="decimal" style="width: 100%;" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <Textfield bind:value={frontInner} label="Front Inner Pressure (psi)" input$inputmode="decimal" style="width: 100%;" />
          </div>

          <div class="form-group">
            <Textfield bind:value={frontOuter} label="Front Outer Pressure (psi)" input$inputmode="decimal" style="width: 100%;" />
          </div>
        </div>
      </div>

      <!-- Session Results Section -->
      <div class="form-section">
        <h3>Session Results</h3>
        
        <div class="form-row">
          <div class="form-group">
            <Textfield bind:value={laps} label="Number of Laps" required input$inputmode="numeric" style="width: 100%;" />
          </div>

          <div class="form-group">
            <Textfield bind:value={fastest} label="Fastest Lap Time (seconds)" input$inputmode="decimal" style="width: 100%;" />
          </div>
        </div>
      </div>

      <!-- Race Information Section -->
      <div class="form-section">
        <h3>Race Information (Optional)</h3>
        
        <div class="form-group checkbox-group">
          <FormField>
            <Checkbox bind:checked={isRace} />
            <span slot="label">This was a race session</span>
          </FormField>
        </div>

        {#if isRace}
          <div class="race-fields">
            <div class="form-row">
              <div class="form-group">
                <Textfield bind:value={entries} label="Number of Entries" input$inputmode="numeric" style="width: 100%;" />
              </div>

              <div class="form-group">
                <Textfield bind:value={startPos} label="Starting Position" input$inputmode="numeric" style="width: 100%;" />
              </div>

              <div class="form-group">
                <Textfield bind:value={endPos} label="Finishing Position" input$inputmode="numeric" style="width: 100%;" />
              </div>
            </div>

            <div class="form-group">
              <Textfield bind:value={penalties} label="Penalties" style="width: 100%;" />
            </div>
          </div>
        {/if}

        <div class="form-group">
          <Textfield bind:value={notes} label="Session Notes" textarea style="width: 100%;" input$rows={4} />
        </div>
      </div>

      <div class="form-actions">
        <Button type="button" onclick={() => push('/sessions')} variant="outlined">
          Cancel
        </Button>
        <Button type="submit" disabled={loading || tyres.length === 0 || tracks.length === 0 || engines.length === 0} variant="raised" style="background-color: #007bff;">
          {loading ? 'Updating...' : 'Update Session'}
        </Button>
      </div>
    </form>
    </Card>
  {/if}
</div>

<style>
  .no-items {
    margin-top: 0.5rem;
    color: var(--color-danger);
    font-size: 0.9rem;
  }

  .no-items a {
    color: var(--color-primary);
    text-decoration: none;
  }

  .no-items a:hover {
    text-decoration: underline;
  }

  .checkbox-group {
    margin-bottom: 1rem;
  }

</style>

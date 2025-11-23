<script>
  import { onMount } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { addSession, getUserSessions } from '../lib/firestore/sessions.js';
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

  // Session Information
  let date = '';
  let circuitId = '';
  let temp = '';
  let weatherCode = -1;
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
  let fetchingWeather = false;
  let recentSession = null;
  let canLoadRecent = false;
  let showRetired = false;

  const weatherCodeOptions = getWeatherCodeOptions();

  // Reload data when showRetired changes
  $: if (tyres.length > 0 || engines.length > 0 || chassis.length > 0) {
    loadData();
  }

  const loadData = async () => {
    try {
      const [tyresData, tracksData, enginesData, chassisData, sessionsData] = await Promise.all([
        getUserTyres(),
        getUserTracks(),
        getUserEngines(),
        getUserChassis(),
        getUserSessions()
      ]);
      tyres = showRetired ? tyresData : tyresData.filter(tyre => !tyre.retired);
      tracks = tracksData;
      engines = showRetired ? enginesData : enginesData.filter(engine => !engine.retired);
      chassis = showRetired ? chassisData : chassisData.filter(c => !c.retired);
      
      // Check if there's a recent session (within last 2 days)
      if (sessionsData && sessionsData.length > 0) {
        const mostRecentSession = sessionsData[0]; // Already sorted by date desc
        const sessionDate = mostRecentSession.date?.toDate ? 
          mostRecentSession.date.toDate() : 
          new Date(mostRecentSession.date);
        
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
        if (Date.now() - sessionDate.getTime() < twoDaysInMs) {
          recentSession = mostRecentSession;
          canLoadRecent = true;
        }
      }
    } catch (err) {
      error = err.message;
    }
  };

  const loadRecentDefaults = () => {
    if (!recentSession) return;
    
    // Load defaults from recent session
    circuitId = recentSession.circuitId || '';
    temp = recentSession.temp ? String(recentSession.temp) : '';
    weatherCode = recentSession.weatherCode || -1;
    
    // Only set equipment IDs if they exist and are not retired
    if (recentSession.tyreId && tyres.some(t => t.id === recentSession.tyreId)) {
      tyreId = recentSession.tyreId;
    }
    if (recentSession.engineId && engines.some(e => e.id === recentSession.engineId)) {
      engineId = recentSession.engineId;
    }
    if (recentSession.chassisId && chassis.some(c => c.id === recentSession.chassisId)) {
      chassisId = recentSession.chassisId;
    }
    
    // Load kart setup
    rearSprocket = recentSession.rearSprocket ? String(recentSession.rearSprocket) : '';
    frontSprocket = recentSession.frontSprocket ? String(recentSession.frontSprocket) : '';
    caster = recentSession.caster || '';
    rideHeight = recentSession.rideHeight || '';
    jet = recentSession.jet ? String(recentSession.jet) : '';
    rearInner = recentSession.rearInner ? String(recentSession.rearInner) : '';
    rearOuter = recentSession.rearOuter ? String(recentSession.rearOuter) : '';
    frontInner = recentSession.frontInner ? String(recentSession.frontInner) : '';
    frontOuter = recentSession.frontOuter ? String(recentSession.frontOuter) : '';
  };

  const setDefaultDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    date = `${year}-${month}-${day}T${hours}:${minutes}`;
  };

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
      error = err.message || 'Failed to fetch weather';
    } finally {
      fetchingWeather = false;
    }
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

      await addSession(sessionData);
      push('/sessions');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    setDefaultDate();
    loadData();
  });
</script>

<div class="form-page">
  <div class="header">
    <h1>Add Session</h1>
    <Button href="/sessions" tag="a" use={[link]} variant="outlined">← Back to Sessions</Button>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if canLoadRecent}
    <div class="recent-session-banner">
      <span>💡 You have a recent session</span>
      <Button type="button" onclick={loadRecentDefaults} variant="outlined" style="margin-left: auto;">
        Load Recent Setup
      </Button>
    </div>
  {/if}

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
          <Option value="none">Select a track...</Option>
          {#each tracks as track (track.id)}
            <Option value={track.id}>{track.name}</Option>
          {/each}
        </Select>
        {#if tracks.length === 0}
          <p class="no-items">
              No tracks found. <a href="#/tracks/new">Add a track first</a>.
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
          <Select bind:value={weatherCode} label="Weather conditions" required style="width: 100%;">
            <Option value="-1">Select weather ...</Option>
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
              No active tyres found. <a href="#/tyres/new">Add a tyre first</a>.
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
              No active engines found. <a href="#/engines/new">Add an engine first</a>.
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
              No active chassis found. <a href="#/chassis/new">Add a chassis first</a>.
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
        {loading ? 'Adding...' : 'Add Session'}
      </Button>
    </div>
  </form>
  </Card>
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .header h1 {
    margin: 0;
    color: #333;
  }

  .recent-session-banner {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
    background-color: #e7f3ff;
    border: 1px solid #b3d9ff;
    border-radius: 4px;
    color: #004085;
  }

  .recent-session-banner span {
    flex: 1;
  }

  .form-section {
    margin-bottom: 2.5rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e9ecef;
  }

  .form-section:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  .form-section h3 {
    margin: 0 0 1.5rem 0;
    color: #495057;
    font-size: 1.25rem;
    font-weight: 600;
    border-left: 4px solid #007bff;
    padding-left: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    min-height: 100px;
  }

  .no-items {
    margin-top: 0.5rem;
    color: #dc3545;
    font-size: 0.9rem;
  }

  .no-items a {
    color: #007bff;
    text-decoration: none;
  }

  .no-items a:hover {
    text-decoration: underline;
  }

  .checkbox-group {
    margin-bottom: 1rem;
  }

  .race-fields {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #dee2e6;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 2rem;
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }

    .form-section h3 {
      font-size: 1.1rem;
    }
  }
</style>

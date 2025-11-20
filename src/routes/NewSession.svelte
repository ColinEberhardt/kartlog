<script>
  import { onMount } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { addSession, getUserSessions } from '../lib/sessions.js';
  import { getUserTyres } from '../lib/tyres.js';
  import { getUserEngines } from '../lib/engines.js';
  import { getUserChassis } from '../lib/chassis.js';
  import { getUserCircuits } from '../lib/circuits.js';
  import { getWeatherCodeOptions, getWeatherDescription } from '../lib/sessionFormat.js';
  import { getCurrentLocation, findNearestCircuit } from '../lib/geolocation.js';
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
  let engines = [];
  let chassis = [];
  let circuits = [];
  let loading = false;
  let error = '';
  
  // Geolocation state
  let isLoadingLocation = false;
  let locationError = null;

  const weatherCodeOptions = getWeatherCodeOptions();

  const loadData = async () => {
    try {
      const [tyresData, enginesData, chassisData, circuitsData, sessionsData] = await Promise.all([
        getUserTyres(),
        getUserEngines(),
        getUserChassis(),
        getUserCircuits(),
        getUserSessions()
      ]);
      tyres = tyresData.filter(tyre => !tyre.retired);
      engines = enginesData.filter(engine => !engine.retired);
      chassis = chassisData.filter(c => !c.retired);
      // Sort circuits alphabetically by name for dropdown
      circuits = circuitsData.sort((a, b) => a.name.localeCompare(b.name));
      
      // If there's a most recent session, use its values as defaults
      if (sessionsData && sessionsData.length > 0) {
        const recentSession = sessionsData[0]; // Already sorted by date desc
        
        // Only set defaults for fields that are likely to be reused
        // Don't set date, session type, laps, fastest, or race-specific fields
        circuitId = recentSession.circuitId || '';
        temp = recentSession.temp ? String(recentSession.temp) : '';
        weatherCode = recentSession.weatherCode || -1;
        tyreId = recentSession.tyreId || '';
        engineId = recentSession.engineId || '';
        chassisId = recentSession.chassisId || '';
        rearSprocket = recentSession.rearSprocket ? String(recentSession.rearSprocket) : '';
        frontSprocket = recentSession.frontSprocket ? String(recentSession.frontSprocket) : '';
        caster = recentSession.caster || 'Half';
        rideHeight = recentSession.rideHeight || '';
        jet = recentSession.jet ? String(recentSession.jet) : '';
        rearInner = recentSession.rearInner ? String(recentSession.rearInner) : '';
        rearOuter = recentSession.rearOuter ? String(recentSession.rearOuter) : '';
        frontInner = recentSession.frontInner ? String(recentSession.frontInner) : '';
        frontOuter = recentSession.frontOuter ? String(recentSession.frontOuter) : '';
      }
    } catch (err) {
      error = err.message;
    }
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

  const handleSubmit = async () => {
    // Validate required fields
    if (!date || !circuitId || !session || !temp || !tyreId || !engineId || !chassisId ||
        !rearSprocket || !frontSprocket || !jet || !rearInner || !rearOuter ||
        !frontInner || !frontOuter || !laps) {
      error = 'Please fill in all required fields';
      return;
    }

    // Validate numeric fields
    const numericFields = [temp, rearSprocket, frontSprocket, jet, rearInner, rearOuter, frontInner, frontOuter, laps];
    if (numericFields.some(field => isNaN(Number(field)) || Number(field) <= 0)) {
      error = 'Please enter valid positive numbers for all numeric fields';
      return;
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
        rearSprocket,
        frontSprocket,
        caster,
        rideHeight,
        jet,
        rearInner,
        rearOuter,
        frontInner,
        frontOuter,
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

  onMount(async () => {
    setDefaultDate();
    await loadData();
    
    // Auto-select nearest circuit based on location (if circuits available)
    if (circuits.length > 0 && !circuitId) {
      try {
        isLoadingLocation = true;
        const userLocation = await getCurrentLocation();
        const nearest = findNearestCircuit(userLocation, circuits);
        
        if (nearest) {
          circuitId = nearest.id;
          console.log('Auto-selected circuit:', nearest.name);
        }
      } catch (error) {
        // Permission denied or timeout - fail silently per FR-009
        console.log('Geolocation unavailable:', error.message);
        locationError = error;
        // Continue with manual selection (no blocking)
      } finally {
        isLoadingLocation = false;
      }
    }
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
        {#if circuits.length === 0}
          <div class="empty-state-message">
            No circuits available. <a href="/circuits/new" use:link>Add a circuit</a> first.
          </div>
        {:else}
          <Select bind:value={circuitId} label="Circuit" required style="width: 100%;">
            <Option value=""></Option>
            {#each circuits as circuit}
              <Option value={circuit.id}>{circuit.name}</Option>
            {/each}
          </Select>
          {#if isLoadingLocation}
            <div class="location-status">📍 Getting your location...</div>
          {/if}
        {/if}
      </div>

      <div class="form-row">
        <div class="form-group">
          <Textfield type="number" bind:value={temp} label="Temperature (°C)" required input$min="0" input$step="0.01" input$max="50" style="width: 100%;" />
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
          <Textfield type="number" bind:value={rearSprocket} label="Rear Sprocket (teeth)" required input$min="1" style="width: 100%;" />
        </div>

        <div class="form-group">
          <Textfield type="number" bind:value={frontSprocket} label="Front Sprocket (teeth)" required input$min="1" style="width: 100%;" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <Textfield bind:value={caster} label="Caster" required style="width: 100%;" />
        </div>

        <div class="form-group">
          <Textfield bind:value={rideHeight} label="Ride Height" required style="width: 100%;" />
        </div>
      </div>

      <div class="form-group">
        <Textfield type="number" bind:value={jet} label="Jet Size" required input$min="1" style="width: 100%;" />
      </div>

      <div class="form-row">
        <div class="form-group">
          <Textfield type="number" bind:value={rearInner} label="Rear Inner Pressure (psi)" required input$min="0" input$step="0.1" style="width: 100%;" />
        </div>

        <div class="form-group">
          <Textfield type="number" bind:value={rearOuter} label="Rear Outer Pressure (psi)" required input$min="0" input$step="0.1" style="width: 100%;" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <Textfield type="number" bind:value={frontInner} label="Front Inner Pressure (psi)" required input$min="0" input$step="0.1" style="width: 100%;" />
        </div>

        <div class="form-group">
          <Textfield type="number" bind:value={frontOuter} label="Front Outer Pressure (psi)" required input$min="0" input$step="0.1" style="width: 100%;" />
        </div>
      </div>
    </div>

    <!-- Session Results Section -->
    <div class="form-section">
      <h3>Session Results</h3>
      
      <div class="form-row">
        <div class="form-group">
          <Textfield type="number" bind:value={laps} label="Number of Laps" required input$min="1" style="width: 100%;" />
        </div>

        <div class="form-group">
          <Textfield type="number" bind:value={fastest} label="Fastest Lap Time (seconds)" input$min="0" input$step="0.001" style="width: 100%;" />
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
              <Textfield type="number" bind:value={entries} label="Number of Entries" input$min="1" style="width: 100%;" />
            </div>

            <div class="form-group">
              <Textfield type="number" bind:value={startPos} label="Starting Position" input$min="1" style="width: 100%;" />
            </div>

            <div class="form-group">
              <Textfield type="number" bind:value={endPos} label="Finishing Position" input$min="1" style="width: 100%;" />
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
      <Button type="submit" disabled={loading || tyres.length === 0 || engines.length === 0} variant="raised" style="background-color: #007bff;">
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

  .location-status {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #e7f3ff;
    border-left: 3px solid #007bff;
    color: #004085;
    font-size: 0.9rem;
    border-radius: 4px;
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

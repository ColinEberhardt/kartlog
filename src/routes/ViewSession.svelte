<script>
  import { onMount } from 'svelte';
  import { link, push } from 'svelte-spa-router';
  import { getSession, deleteSession, getUserSessions } from '../lib/sessions.js';
  import { getUserTyres } from '../lib/tyres.js';
  import { getUserTracks } from '../lib/tracks.js';
  import { getUserEngines } from '../lib/engines.js';
  import { getUserChassis } from '../lib/chassis.js';
  import { getWeatherDescription } from '../lib/sessionFormat.js';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';
  import './action-buttons.css';

  export let params = {};
  
  let session = null;
  let tyres = [];
  let tracks = [];
  let engines = [];
  let chassis = [];
  let allSessions = [];
  let loading = true;
  let error = '';

  const loadData = async () => {
    try {
      loading = true;
      const [sessionData, tyresData, tracksData, enginesData, chassisData, allSessionsData] = await Promise.all([
        getSession(params.id),
        getUserTyres(),
        getUserTracks(),
        getUserEngines(),
        getUserChassis(),
        getUserSessions()
      ]);

      session = sessionData;
      tyres = tyresData;
      tracks = tracksData;
      engines = enginesData;
      chassis = chassisData;
      allSessions = allSessionsData;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString();
  };

  const formatFastestLap = (time) => {
    if (!time) return 'Not recorded';
    return `${time.toFixed(3)} seconds`;
  };

  const getTrackName = (trackId) => {
    const track = tracks.find(t => t.id === trackId);
    return track ? track.name : 'Unknown Track';
  };

  const getTyreName = (tyreId) => {
    const tyre = tyres.find(t => t.id === tyreId);
    return tyre ? (tyre.name || `${tyre.make} ${tyre.type}`) : 'Unknown Tyre';
  };

  const getTyreLaps = (tyreId, currentSessionDate) => {
    if (!tyreId || !allSessions.length) return 0;
    
    // Convert current session date to timestamp for comparison
    const currentDate = currentSessionDate?.toDate ? currentSessionDate.toDate() : new Date(currentSessionDate);
    const currentTimestamp = currentDate.getTime();
    
    // Filter sessions that use this tyre and occurred on or before the current session
    const tyreSessions = allSessions.filter(s => {
      if (s.tyreId !== tyreId) return false;
      
      const sessionDate = s.date?.toDate ? s.date.toDate() : new Date(s.date);
      const sessionTimestamp = sessionDate.getTime();
      
      return sessionTimestamp <= currentTimestamp;
    });
    
    // Sum up all the laps
    return tyreSessions.reduce((total, s) => total + (s.laps || 0), 0);
  };

  const getEngineName = (engineId) => {
    const engine = engines.find(e => e.id === engineId);
    return engine ? (engine.name || `${engine.make} ${engine.model}`) : 'Unknown Engine';
  };

  const getChassisName = (chassisId) => {
    const c = chassis.find(ch => ch.id === chassisId);
    return c ? (c.name || `${c.make} ${c.model}`) : 'Unknown Chassis';
  };

  const formatSprocket = (front, rear) => {
    if (!front || !rear) return 'Not recorded';
    const ratio = (rear / front).toFixed(2);
    return `${front} / ${rear} (${ratio})`;
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteSession(params.id);
      push('/sessions');
    } catch (err) {
      error = err.message;
    }
  };

  onMount(loadData);
</script>

<div class="form-page">
  <div class="header">
    <h1>{session?.session || 'Session Details'}</h1>
    <div class="header-actions">
      <Button href="/sessions" tag="a" use={[link]} variant="outlined">← Back to Sessions</Button>
    </div>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if loading}
    <div class="loading">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading session details...</p>
    </div>
  {:else if session}
    <div>
      <!-- Session Information Section -->
      <div class="detail-section">
        <h3>Session Information</h3>
        
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">Date:</span>
            <span class="value">{formatDate(session.date)}</span>
          </div>

          <div class="detail-item">
            <span class="label">Circuit:</span>
            <span class="value">{getTrackName(session.circuitId)}</span>
          </div>

          <div class="detail-item">
            <span class="label">Temperature:</span>
            <span class="value">{session.temp}°C</span>
          </div>

          <div class="detail-item">
            <span class="label">Weather:</span>
            <span class="value">{getWeatherDescription(session.weatherCode)}</span>
          </div>
        </div>
      </div>

      <!-- Equipment Setup Section -->
      <div class="detail-section">
        <h3>Equipment Setup</h3>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">Tyre:</span>
            <span class="value">{getTyreName(session.tyreId)} ({getTyreLaps(session.tyreId, session.date)} laps)</span>
          </div>

          <div class="detail-item">
            <span class="label">Engine:</span>
            <span class="value">{getEngineName(session.engineId)}</span>
          </div>

          <div class="detail-item">
            <span class="label">Chassis:</span>
            <span class="value">{getChassisName(session.chassisId)}</span>
          </div>
        </div>
      </div>

      <!-- Kart Setup Section -->
      <div class="detail-section">
        <h3>Kart Setup</h3>
        
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">Sprocket:</span>
            <span class="value">{formatSprocket(session.frontSprocket, session.rearSprocket)}</span>
          </div>

          <div class="detail-item">
            <span class="label">Caster:</span>
            <span class="value">{session.caster}</span>
          </div>

          <div class="detail-item">
            <span class="label">Ride Height:</span>
            <span class="value">{session.rideHeight}</span>
          </div>

          <div class="detail-item">
            <span class="label">Jet Size:</span>
            <span class="value">{session.jet}</span>
          </div>

          <div class="detail-item">
            <span class="label">Front Inner Pressure:</span>
            <span class="value">{session.frontInner} psi</span>
          </div>

          <div class="detail-item">
            <span class="label">Front Outer Pressure:</span>
            <span class="value">{session.frontOuter} psi</span>
          </div>

          <div class="detail-item">
            <span class="label">Rear Inner Pressure:</span>
            <span class="value">{session.rearInner} psi</span>
          </div>

          <div class="detail-item">
            <span class="label">Rear Outer Pressure:</span>
            <span class="value">{session.rearOuter} psi</span>
          </div>
        </div>
      </div>

      <!-- Session Results Section -->
      <div class="detail-section">
        <h3>Session Results</h3>
        
        <div class="detail-grid">
          <div class="detail-item">
            <span class="label">Number of Laps:</span>
            <span class="value">{session.laps}</span>
          </div>

          <div class="detail-item">
            <span class="label">Fastest Lap Time:</span>
            <span class="value">{formatFastestLap(session.fastest)}</span>
          </div>
        </div>
      </div>

      <!-- Race Information Section -->
      {#if session.isRace}
        <div class="detail-section">
          <h3>Race Information</h3>
          
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Number of Entries:</span>
              <span class="value">{session.entries || 'Not recorded'}</span>
            </div>

            <div class="detail-item">
              <span class="label">Starting Position:</span>
              <span class="value">{session.startPos || 'Not recorded'}</span>
            </div>

            <div class="detail-item">
              <span class="label">Finishing Position:</span>
              <span class="value">{session.endPos || 'Not recorded'}</span>
            </div>

            {#if session.penalties}
              <div class="detail-item full-width">
                <span class="label">Penalties:</span>
                <span class="value">{session.penalties}</span>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Session Notes Section -->
      {#if session.notes}
        <div class="detail-section">
          <h3>Session Notes</h3>
          
          <div class="notes-content">
            <p>{session.notes}</p>
          </div>
        </div>
      {/if}

      <!-- Action Buttons Section -->
      <div class="detail-section action-section">
        <div class="action-buttons">
          <a href="/sessions/edit/{session.id}" use:link class="text-button">
            Edit
          </a>
          <button on:click={handleDelete} class="text-button delete-button">
            Delete
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="empty-state">
      <h2>Session Not Found</h2>
      <p>The session you're looking for doesn't exist or you don't have access to it.</p>
      <Button href="/sessions" tag="a" use={[link]} variant="outlined">Back to Sessions</Button>
    </div>
  {/if}
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

  .header-actions {
    display: flex;
    gap: 1rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    background-color: #f8f9fa;
    border-radius: 10px;
    margin-top: 2rem;
  }

  .empty-state h2 {
    color: #666;
    margin-bottom: 1rem;
  }

  .empty-state p {
    color: #888;
    margin-bottom: 2rem;
  }

  .detail-section {
    padding: 2rem;
    border-bottom: 1px solid #e9ecef;
  }

  .detail-section:last-child {
    border-bottom: none;
  }

  .detail-section h3 {
    margin: 0 0 1.5rem 0;
    color: #495057;
    font-size: 1.25rem;
    font-weight: 600;
    border-left: 4px solid #007bff;
    padding-left: 1rem;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background-color: #f8f9fa;
    border-radius: 4px;
  }

  .detail-item.full-width {
    grid-column: 1 / -1;
  }

  .label {
    font-weight: 500;
    color: #666;
  }

  .value {
    color: #333;
    font-weight: 600;
  }

  .notes-content {
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 4px;
    border-left: 4px solid #007bff;
  }

  .notes-content p {
    margin: 0;
    color: #333;
    line-height: 1.5;
  }

  .race-icon {
    margin-right: 0.5rem;
    font-size: 1.1em;
  }

  .action-section {
    background-color: #f8f9fa;
    display: flex;
    justify-content: flex-end;
    padding: 1.5rem 2rem;
  }

  .action-section .action-buttons {
    display: flex;
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .header-actions {
      justify-content: space-between;
    }

    .detail-section {
      padding: 1.5rem;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }

    .detail-section h3 {
      font-size: 1.1rem;
    }

    .action-section {
      justify-content: center;
    }
  }
</style>

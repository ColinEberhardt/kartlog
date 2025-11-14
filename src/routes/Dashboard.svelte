<script>
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { getUserTyres } from '../lib/firestore/tyres.js';
  import { getUserEngines } from '../lib/firestore/engines.js';
  import { getUserChassis } from '../lib/firestore/chassis.js';
  import { getUserSessions } from '../lib/firestore/sessions.js';
  import { getUserTracks } from '../lib/firestore/tracks.js';
  import Card from '@smui/card';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';
  import LayoutGrid, { Cell } from '@smui/layout-grid';
  import SessionsTable from '../components/SessionsTable.svelte';
  import '../routes/table.css';
  import '../routes/sessions.css';

  let tyres = [];
  let chassis = [];
  let engines = [];
  let sessions = [];
  let tracks = [];
  let loading = true;
  let error = '';

  const loadData = async () => {
    try {
      loading = true;
      const [tyresData, chassisData, enginesData, sessionsData, tracksData] = await Promise.all([
        getUserTyres(),
        getUserChassis(),
        getUserEngines(),
        getUserSessions(),
        getUserTracks()
      ]);
      tyres = tyresData;
      chassis = chassisData;
      engines = enginesData;
      sessions = sessionsData;
      tracks = tracksData;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  // Helper to get day key for grouping
  function getDayKey(date) {
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  }

  // Get sessions from the most recent day
  $: sortedSessions = sessions.length > 0 
    ? [...sessions].sort((a, b) => {
        const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      })
    : [];

  $: mostRecentDaySessions = sortedSessions.length > 0 
    ? (() => {
        const mostRecentDay = getDayKey(sortedSessions[0].date);
        return sortedSessions.filter(s => getDayKey(s.date) === mostRecentDay);
      })()
    : [];

  // Group sessions by day for the table component
  $: sessionsByDay = mostRecentDaySessions.length > 0
    ? { [getDayKey(mostRecentDaySessions[0].date)]: mostRecentDaySessions }
    : {};

  $: dayKeys = Object.keys(sessionsByDay);

  // Count only non-retired items
  $: activeTyres = tyres.filter(t => !t.retired).length;
  $: activeChassis = chassis.filter(c => !c.retired).length;
  $: activeEngines = engines.filter(e => !e.retired).length;

  // Calculate sessions stats
  $: sessionsThisMonth = sessions.filter(s => {
    const sessionDate = s.date.toDate ? s.date.toDate() : new Date(s.date);
    const now = new Date();
    return sessionDate.getMonth() === now.getMonth() && 
           sessionDate.getFullYear() === now.getFullYear();
  }).length;

  $: sessionsThisYear = sessions.filter(s => {
    const sessionDate = s.date.toDate ? s.date.toDate() : new Date(s.date);
    const now = new Date();
    return sessionDate.getFullYear() === now.getFullYear();
  }).length;

  // Get most visited track
  $: mostVisitedTrack = (() => {
    if (sessions.length === 0 || tracks.length === 0) return null;
    const trackCounts = {};
    sessions.forEach(s => {
      if (s.circuitId) {
        trackCounts[s.circuitId] = (trackCounts[s.circuitId] || 0) + 1;
      }
    });
    if (Object.keys(trackCounts).length === 0) return null;
    const mostVisitedTrackId = Object.entries(trackCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    return tracks.find(t => t.id === mostVisitedTrackId);
  })();

  onMount(loadData);
</script>

<div class="container container-lg">

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if loading}
    <div class="loading-state">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading dashboard...</p>
    </div>
  {:else}
    <LayoutGrid>
      <Cell spanDevices={{ desktop: 4, tablet: 4, phone: 4 }}>
        <Card class="card-hover">
          <div class="card-header card-header-active">
            <div class="stat-icon">🏁</div>
            <h3>Sessions</h3>
          </div>
          <div class="card-details">
            <div class="stat-number">{sessions.length}</div>
            <div class="card-stats">
              <div class="stat-item">
                <span class="stat-label">This Month</span>
                <span class="stat-value">{sessionsThisMonth}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">This Year</span>
                <span class="stat-value">{sessionsThisYear}</span>
              </div>
            </div>
          </div>
          <div class="card-actions">
            <Button href="/sessions" tag="a" use={[link]} variant="outlined">View All</Button>
          </div>
        </Card>
      </Cell>

      <Cell spanDevices={{ desktop: 4, tablet: 4, phone: 4 }}>
        <Card class="card-hover">
          <div class="card-header card-header-active">
            <div class="stat-icon">🔧</div>
            <h3>Inventory</h3>
          </div>
          <div class="card-details">
            <div class="inventory-items">
              <div class="inventory-item">
                <span class="inventory-icon">🛞</span>
                <span class="inventory-label">Tyres</span>
                <span class="inventory-count">{activeTyres}</span>
                <Button href="/tyres" tag="a" use={[link]} variant="text" class="inventory-link">View</Button>
              </div>
              <div class="inventory-item">
                <span class="inventory-icon">🏎️</span>
                <span class="inventory-label">Chassis</span>
                <span class="inventory-count">{activeChassis}</span>
                <Button href="/chassis" tag="a" use={[link]} variant="text" class="inventory-link">View</Button>
              </div>
              <div class="inventory-item">
                <span class="inventory-icon">⚙️</span>
                <span class="inventory-label">Engines</span>
                <span class="inventory-count">{activeEngines}</span>
                <Button href="/engines" tag="a" use={[link]} variant="text" class="inventory-link">View</Button>
              </div>
            </div>
          </div>
        </Card>
      </Cell>

      <Cell spanDevices={{ desktop: 4, tablet: 4, phone: 4 }}>
        <Card class="card-hover">
          <div class="card-header card-header-active">
            <div class="stat-icon">🏁</div>
            <h3>Tracks</h3>
          </div>
          <div class="card-details">
            <div class="stat-number">{tracks.length}</div>
            {#if mostVisitedTrack}
            <div class="card-stats">
              <div class="stat-item">
                <span class="stat-label">Most Visited</span>
                <span class="stat-value track-name">{mostVisitedTrack.name}</span>
              </div>
            </div>
            {/if}
          </div>
          <div class="card-actions">
            <Button href="/tracks" tag="a" use={[link]} variant="outlined">View All</Button>
          </div>
        </Card>
      </Cell>
    </LayoutGrid>

    {#if mostRecentDaySessions.length > 0}
      <div class="recent-sessions-section" style="margin-top: 2rem;">
        <h2 style="margin-bottom: 1rem;">Recent Sessions</h2>
        <div class="table-container">
          <SessionsTable {sessionsByDay} {dayKeys} {tracks} />
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .stat-icon {
    font-size: 3rem;
  }

  .stat-number {
    font-size: 2.5rem;
    font-weight: bold;
    color: #007bff;
    margin-bottom: 1.5rem;
  }

  .inventory-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .inventory-item {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background-color: rgba(0, 123, 255, 0.05);
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .inventory-item:hover {
    background-color: rgba(0, 123, 255, 0.1);
  }

  .inventory-icon {
    font-size: 1.5rem;
  }

  .inventory-label {
    font-weight: 500;
  }

  .inventory-count {
    font-size: 1.25rem;
    font-weight: bold;
    color: #007bff;
  }

  :global(.inventory-link) {
    min-width: auto !important;
    padding: 0.25rem 0.75rem !important;
  }

  .card-stats {
    display: flex;
    gap: 1.5rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #666;
    font-weight: 500;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: bold;
    color: #007bff;
  }

  .stat-value.track-name {
    font-size: 1rem;
    color: #007bff;
  }
</style>

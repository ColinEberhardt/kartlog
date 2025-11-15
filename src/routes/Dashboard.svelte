<script>
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { getUserTyres } from '../lib/tyres.js';
  import { getUserEngines } from '../lib/engines.js';
  import { getUserSessions } from '../lib/sessions.js';
  import Card from '@smui/card';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';
  import LayoutGrid, { Cell } from '@smui/layout-grid';
  import SessionsTable from '../components/SessionsTable.svelte';
  import '../routes/table.css';
  import '../routes/sessions.css';

  let tyres = [];
  let engines = [];
  let sessions = [];
  let loading = true;
  let error = '';

  const loadData = async () => {
    try {
      loading = true;
      const [tyresData, enginesData, sessionsData] = await Promise.all([
        getUserTyres(),
        getUserEngines(),
        getUserSessions()
      ]);
      tyres = tyresData;
      engines = enginesData;
      sessions = sessionsData;
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

  onMount(loadData);
</script>

<div class="container container-lg">
  <div class="page-header">
    <h1>Dashboard</h1>
  </div>

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
      <Cell spanDevices={{ desktop: 3, tablet: 4, phone: 4 }}>
        <Card class="card-hover">
          <div class="card-header card-header-active">
            <div class="stat-icon">🏁</div>
            <h3>Sessions</h3>
          </div>
          <div class="card-details">
            <div class="stat-number">{sessions.length}</div>
          </div>
          <div class="card-actions">
            <Button href="/sessions" tag="a" use={[link]} variant="outlined">View All</Button>
          </div>
        </Card>
      </Cell>

      <Cell spanDevices={{ desktop: 3, tablet: 4, phone: 4 }}>
        <Card class="card-hover">
          <div class="card-header card-header-active">
            <div class="stat-icon">🛞</div>
            <h3>Tyres</h3>
          </div>
          <div class="card-details">
            <div class="stat-number">{tyres.length}</div>
          </div>
          <div class="card-actions">
            <Button href="/tyres" tag="a" use={[link]} variant="outlined">View All</Button>
          </div>
        </Card>
      </Cell>

      <Cell spanDevices={{ desktop: 3, tablet: 4, phone: 4 }}>
        <Card class="card-hover">
          <div class="card-header card-header-active">
            <div class="stat-icon">⚙️</div>
            <h3>Engines</h3>
          </div>
          <div class="card-details">
            <div class="stat-number">{engines.length}</div>
          </div>
          <div class="card-actions">
            <Button href="/engines" tag="a" use={[link]} variant="outlined">View All</Button>
          </div>
        </Card>
      </Cell>
    </LayoutGrid>

    {#if mostRecentDaySessions.length > 0}
      <div class="recent-sessions-section" style="margin-top: 2rem;">
        <h2 style="margin-bottom: 1rem;">Recent Sessions</h2>
        <div class="table-container">
          <SessionsTable {sessionsByDay} {dayKeys} />
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
</style>

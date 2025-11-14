<script>
  import { onMount } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { getUserEngines, deleteEngine, retireEngine } from '../lib/firestore/engines.js';
  import { getUserSessions } from '../lib/firestore/sessions.js';
  import { calculateItemStats, mergeItemsWithStats } from '../lib/sessionStats.js';
  import Card from '@smui/card';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';
  import LayoutGrid, { Cell } from '@smui/layout-grid';
  import './action-buttons.css';

  let engines = [];
  let loading = true;
  let error = '';

  const loadEngines = async () => {
    try {
      loading = true;
      const rawEngines = await getUserEngines();
      const sessions = await getUserSessions();
      
      // Calculate engine statistics from sessions
      const engineStats = calculateItemStats(sessions, 'engineId');
      
      // Merge engine data with statistics
      const enginesWithStats = mergeItemsWithStats(rawEngines, engineStats);
      
      // Sort engines: active engines first (by createdAt desc), then retired engines (by createdAt desc)
      engines = enginesWithStats.sort((a, b) => {
        // If one is retired and the other isn't, retired goes to bottom
        if (a.retired !== b.retired) {
          return a.retired ? 1 : -1;
        }
        
        // Both have same retirement status, sort by createdAt (most recent first)
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  const handleDelete = async (engineId) => {
    if (!confirm('Are you sure you want to delete this engine? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteEngine(engineId);
      await loadEngines(); // Reload the list
    } catch (err) {
      error = err.message;
    }
  };

  const handleRetire = async (engineId) => {
    if (!confirm('Are you sure you want to retire this engine?')) {
      return;
    }

    try {
      await retireEngine(engineId);
      await loadEngines(); // Reload the list
    } catch (err) {
      error = err.message;
    }
  };

  const handleSessionsClick = (engine) => {
    if (engine.sessions > 0) {
      const filters = encodeURIComponent(JSON.stringify([{ 
        type: 'engine', 
        id: engine.id, 
        label: engine.name || `${engine.make} ${engine.model}`
      }]));
      push(`/sessions?filters=${filters}`);
    }
  };

  onMount(() => {
    loadEngines();
  });
</script>

<div class="container container-lg">
  <div class="page-header">
    <h1>Engines</h1>
    <Button href="/engines/new" tag="a" use={[link]} variant="raised" color="primary">+ Add New Engine</Button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if loading}
    <div class="loading-state">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading engines...</p>
    </div>
  {:else if engines.length === 0}
    <div class="empty-state">
      <h3>No engines found</h3>
      <p>Get started by adding your first engine.</p>
      <Button href="/engines/new" tag="a" use={[link]} variant="raised" color="primary">Add Engine</Button>
    </div>
  {:else}
    <LayoutGrid>
      {#each engines as engine (engine.id)}
        <Cell spanDevices={{ desktop: 4, tablet: 4, phone: 4 }}>
          <Card class="card-hover {engine.retired ? 'card-retired' : ''}">
            <div class="card-header {engine.retired ? 'card-header-retired' : 'card-header-active'}">
              <h3>{engine.name || `${engine.make} ${engine.model}`}</h3>
              {#if engine.retired}
                <span class="retired-badge">Retired</span>
              {/if}
            </div>
            
            <div class="card-details">
              {#if engine.name}
                <div class="detail">
                  <strong>Make/Model:</strong> {engine.make} {engine.model}
                </div>
              {/if}
              <div class="detail">
                <strong>Laps:</strong> {engine.totalLaps}
              </div>
              <div class="detail">
                <strong>Sessions:</strong> 
                {#if engine.sessions > 0}
                  <a 
                    href="/sessions?filters={encodeURIComponent(JSON.stringify([{ type: 'engine', id: engine.id, label: engine.name || `${engine.make} ${engine.model}` }]))}" 
                    class="sessions-link"
                    on:click|preventDefault={() => handleSessionsClick(engine)}
                  >
                    {engine.sessions}
                  </a>
                {:else}
                  {engine.sessions}
                {/if}
              </div>
              {#if engine.serialNumber}
                <div class="detail">
                  <strong>Serial Number:</strong> {engine.serialNumber}
                </div>
              {/if}
              {#if engine.sealNumber}
                <div class="detail">
                  <strong>Seal Number:</strong> {engine.sealNumber}
                </div>
              {/if}
              {#if engine.purchaseDate}
                <div class="detail">
                  <strong>Purchase Date:</strong> {new Date(engine.purchaseDate).toLocaleDateString()}
                </div>
              {/if}
              {#if engine.notes}
                <div class="detail">
                  {engine.notes}
                </div>
              {/if}
            </div>

            <div class="card-actions">
              <a href="/engines/{engine.id}" use:link class="text-button">
                Edit
              </a>
              {#if !engine.retired}
                <button on:click|preventDefault={() => handleRetire(engine.id)} class="text-button retire-button">
                  Retire
                </button>
              {/if}
              <button on:click|preventDefault={() => handleDelete(engine.id)} class="text-button delete-button">
                Delete
              </button>
            </div>
          </Card>
        </Cell>
      {/each}
    </LayoutGrid>
  {/if}
</div>

<style>
  .sessions-link {
    color: #007bff;
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s;
  }

  .sessions-link:hover {
    color: #0056b3;
    text-decoration: underline;
  }
</style>
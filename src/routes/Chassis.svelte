<script>
  import { onMount } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { getUserChassis, deleteChassis, retireChassis } from '../lib/firestore/chassis.js';
  import { getUserSessions } from '../lib/firestore/sessions.js';
  import { calculateItemStats, mergeItemsWithStats } from '../lib/sessionStats.js';
  import Card from '@smui/card';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';
  import LayoutGrid, { Cell } from '@smui/layout-grid';
  import './action-buttons.css';

  let chassis = [];
  let loading = true;
  let error = '';

  const loadChassis = async () => {
    try {
      loading = true;
      const rawChassis = await getUserChassis();
      const sessions = await getUserSessions();

      // Calculate chassis statistics from sessions
      const chassisStats = calculateItemStats(sessions, 'chassisId');

      // Merge chassis data with statistics
      const chassisWithStats = mergeItemsWithStats(rawChassis, chassisStats);

      // Sort chassis: active chassis first (by createdAt desc), then retired chassis (by createdAt desc)
      chassis = chassisWithStats.sort((a, b) => {
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

  const handleDelete = async (chassisId) => {
    if (!confirm('Are you sure you want to delete this chassis? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteChassis(chassisId);
      await loadChassis(); // Reload the list
    } catch (err) {
      error = err.message;
    }
  };

  const handleRetire = async (chassisId) => {
    if (!confirm('Are you sure you want to retire this chassis?')) {
      return;
    }

    try {
      await retireChassis(chassisId);
      await loadChassis(); // Reload the list
    } catch (err) {
      error = err.message;
    }
  };

  const handleSessionsClick = (c) => {
    if (c.sessions > 0) {
      const filters = encodeURIComponent(JSON.stringify([{
        type: 'chassis',
        id: c.id,
        label: c.name || `${c.make} ${c.model}`
      }]));
      push(`/sessions?filters=${filters}`);
    }
  };

  onMount(() => {
    loadChassis();
  });
</script>

<div class="container container-lg">
  <div class="page-header">
    <h1>Chassis</h1>
    <Button href="/chassis/new" tag="a" use={[link]} variant="raised" color="primary">+ Add New Chassis</Button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if loading}
    <div class="loading-state">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading chassis...</p>
    </div>
  {:else if chassis.length === 0}
    <div class="empty-state">
      <h3>No chassis found</h3>
      <p>Get started by adding your first chassis.</p>
      <Button href="/chassis/new" tag="a" use={[link]} variant="raised" color="primary">Add Chassis</Button>
    </div>
  {:else}
    <LayoutGrid>
      {#each chassis as c (c.id)}
        <Cell spanDevices={{ desktop: 4, tablet: 4, phone: 4 }}>
          <Card class="card-hover {c.retired ? 'card-retired' : ''}">
            <div class="card-header {c.retired ? 'card-header-retired' : 'card-header-active'}">
              <h3>{c.name || `${c.make} ${c.model}`}</h3>
              {#if c.retired}
                <span class="retired-badge">Retired</span>
              {/if}
            </div>

            <div class="card-details">
              {#if c.name}
                <div class="detail">
                  <strong>Make/Model:</strong> {c.make} {c.model}
                </div>
              {/if}
              <div class="detail">
                <strong>Laps:</strong> {c.totalLaps}
              </div>
              <div class="detail">
                <strong>Sessions:</strong>
                {#if c.sessions > 0}
                  <a
                    href="/sessions?filters={encodeURIComponent(JSON.stringify([{ type: 'chassis', id: c.id, label: c.name || `${c.make} ${c.model}` }]))}"
                    class="sessions-link"
                    on:click|preventDefault={() => handleSessionsClick(c)}
                  >
                    {c.sessions}
                  </a>
                {:else}
                  {c.sessions}
                {/if}
              </div>
              {#if c.serialNumber}
                <div class="detail">
                  <strong>Serial Number:</strong> {c.serialNumber}
                </div>
              {/if}
              {#if c.purchaseDate}
                <div class="detail">
                  <strong>Purchase Date:</strong> {new Date(c.purchaseDate).toLocaleDateString()}
                </div>
              {/if}
              {#if c.notes}
                <div class="detail">
                  {c.notes}
                </div>
              {/if}
            </div>

            <div class="card-actions">
              <a href="/chassis/{c.id}" use:link class="text-button">
                Edit
              </a>
              {#if !c.retired}
                <button on:click|preventDefault={() => handleRetire(c.id)} class="text-button retire-button">
                  Retire
                </button>
              {/if}
              <button on:click|preventDefault={() => handleDelete(c.id)} class="text-button delete-button">
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

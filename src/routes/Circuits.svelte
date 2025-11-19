<script>
  import { onMount } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { getUserCircuits, deleteCircuit } from '../lib/circuits.js';
  import Card from '@smui/card';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';
  import LayoutGrid, { Cell } from '@smui/layout-grid';
  import './action-buttons.css';

  let circuits = [];
  let loading = true;
  let error = '';

  const formatCoordinate = (value) => {
    return value?.toFixed(4) + '°';
  };

  const loadCircuits = async () => {
    try {
      loading = true;
      circuits = await getUserCircuits();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  const handleDelete = async (circuitId) => {
    if (!confirm('Are you sure you want to delete this circuit? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCircuit(circuitId);
      await loadCircuits(); // Reload the list
    } catch (err) {
      error = err.message;
      alert(err.message);
    }
  };

  onMount(() => {
    loadCircuits();
  });
</script>

<div class="container container-lg">
  <div class="page-header">
    <h1>Circuits</h1>
    <Button href="/circuits/new" tag="a" use={[link]} variant="raised" color="primary">+ Add New Circuit</Button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if loading}
    <div class="loading-state">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading circuits...</p>
    </div>
  {:else if circuits.length === 0}
    <div class="empty-state">
      <h3>No circuits found</h3>
      <p>Get started by adding your first circuit.</p>
      <Button href="/circuits/new" tag="a" use={[link]} variant="raised" color="primary">Add Circuit</Button>
    </div>
  {:else}
    <LayoutGrid>
      {#each circuits as circuit (circuit.id)}
        <Cell spanDevices={{ desktop: 4, tablet: 4, phone: 4 }}>
          <Card class="card-hover">
            <div class="card-header card-header-active">
              <h3>{circuit.name}</h3>
            </div>
            
            <div class="card-details">
              <div class="detail">
                <strong>Latitude:</strong> {formatCoordinate(circuit.latitude)}
              </div>
              <div class="detail">
                <strong>Longitude:</strong> {formatCoordinate(circuit.longitude)}
              </div>
              {#if circuit.notes}
                <div class="detail">
                  <strong>Notes:</strong> {circuit.notes}
                </div>
              {/if}
            </div>

            <div class="card-actions">
              <a href="/circuits/edit/{circuit.id}" use:link class="text-button">
                Edit
              </a>
              <button on:click|preventDefault={() => handleDelete(circuit.id)} class="text-button delete-button">
                Delete
              </button>
            </div>
          </Card>
        </Cell>
      {/each}
    </LayoutGrid>
  {/if}
</div>

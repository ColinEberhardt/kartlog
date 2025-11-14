<script>
  import { onMount } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { getUserEngines, updateEngine } from '../lib/firestore/engines.js';
  import Card from '@smui/card';
  import Textfield from '@smui/textfield';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';

  export let params = {};
  let engineId = params.id;

  let name = '';
  let make = '';
  let model = '';
  let serialNumber = '';
  let sealNumber = '';
  let purchaseDate = '';
  let notes = '';
  let loading = false;
  let error = '';
  let initialLoading = true;

  const loadEngine = async () => {
    try {
      initialLoading = true;
      const engines = await getUserEngines();
      const engine = engines.find(e => e.id === engineId);
      
      if (!engine) {
        error = 'Engine not found';
        return;
      }

      // Load existing data
      name = engine.name || '';
      make = engine.make || '';
      model = engine.model || '';
      serialNumber = engine.serialNumber || '';
      sealNumber = engine.sealNumber || '';
      purchaseDate = engine.purchaseDate || '';
      notes = engine.notes || '';
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
    purchaseDate = `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!name || !make || !model) {
      error = 'Name, make and model are required';
      return;
    }

    loading = true;
    error = '';

    try {
      const engineData = {
        name: name.trim(),
        make: make.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim() || null,
        sealNumber: sealNumber.trim() || null,
        purchaseDate: purchaseDate || null,
        notes: notes.trim() || null
      };

      await updateEngine(engineId, engineData);
      push('/engines');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    loadEngine();
  });
</script>

<div class="edit-page">
  <div class="page-header">
    <h1>Edit Engine</h1>
    <Button href="/engines" tag="a" use={[link]} variant="outlined">← Back to Engines</Button>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if initialLoading}
    <div class="loading">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading engine data...</p>
    </div>
  {:else}
    <Card style="padding: 2rem;">
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-section">
          <h3>Engine Information</h3>
          
          <div class="form-row">
            <div class="form-group">
              <Textfield bind:value={name} label="Name" required style="width: 100%;" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <Textfield bind:value={make} label="Make" required style="width: 100%;" />
            </div>

            <div class="form-group">
              <Textfield bind:value={model} label="Model" required style="width: 100%;" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <Textfield bind:value={serialNumber} label="Serial Number" style="width: 100%;" />
            </div>

            <div class="form-group">
              <Textfield bind:value={sealNumber} label="Seal Number" style="width: 100%;" />
            </div>
          </div>

          <div class="form-group date-field-container">
            <Textfield type="date" bind:value={purchaseDate} label="Purchase Date" style="width: 100%;" />
            <Button type="button" onclick={setDefaultDate} class="date-button" variant="outlined">
              Set to Today
            </Button>
          </div>

          <div class="form-group">
            <Textfield bind:value={notes} label="Notes" textarea style="width: 100%;" input$rows={4} />
          </div>
        </div>

        <div class="form-actions">
          <Button type="button" onclick={() => push('/engines')} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} variant="raised" style="background-color: #007bff;">
            {loading ? 'Updating...' : 'Update Engine'}
          </Button>
        </div>
      </form>
    </Card>
  {/if}
</div>

<style>
  .date-field-container {
    position: relative;
  }

  :global(.date-button) {
    position: absolute;
    top: 0px;
    right: 0px;
    z-index: 10;
    font-size: 0.75rem;
    min-width: auto;
    padding: 4px 8px;
    height: 28px;
  }
</style>


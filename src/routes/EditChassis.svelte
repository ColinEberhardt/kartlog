<script>
  import { onMount } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { getUserChassis, updateChassis } from '../lib/firestore/chassis.js';
  import Card from '@smui/card';
  import Textfield from '@smui/textfield';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';
  import Checkbox from '@smui/checkbox';
  import FormField from '@smui/form-field';

  export let params = {};
  let chassisId = params.id;

  let name = '';
  let make = '';
  let model = '';
  let serialNumber = '';
  let purchaseDate = '';
  let notes = '';
  let retired = false;
  let loading = false;
  let error = '';
  let initialLoading = true;

  const loadChassis = async () => {
    try {
      initialLoading = true;
      const chassisList = await getUserChassis();
      const chassis = chassisList.find(c => c.id === chassisId);

      if (!chassis) {
        error = 'Chassis not found';
        return;
      }

      // Load existing data
      name = chassis.name || '';
      make = chassis.make || '';
      model = chassis.model || '';
      serialNumber = chassis.serialNumber || '';
      purchaseDate = chassis.purchaseDate || '';
      notes = chassis.notes || '';
      retired = chassis.retired || false;
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
      const chassisData = {
        name: name.trim(),
        make: make.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim() || null,
        purchaseDate: purchaseDate || null,
        notes: notes.trim() || null,
        retired: retired
      };

      await updateChassis(chassisId, chassisData);
      push('/chassis');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    loadChassis();
  });
</script>

<div class="edit-page">
  <div class="page-header">
    <h1>Edit Chassis</h1>
    <Button href="/chassis" tag="a" use={[link]} variant="outlined">← Back to Chassis</Button>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if initialLoading}
    <div class="loading">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading chassis data...</p>
    </div>
  {:else}
    <Card style="padding: 2rem;">
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-section">
          <h3>Chassis Information</h3>

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

          <div class="form-group checkbox-group">
            <FormField>
              <Checkbox bind:checked={retired} />
              <span slot="label">Retired (hide from active chassis list)</span>
            </FormField>
          </div>
        </div>

        <div class="form-actions">
          <Button type="button" onclick={() => push('/chassis')} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} variant="raised" style="background-color: #007bff;">
            {loading ? 'Updating...' : 'Update Chassis'}
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

  .checkbox-group {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e9ecef;
  }
</style>

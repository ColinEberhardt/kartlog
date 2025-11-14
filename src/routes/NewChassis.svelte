<script>
  import { createEventDispatcher } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { addChassis } from '../lib/firestore/chassis.js';
  import Card from '@smui/card';
  import Textfield from '@smui/textfield';
  import Button from '@smui/button';

  let name = '';
  let make = '';
  let model = '';
  let serialNumber = '';
  let purchaseDate = '';
  let notes = '';
  let loading = false;
  let error = '';

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
        notes: notes.trim() || null
      };

      await addChassis(chassisData);
      push('/chassis');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };
</script>

<div class="form-page">
  <div class="page-header">
    <h1>Add Chassis</h1>
    <Button href="/chassis" tag="a" use={[link]} variant="outlined">← Back to Chassis</Button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

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

        <div class="form-group">
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
        <Button type="button" onclick={() => push('/chassis')} variant="outlined">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} variant="raised" style="background-color: #007bff;">
          {loading ? 'Adding...' : 'Add Chassis'}
        </Button>
      </div>
    </form>
  </Card>
</div>

<style>

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

  .form-group {
    position: relative;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 768px) {
    .form-row {
      grid-template-columns: 1fr;
    }
  }
</style>

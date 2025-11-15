<script>
  import { onMount } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { db, doc, getDoc } from '../lib/firebase.js';
  import { updateTyre } from '../lib/firestore/tyres.js';
  import Card from '@smui/card';
  import Textfield from '@smui/textfield';
  import Select, { Option } from '@smui/select';
  import Checkbox from '@smui/checkbox';
  import FormField from '@smui/form-field';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';

  export let params = {};

  let name = '';
  let make = '';
  let type = '';
  let description = '';
  let retired = false;
  let loading = false;
  let error = '';
  let tyreId = '';

  const loadTyre = async () => {
    tyreId = params.id;
    if (!tyreId) {
      error = 'Tyre ID not provided';
      return;
    }

    try {
      loading = true;
      const tyreRef = doc(db, 'tyres', tyreId);
      const tyreSnap = await getDoc(tyreRef);
      
      if (tyreSnap.exists()) {
        const tyreData = tyreSnap.data();
        name = tyreData.name || '';
        make = tyreData.make || tyreData.brand || ''; // Handle legacy brand field
        type = tyreData.type || '';
        description = tyreData.description || '';
        retired = tyreData.retired || false;
      } else {
        error = 'Tyre not found';
      }
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !make.trim() || !type.trim()) {
      error = 'Please fill in all required fields (Name, Make and Type)';
      return;
    }

    loading = true;
    error = '';

    try {
      await updateTyre(tyreId, name.trim(), make.trim(), type.trim(), description.trim(), retired);
      push('/tyres');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  const handleCancel = () => {
    push('/tyres');
  };

  onMount(loadTyre);
</script>

<div class="edit-page">
  <div class="page-header">
    <h1>Edit Tyre</h1>
    <Button href="/tyres" tag="a" use={[link]} variant="outlined">← Back to Tyres</Button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if loading}
    <div class="loading-state">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading tyre details...</p>
    </div>
  {:else}
    <Card style="padding: 2rem;">
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-section">
          <h3>Tyre Information</h3>
          
          <div class="form-group">
            <Textfield
              variant="outlined"
              bind:value={name}
              label="Name"
              required
              disabled={loading}
              style="width: 100%;"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <Textfield
                variant="outlined"
                bind:value={make}
                label="Make"
                required
                disabled={loading}
                style="width: 100%;"
              />
            </div>

            <div class="form-group">
              <Select bind:value={type} label="Type" required disabled={loading} style="width: 100%;">
                <Option value="">Select type</Option>
                <Option value="Wet">Wet</Option>
                <Option value="Slick">Slick</Option>
              </Select>
            </div>
          </div>

          <div class="form-group">
            <Textfield
              variant="outlined"
              bind:value={description}
              label="Description"
              textarea
              disabled={loading}
              style="width: 100%;"
              input$rows={4}
            />
          </div>

          <div class="form-group">
            <FormField>
              <Checkbox bind:checked={retired} disabled={loading} />
              Retired
            </FormField>
          </div>
        </div>

        <div class="form-actions">
          <Button type="button" onclick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="raised" disabled={loading} style="background-color: #007bff;">
            {loading ? 'Updating...' : 'Update Tyre'}
          </Button>
        </div>
      </form>
    </Card>
  {/if}
</div>
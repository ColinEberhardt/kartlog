<script>
  import { onMount } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { getUserCircuits, updateCircuit } from '../lib/circuits.js';
  import Card from '@smui/card';
  import Textfield from '@smui/textfield';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';

  export let params = {};
  let circuitId = params.id;

  let name = '';
  let latitude = '';
  let longitude = '';
  let notes = '';
  let loading = false;
  let error = '';
  let initialLoading = true;

  const loadCircuit = async () => {
    try {
      initialLoading = true;
      const circuits = await getUserCircuits();
      const circuit = circuits.find(c => c.id === circuitId);
      
      if (!circuit) {
        error = 'Circuit not found';
        return;
      }

      // Load existing data
      name = circuit.name || '';
      latitude = circuit.latitude?.toString() || '';
      longitude = circuit.longitude?.toString() || '';
      notes = circuit.notes || '';
    } catch (err) {
      error = err.message;
    } finally {
      initialLoading = false;
    }
  };

  const validateCoordinates = (lat, lng) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      throw new Error('Latitude must be between -90 and +90 degrees');
    }

    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      throw new Error('Longitude must be between -180 and +180 degrees');
    }

    return { latitude: latNum, longitude: lngNum };
  };

  const handleSubmit = async () => {
    if (!name || !latitude || !longitude) {
      error = 'Name, latitude, and longitude are required';
      return;
    }

    loading = true;
    error = '';

    try {
      const coords = validateCoordinates(latitude, longitude);
      
      const circuitData = {
        name: name.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        notes: notes.trim() || ''
      };

      await updateCircuit(circuitId, circuitData);
      push('/circuits');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    loadCircuit();
  });
</script>

<div class="edit-page">
  <div class="page-header">
    <h1>Edit Circuit</h1>
    <Button href="/circuits" tag="a" use={[link]} variant="outlined">← Back to Circuits</Button>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if initialLoading}
    <div class="loading">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading circuit data...</p>
    </div>
  {:else}
    <Card style="padding: 2rem;">
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-section">
          <h3>Circuit Information</h3>
          
          <div class="form-group">
            <Textfield bind:value={name} label="Circuit Name" required style="width: 100%;" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <Textfield 
                type="number" 
                bind:value={latitude} 
                label="Latitude" 
                required 
                style="width: 100%;" 
                input$step="any"
                input$min="-90"
                input$max="90"
              />
            </div>

            <div class="form-group">
              <Textfield 
                type="number" 
                bind:value={longitude} 
                label="Longitude" 
                required 
                style="width: 100%;" 
                input$step="any"
                input$min="-180"
                input$max="180"
              />
            </div>
          </div>

          <div class="form-group">
            <Textfield 
              bind:value={notes} 
              label="Notes" 
              textarea 
              style="width: 100%;"
              input$rows="4"
            />
          </div>
        </div>

        <div class="form-actions">
          <Button href="/circuits" tag="a" use={[link]} variant="outlined">Cancel</Button>
          <Button type="submit" variant="raised" color="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Card>
  {/if}
</div>

<script>
  import { push, link } from 'svelte-spa-router';
  import { addTrack, getCurrentLocation } from '../lib/firestore/tracks.js';
  import Card from '@smui/card';
  import Textfield from '@smui/textfield';
  import Button from '@smui/button';

  let name = '';
  let latitude = '';
  let longitude = '';
  let loading = false;
  let error = '';
  let gettingLocation = false;

  const handleSubmit = async () => {
    if (!name.trim()) {
      error = 'Please enter a track name';
      return;
    }

    if (!latitude || !longitude) {
      error = 'Please enter both latitude and longitude';
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      error = 'Please enter valid numeric coordinates';
      return;
    }

    if (lat < -90 || lat > 90) {
      error = 'Latitude must be between -90 and 90 degrees';
      return;
    }

    if (lng < -180 || lng > 180) {
      error = 'Longitude must be between -180 and 180 degrees';
      return;
    }

    loading = true;
    error = '';

    try {
      await addTrack(name.trim(), lat, lng);
      push('/tracks');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  const handleUseCurrentLocation = async () => {
    gettingLocation = true;
    error = '';

    try {
      const location = await getCurrentLocation();
      latitude = location.latitude.toString();
      longitude = location.longitude.toString();
    } catch (err) {
      error = err.message;
    } finally {
      gettingLocation = false;
    }
  };

  const handleCancel = () => {
    push('/tracks');
  };
</script>

<div class="form-page">
  <div class="page-header">
    <h1>Add New Track</h1>
    <Button href="/tracks" tag="a" use={[link]} variant="outlined">← Back to Tracks</Button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  <Card style="padding: 2rem;">
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-section">
        <h3>Track Information</h3>
        
        <div class="form-group">
          <Textfield bind:value={name} label="Track Name" required disabled={loading} style="width: 100%;" />
        </div>
      </div>

      <div class="location-section">
        <h3>Location Coordinates</h3>
        <div class="location-header">
          <p>Enter the track's GPS coordinates or use your current location.</p>
          <Button
            type="button"
            onclick={handleUseCurrentLocation}
            disabled={gettingLocation || loading}
            variant="raised"
            style="background-color: #17a2b8;"
          >
            {#if gettingLocation}
              📍 Getting Location...
            {:else}
              📍 Use Current Location
            {/if}
          </Button>
        </div>

        <div class="coordinates-grid">
          <div class="form-group">
            <Textfield 
              
              type="number" 
              bind:value={latitude} 
              label="Latitude" 
              required 
              disabled={loading || gettingLocation}
              input$step="any"
              input$min="-90"
              input$max="90"
              style="width: 100%;" 
            />
            <small class="hint">Range: -90 to 90 degrees</small>
          </div>

          <div class="form-group">
            <Textfield 
              
              type="number" 
              bind:value={longitude} 
              label="Longitude" 
              required 
              disabled={loading || gettingLocation}
              input$step="any"
              input$min="-180"
              input$max="180"
              style="width: 100%;" 
            />
            <small class="hint">Range: -180 to 180 degrees</small>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <Button
          type="button"
          onclick={handleCancel}
          disabled={loading || gettingLocation}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || gettingLocation}
          variant="raised"
          style="background-color: #007bff;"
        >
          {#if loading}
            Adding Track...
          {:else}
            Add Track
          {/if}
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

  .page-header h1 {
    margin: 0 0 2rem 0;
  }

  .location-section {
    margin: 2rem 0;
    padding: 1.5rem;
    background-color: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #dee2e6;
  }

  .location-section h3 {
    margin: 0 0 1rem 0;
    color: #495057;
  }

  .location-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .location-header p {
    margin: 0;
    color: #6c757d;
    flex: 1;
  }

  .coordinates-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .hint {
    display: block;
    margin-top: 0.25rem;
    color: #6c757d;
    font-size: 0.875rem;
  }

  @media (max-width: 768px) {
    .coordinates-grid {
      grid-template-columns: 1fr;
    }

    .location-header {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>

<script>
  import { push, link } from 'svelte-spa-router';
  import { addCircuit } from '../lib/circuits.js';
  import { getCurrentLocation } from '../lib/geolocation.js';
  import Card from '@smui/card';
  import Textfield from '@smui/textfield';
  import Button from '@smui/button';

  let name = '';
  let latitude = '';
  let longitude = '';
  let notes = '';
  let loading = false;
  let error = '';
  
  // Geolocation state
  let isCapturingLocation = false;
  let locationCaptureError = '';
  let locationCaptureSuccess = false;

  const getUserFriendlyError = (error) => {
    if (error.code === 1) {
      return 'Location permission denied. Please enable location access in your browser settings to use this feature.';
    } else if (error.code === 2) {
      return 'Unable to determine your location. Please check your device location settings.';
    } else if (error.code === 3) {
      return 'Location request timed out. Please try again.';
    } else if (error.code === 0) {
      return 'Location services are not supported by your browser.';
    }
    return 'Unable to get your location. Please enter coordinates manually.';
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

  const handleUseMyLocation = async () => {
    isCapturingLocation = true;
    locationCaptureError = '';
    locationCaptureSuccess = false;

    try {
      const position = await getCurrentLocation();
      
      // Round to 6 decimal places (per FR-006)
      latitude = position.latitude.toFixed(6);
      longitude = position.longitude.toFixed(6);
      
      // Show success feedback
      locationCaptureSuccess = true;
      
      // Auto-clear success message after 2 seconds (per FR-007)
      setTimeout(() => {
        locationCaptureSuccess = false;
      }, 2000);
    } catch (err) {
      locationCaptureError = getUserFriendlyError(err);
    } finally {
      isCapturingLocation = false;
    }
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

      await addCircuit(circuitData);
      push('/circuits');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };
</script>

<div class="form-page">
  <div class="page-header">
    <h1>Add Circuit</h1>
    <Button href="/circuits" tag="a" use={[link]} variant="outlined">← Back to Circuits</Button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  <Card style="padding: 2rem;">
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-section">
        <h3>Circuit Information</h3>
        
        <div class="form-group">
          <Textfield bind:value={name} label="Circuit Name" required style="width: 100%;" />
        </div>

        <div class="coordinates-group">
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

          <div class="location-button-container">
            <Button 
              type="button"
              onclick={handleUseMyLocation} 
              variant="outlined" 
              disabled={isCapturingLocation}
              class="location-button"
            >
              {#if isCapturingLocation}
                📍 Getting location...
              {:else if locationCaptureSuccess}
                ✓ Location captured
              {:else}
                📍 Use My Location
              {/if}
            </Button>
            
            {#if locationCaptureError}
              <div class="location-error">{locationCaptureError}</div>
            {/if}
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
          {loading ? 'Saving...' : 'Save Circuit'}
        </Button>
      </div>
    </form>
  </Card>
</div>

<style>
  .coordinates-group {
    margin-bottom: 1.5rem;
  }

  .location-button-container {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .location-button-container :global(.location-button) {
    min-height: 44px;
    width: fit-content;
  }

  .location-error {
    padding: 0.75rem;
    background-color: #fff3cd;
    border-left: 3px solid #ffc107;
    color: #856404;
    font-size: 0.9rem;
    border-radius: 4px;
    line-height: 1.4;
  }

  @media (max-width: 600px) {
    .location-button-container :global(.location-button) {
      width: 100%;
    }
  }
</style>

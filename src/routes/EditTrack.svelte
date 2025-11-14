<script>
  import { onMount } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { getUserTracks, updateTrack, getCurrentLocation } from '../lib/firestore/tracks.js';
  import Card from '@smui/card';
  import Textfield from '@smui/textfield';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';

  export let params = {};
  
  let name = '';
  let latitude = '';
  let longitude = '';
  let loading = false;
  let error = '';
  let gettingLocation = false;
  let trackLoading = true;

  const trackId = params.id;

  const loadTrack = async () => {
    try {
      trackLoading = true;
      const tracks = await getUserTracks();
      const track = tracks.find(t => t.id === trackId);
      
      if (!track) {
        error = 'Track not found';
        return;
      }

      name = track.name || '';
      latitude = (track.latitude || 0).toString();
      longitude = (track.longitude || 0).toString();
    } catch (err) {
      error = err.message;
    } finally {
      trackLoading = false;
    }
  };

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
      await updateTrack(trackId, name.trim(), lat, lng);
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

  onMount(loadTrack);
</script>

<div class="edit-page">
  <div class="page-header">
    <h1>Edit Track</h1>
    <Button href="/tracks" tag="a" use={[link]} variant="outlined">← Back to Tracks</Button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if trackLoading}
    <div class="loading-state">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading track...</p>
    </div>
  {:else}
    <Card style="padding: 2rem;">
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-section">
          <h3>Track Information</h3>
          <div class="form-group">
            <Textfield bind:value={name} label="Track Name" required disabled={loading} style="width: 100%;" />
          </div>
        </div>

        <div class="form-section">
          <h3>Location Coordinates</h3>
          <p style="margin-bottom: 1rem; color: var(--color-text-muted);">Update the track's GPS coordinates or use your current location.</p>
          
          <div style="margin-bottom: 1.5rem;">
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

          <div class="form-row">
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
              Updating Track...
            {:else}
              Update Track
            {/if}
          </Button>
        </div>
      </form>
    </Card>
  {/if}
</div>
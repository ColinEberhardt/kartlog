<script>
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { getUserTracks, deleteTrack } from '../lib/firestore/tracks.js';
  import { getUserSessions } from '../lib/firestore/sessions.js';
  import { getUserTyres } from '../lib/firestore/tyres.js';
  import Card from '@smui/card';
  import Button from '@smui/button';
  import CircularProgress from '@smui/circular-progress';
  import LayoutGrid, { Cell } from '@smui/layout-grid';
  import './action-buttons.css';

  let tracks = [];
  let sessions = [];
  let tyres = [];
  let trackStats = {};
  let loading = true;
  let error = '';

  const calculateTrackStats = () => {
    const stats = {};
    
    // Initialize stats for each track
    tracks.forEach(track => {
      stats[track.id] = {
        sessionCount: 0,
        fastestByTyreMake: {}
      };
    });
    
    // Process each session
    sessions.forEach(session => {
      const trackId = session.circuitId;
      if (!trackId || !stats[trackId]) return;
      
      // Increment session count
      stats[trackId].sessionCount++;
      
      // Track fastest lap by tyre make
      if (session.tyreId && session.fastest) {
        const tyre = tyres.find(t => t.id === session.tyreId);
        if (tyre && tyre.make) {
          const tyreMake = tyre.make;
          if (!stats[trackId].fastestByTyreMake[tyreMake]) {
            stats[trackId].fastestByTyreMake[tyreMake] = session.fastest;
          } else {
            stats[trackId].fastestByTyreMake[tyreMake] = Math.min(
              stats[trackId].fastestByTyreMake[tyreMake],
              session.fastest
            );
          }
        }
      }
    });
    
    return stats;
  };

  const loadTracks = async () => {
    try {
      loading = true;
      [tracks, sessions, tyres] = await Promise.all([
        getUserTracks(),
        getUserSessions(),
        getUserTyres()
      ]);
      trackStats = calculateTrackStats();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  const handleDelete = async (trackId) => {
    if (!confirm('Are you sure you want to delete this track?')) {
      return;
    }

    try {
      await deleteTrack(trackId);
      tracks = tracks.filter(track => track.id !== trackId);
    } catch (err) {
      error = err.message;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  const formatCoordinate = (value, type) => {
    if (value === null || value === undefined) return '';
    const direction = type === 'latitude' 
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');
    return `${Math.abs(value).toFixed(6)}°${direction}`;
  };

  const handleTrackClick = (track) => {
    // Navigate to sessions with track filter
    const filter = {
      type: 'track',
      id: track.id,
      label: track.name
    };
    const filterParam = encodeURIComponent(JSON.stringify([filter]));
    window.location.hash = `/sessions?filters=${filterParam}`;
  };

  const formatLapTime = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  };

  onMount(loadTracks);
</script>

<div class="container container-lg">
  <div class="page-header">
    <h1>Tracks</h1>
    <Button href="/tracks/new" tag="a" use={[link]} variant="raised" style="background-color: #007bff;">+ Add New Track</Button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if loading}
    <div class="loading-state">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading tracks...</p>
    </div>
  {:else if tracks.length === 0}
    <div class="empty-state">
      <h2>No tracks yet</h2>
      <p>Start tracking your racing locations by adding your first track.</p>
      <Button href="/tracks/new" tag="a" use={[link]} variant="raised" style="background-color: #007bff;">Add Your First Track</Button>
    </div>
  {:else}
    <LayoutGrid>
      {#each tracks as track (track.id)}
        <Cell spanDevices={{ desktop: 4, tablet: 4, phone: 4 }}>
          <Card class="card-hover track-card">
            <div class="card-clickable" on:click={() => handleTrackClick(track)}>
              {#if track.latitude && track.longitude}
                <img 
                  src="https://maps.googleapis.com/maps/api/staticmap?center={track.latitude},{track.longitude}&zoom=16&size=300x200&maptype=satellite&key=AIzaSyAls1lFlW5xpL4JGB9bss985id7nURl-c4"
                  alt="Satellite view of {track.name}"
                  class="track-map"
                />
              {:else}
                <div class="no-location">No location data available</div>
              {/if}
              
              <div class="card-overlay">
                <div class="card-header">
                  <h3>{track.name}</h3>
                  {#if trackStats[track.id]}
                    <div class="track-stats">
                      <div class="stat-item">
                        <span class="stat-label">Sessions:</span>
                        <span class="stat-value">{trackStats[track.id].sessionCount}</span>
                      </div>
                      {#if Object.keys(trackStats[track.id].fastestByTyreMake).length > 0}
                        <div class="fastest-laps">
                          <div class="stat-label">Fastest Laps:</div>
                          {#each Object.entries(trackStats[track.id].fastestByTyreMake) as [tyreMake, lapTime]}
                            <div class="lap-entry">
                              <span class="tyre-name">{tyreMake}:</span>
                              <span class="lap-time">{formatLapTime(lapTime)}</span>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
                
                <div class="card-actions">
                  <a href="/tracks/{track.id}" use:link class="text-button" title="Edit" on:click|stopPropagation>
                    Edit
                  </a>
                  <button on:click|stopPropagation|preventDefault={() => handleDelete(track.id)} class="text-button delete-button" title="Delete">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </Cell>
      {/each}
    </LayoutGrid>
  {/if}
</div>

<style>
  .card-clickable {
    position: relative;
    cursor: pointer;
    width: 100%;
    height: 100%;
  }

  .track-map {
    width: 100%;
    height: 100%;
    min-height: 200px;
    object-fit: cover;
    object-position: center top;
    filter: brightness(1.4) contrast(2);
  }

  .card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.8) 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .card-header h3 {
    color: white;
    margin: 0;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  }

  .track-stats {
    margin-top: 0.75rem;
    font-size: 0.9rem;
    color: white;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
  }

  .stat-item {
    margin-bottom: 0.5rem;
  }

  .stat-label {
    font-weight: 500;
    margin-right: 0.25rem;
  }

  .stat-value {
    font-weight: 600;
  }

  .fastest-laps {
    margin-top: 0.5rem;
  }

  .fastest-laps .stat-label {
    display: block;
    margin-bottom: 0.25rem;
  }

  .lap-entry {
    display: flex;
    justify-content: space-between;
    padding: 0.125rem 0;
    font-size: 0.85rem;
  }

  .tyre-name {
    font-weight: 500;
  }

  .lap-time {
    font-weight: 600;
    font-family: monospace;
  }

  .no-location {
    padding: 2rem;
    background-color: #f8f9fa;
    color: #6c757d;
    text-align: center;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  </style>

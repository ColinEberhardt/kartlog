<script>
  import { onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { getUserSessions } from '../lib/firestore/sessions.js';
  import { getUserTyres } from '../lib/firestore/tyres.js';
  import { getUserTracks } from '../lib/firestore/tracks.js';
  import { getSetupRecommendation } from '../lib/setupAdvisor.js';
  import { formatGearing } from '../lib/sessionFormat.js';
  import Card from '@smui/card';
  import Button from '@smui/button';
  import Select, { Option } from '@smui/select';
  import Textfield from '@smui/textfield';
  import CircularProgress from '@smui/circular-progress';

  let tracks = [];
  let tyreMakes = [];
  let loading = true;
  let error = '';
  let sessions = [];

  // User inputs
  let conditions = 'dry';
  let temperature = '';
  let trackId = '';
  let tyreMake = '';

  // Results
  let recommendation = null;
  let scoredSessions = [];
  let hasSearched = false;

  const loadData = async () => {
    try {
      loading = true;
      const [sessionsData, tyresData, tracksData] = await Promise.all([
        getUserSessions(true),
        getUserTyres(),
        getUserTracks()
      ]);
      sessions = sessionsData;
      tracks = tracksData;

      // Extract unique tyre makes
      const makes = new Set();
      for (const t of tyresData) {
        if (t.make) makes.add(t.make);
      }
      tyreMakes = [...makes].sort();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  const handleSearch = () => {
    error = '';
    hasSearched = true;

    const criteria = {
      conditions,
      temperature: temperature ? parseFloat(temperature) : null,
      trackId: trackId || null,
      tyreMake: tyreMake || null
    };

    const result = getSetupRecommendation(sessions, criteria);
    recommendation = result.recommendation;
    scoredSessions = result.scoredSessions;
  };

  const confidenceLabel = (level) => {
    if (level === 'high') return 'High';
    if (level === 'medium') return 'Medium';
    if (level === 'low') return 'Low';
    return 'No data';
  };

  const confidenceClass = (level) => {
    if (level === 'high') return 'confidence-high';
    if (level === 'medium') return 'confidence-medium';
    if (level === 'low') return 'confidence-low';
    return 'confidence-none';
  };

  const formatPressure = (val) => {
    if (val == null) return '-';
    return `${val} psi`;
  };

  const formatSprocket = (front, rear, ratio) => {
    if (front == null || rear == null) return '-';
    const r = ratio != null ? ` (${ratio})` : '';
    return `${front}/${rear}${r}`;
  };

  const formatSessionDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTrackName = (circuitId) => {
    const track = tracks.find(t => t.id === circuitId);
    return track ? track.name : 'Unknown';
  };

  onMount(loadData);
</script>

<div class="form-page">
  <div class="header">
    <h1>Setup Advisor</h1>
    <Button href="/sessions" tag="a" use={[link]} variant="outlined">← Back to Sessions</Button>
  </div>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if loading}
    <div class="loading">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading session data...</p>
    </div>
  {:else}
    <!-- Criteria inputs -->
    <Card style="padding: 2rem; margin-bottom: 2rem;">
      <div class="form-section">
        <h3>Conditions</h3>
        <p class="section-description">Select the conditions you expect and we'll recommend the best setup from your history.</p>

        <div class="form-row">
          <div class="form-group">
            <Select bind:value={conditions} label="Conditions" style="width: 100%;">
              <Option value="dry">Dry (Slicks)</Option>
              <Option value="wet">Wet (Wets)</Option>
            </Select>
          </div>

          <div class="form-group">
            <Textfield bind:value={temperature} label="Expected Temperature (°C)" input$inputmode="decimal" style="width: 100%;" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <Select bind:value={trackId} label="Track" style="width: 100%;">
              <Option value="">Any track</Option>
              {#each tracks as track (track.id)}
                <Option value={track.id}>{track.name}</Option>
              {/each}
            </Select>
          </div>

          <div class="form-group">
            <Select bind:value={tyreMake} label="Tyre Make" style="width: 100%;">
              <Option value="">Any make</Option>
              {#each tyreMakes as make}
                <Option value={make}>{make}</Option>
              {/each}
            </Select>
          </div>
        </div>

        <div class="form-actions">
          <Button onclick={handleSearch} variant="raised" disabled={sessions.length === 0}>
            Get Recommendation
          </Button>
        </div>

        {#if sessions.length === 0}
          <p class="no-items">No sessions recorded yet. <a href="#/sessions/new">Add a session</a> to get started.</p>
        {/if}
      </div>
    </Card>

    <!-- Recommendation results -->
    {#if hasSearched && recommendation}
      {#if recommendation.confidence === 'none'}
        <Card style="padding: 2rem;">
          <div class="empty-state">
            <h2>No matching sessions</h2>
            <p>No historical sessions match your selected conditions. Try changing the tyre type or broadening your criteria.</p>
          </div>
        </Card>
      {:else}
        <!-- Confidence banner -->
        <div class="confidence-banner {confidenceClass(recommendation.confidence)}">
          <span class="confidence-label">Confidence: {confidenceLabel(recommendation.confidence)}</span>
          <span class="confidence-detail">Based on {recommendation.matchCount} matching session{recommendation.matchCount !== 1 ? 's' : ''}</span>
        </div>

        <!-- Primary recommendations -->
        <Card style="padding: 2rem; margin-bottom: 1.5rem;">
          <div class="recommendation-section">
            <h3>Tyre Pressures</h3>
            <div class="setup-grid">
              <div class="setup-item">
                <span class="setup-label">Front Inner</span>
                <span class="setup-value">{formatPressure(recommendation.tyrePressures.frontInner)}</span>
              </div>
              <div class="setup-item">
                <span class="setup-label">Front Outer</span>
                <span class="setup-value">{formatPressure(recommendation.tyrePressures.frontOuter)}</span>
              </div>
              <div class="setup-item">
                <span class="setup-label">Rear Inner</span>
                <span class="setup-value">{formatPressure(recommendation.tyrePressures.rearInner)}</span>
              </div>
              <div class="setup-item">
                <span class="setup-label">Rear Outer</span>
                <span class="setup-value">{formatPressure(recommendation.tyrePressures.rearOuter)}</span>
              </div>
            </div>
          </div>

          <div class="recommendation-section">
            <h3>Sprockets</h3>
            <div class="setup-grid">
              <div class="setup-item">
                <span class="setup-label">Gearing</span>
                <span class="setup-value">{formatSprocket(recommendation.sprockets.front, recommendation.sprockets.rear, recommendation.sprockets.ratio)}</span>
              </div>
            </div>
          </div>
        </Card>

        <!-- Secondary recommendations -->
        <Card style="padding: 2rem; margin-bottom: 1.5rem;">
          <div class="recommendation-section">
            <h3>Other Settings</h3>
            <div class="setup-grid">
              <div class="setup-item">
                <span class="setup-label">Caster</span>
                <span class="setup-value">{recommendation.caster || '-'}</span>
              </div>
              <div class="setup-item">
                <span class="setup-label">Ride Height</span>
                <span class="setup-value">{recommendation.rideHeight || '-'}</span>
              </div>
              <div class="setup-item">
                <span class="setup-label">Jet</span>
                <span class="setup-value">{recommendation.jet != null ? recommendation.jet : '-'}</span>
              </div>
            </div>
          </div>
        </Card>

        <!-- Matching sessions table -->
        <Card style="padding: 2rem;">
          <div class="recommendation-section">
            <h3>Matching Sessions</h3>
            <p class="section-description">Sessions used for this recommendation, ordered by relevance.</p>
            <div class="matching-sessions-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Track</th>
                    <th>Temp</th>
                    <th>Tyre</th>
                    <th class="hide-mobile">Pressures (FI/FO/RI/RO)</th>
                    <th class="hide-mobile">Gearing</th>
                    <th>Fastest</th>
                  </tr>
                </thead>
                <tbody>
                  {#each scoredSessions as { session: s, score } (s.id)}
                    <tr>
                      <td>{formatSessionDate(s.date)}</td>
                      <td>{getTrackName(s.circuitId)}</td>
                      <td>{s.temp != null ? `${s.temp}°C` : '-'}</td>
                      <td>{s.tyre?.make || '-'}</td>
                      <td class="hide-mobile">
                        {s.frontInner ?? '-'}/{s.frontOuter ?? '-'}/{s.rearInner ?? '-'}/{s.rearOuter ?? '-'}
                      </td>
                      <td class="hide-mobile">{formatGearing(s)}</td>
                      <td>{s.fastest ? `${s.fastest.toFixed(2)}s` : '-'}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .header h1 {
    margin: 0;
    color: #333;
  }

  .section-description {
    color: #666;
    margin: -0.5rem 0 1.5rem 0;
    font-size: 0.95rem;
  }

  /* Confidence banner */
  .confidence-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }

  .confidence-high {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .confidence-medium {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeeba;
  }

  .confidence-low {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .confidence-none {
    background-color: #e2e3e5;
    color: #383d41;
    border: 1px solid #d6d8db;
  }

  .confidence-label {
    font-size: 1.1rem;
    font-weight: 600;
  }

  .confidence-detail {
    font-size: 0.9rem;
    font-weight: 400;
  }

  /* Recommendation sections */
  .recommendation-section {
    margin-bottom: 2rem;
  }

  .recommendation-section:last-child {
    margin-bottom: 0;
  }

  .recommendation-section h3 {
    margin: 0 0 1.5rem 0;
    color: #495057;
    font-size: 1.25rem;
    font-weight: 600;
    border-left: 4px solid #007bff;
    padding-left: 1rem;
  }

  /* Setup value grid */
  .setup-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .setup-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 6px;
    border-left: 3px solid #007bff;
  }

  .setup-label {
    font-weight: 500;
    color: #666;
  }

  .setup-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #007bff;
  }

  /* Matching sessions table */
  .matching-sessions-table {
    overflow-x: auto;
  }

  .matching-sessions-table table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .matching-sessions-table th,
  .matching-sessions-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e9ecef;
  }

  .matching-sessions-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #495057;
    position: sticky;
    top: 0;
  }

  .matching-sessions-table tbody tr:hover {
    background-color: #f1f3f5;
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 2rem;
  }

  .empty-state h2 {
    color: #666;
    margin-bottom: 1rem;
  }

  .empty-state p {
    color: #888;
  }

  .no-items {
    color: #666;
    font-size: 0.9rem;
    margin-top: 1rem;
  }

  .no-items a {
    color: #007bff;
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .confidence-banner {
      flex-direction: column;
      gap: 0.25rem;
      text-align: center;
    }

    .setup-grid {
      grid-template-columns: 1fr;
    }

    .hide-mobile {
      display: none;
    }
  }
</style>

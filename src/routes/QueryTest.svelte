<script>
  import { onMount } from 'svelte';
  import { initializeDatabase, query, getTables, getTableSchema, isDatabaseInitialized, refreshDatabase } from '../lib/query.js';

  let sqlQuery = '';
  let results = null;
  let error = null;
  let loading = false;
  let initialized = false;
  let stats = null;
  let selectedTable = '';
  let tableSchema = null;

  // Example queries
  const examples = [
    {
      name: 'All Sessions (Latest 10)',
      sql: 'SELECT session_date, circuit_name, session_type, fastest, laps FROM sessions ORDER BY session_date DESC LIMIT 10'
    },
    {
      name: 'Fastest Laps Ever',
      sql: 'SELECT session_date, circuit_name, tyre_name, fastest FROM sessions WHERE fastest IS NOT NULL ORDER BY fastest ASC LIMIT 10'
    },
    {
      name: 'Average Lap Time by Tyre',
      sql: `SELECT 
  tyre_name,
  COUNT(*) as sessions_count,
  ROUND(AVG(fastest), 2) as avg_lap,
  ROUND(MIN(fastest), 2) as best_lap
FROM sessions 
WHERE fastest IS NOT NULL AND tyre_name IS NOT NULL
GROUP BY tyre_name 
ORDER BY avg_lap ASC`
    },
    {
      name: 'Performance by Track',
      sql: `SELECT 
  circuit_name,
  COUNT(*) as sessions_count,
  ROUND(AVG(fastest), 2) as avg_lap,
  ROUND(MIN(fastest), 2) as best_lap,
  ROUND(MAX(fastest), 2) as worst_lap
FROM sessions 
WHERE fastest IS NOT NULL
GROUP BY circuit_name 
ORDER BY sessions_count DESC`
    },
    {
      name: 'Race Results',
      sql: `SELECT 
  session_date, 
  circuit_name, 
  entries, 
  startPos, 
  endPos,
  (startPos - endPos) as positions_gained,
  penalties
FROM sessions 
WHERE isRace = true 
ORDER BY session_date DESC`
    },
    {
      name: 'Tire Pressure Analysis',
      sql: `SELECT 
  tyre_name,
  ROUND(AVG(frontInner), 1) as avg_front_inner,
  ROUND(AVG(frontOuter), 1) as avg_front_outer,
  ROUND(AVG(rearInner), 1) as avg_rear_inner,
  ROUND(AVG(rearOuter), 1) as avg_rear_outer,
  ROUND(AVG(fastest), 2) as avg_lap
FROM sessions 
WHERE tyre_name IS NOT NULL AND fastest IS NOT NULL
GROUP BY tyre_name`
    },
    {
      name: 'Sprocket Combinations',
      sql: `SELECT 
  frontSprocket,
  rearSprocket,
  COUNT(*) as times_used,
  ROUND(AVG(fastest), 2) as avg_lap,
  ROUND(MIN(fastest), 2) as best_lap
FROM sessions 
WHERE fastest IS NOT NULL
GROUP BY frontSprocket, rearSprocket 
ORDER BY times_used DESC`
    },
    {
      name: 'Weather Performance',
      sql: `SELECT 
  weatherCode,
  COUNT(*) as sessions_count,
  ROUND(AVG(temperature), 1) as avg_temp,
  ROUND(AVG(fastest), 2) as avg_lap
FROM sessions 
WHERE fastest IS NOT NULL
GROUP BY weatherCode 
ORDER BY weatherCode`
    },
    {
      name: 'All Tyres',
      sql: 'SELECT * FROM tyres ORDER BY name'
    },
    {
      name: 'All Engines',
      sql: 'SELECT * FROM engines ORDER BY name'
    },
    {
      name: 'All Chassis',
      sql: 'SELECT * FROM chassis ORDER BY name'
    },
    {
      name: 'All Tracks',
      sql: 'SELECT * FROM tracks ORDER BY name'
    }
  ];

  onMount(async () => {
    // Set first example as default
    sqlQuery = examples[0].sql;
  });

  async function initialize() {
    loading = true;
    error = null;
    try {
      stats = await initializeDatabase();
      initialized = true;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function refresh() {
    loading = true;
    error = null;
    results = null;
    try {
      stats = await refreshDatabase();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function executeQuery() {
    if (!initialized) {
      error = 'Database not initialized. Click "Initialize Database" first.';
      return;
    }

    loading = true;
    error = null;
    results = null;
    
    try {
      const queryResults = query(sqlQuery);
      results = queryResults;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function loadExample(example) {
    sqlQuery = example.sql;
    results = null;
    error = null;
  }

  async function showTableSchema() {
    if (!selectedTable) return;
    
    try {
      tableSchema = getTableSchema(selectedTable);
    } catch (err) {
      error = err.message;
    }
  }
</script>

<div style="padding: 20px; max-width: 1400px; margin: 0 auto;">
  <h1>SQL Query Test Interface</h1>
  
  <!-- Initialization -->
  <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border: 1px solid #ddd;">
    <h2>Database Status</h2>
    {#if !initialized}
      <p>Database not initialized.</p>
      <button onclick={initialize} disabled={loading}>
        {loading ? 'Initializing...' : 'Initialize Database'}
      </button>
    {:else}
      <p>✅ Database initialized</p>
      {#if stats}
        <p style="margin: 10px 0;">
          Loaded: {stats.tyres} tyres, {stats.engines} engines, 
          {stats.chassis} chassis, {stats.tracks} tracks, {stats.sessions} sessions
        </p>
      {/if}
      <button onclick={refresh} disabled={loading}>
        {loading ? 'Refreshing...' : 'Refresh Database'}
      </button>
    {/if}
  </div>

  <!-- Table Browser -->
  {#if initialized}
    <div style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border: 1px solid #ddd;">
      <h2>Browse Tables</h2>
      <select bind:value={selectedTable} onchange={showTableSchema}>
        <option value="">Select a table...</option>
        {#each getTables() as table}
          <option value={table}>{table}</option>
        {/each}
      </select>
      
      {#if tableSchema}
        <div style="margin-top: 10px;">
          <h3>Schema for {selectedTable}:</h3>
          <pre style="background: white; padding: 10px; overflow-x: auto;">{JSON.stringify(tableSchema, null, 2)}</pre>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Example Queries -->
  <div style="margin-bottom: 20px;">
    <h2>Example Queries</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
      {#each examples as example}
        <button 
          onclick={() => loadExample(example)}
          style="padding: 10px; text-align: left; background: #e3f2fd; border: 1px solid #90caf9; cursor: pointer;"
        >
          {example.name}
        </button>
      {/each}
    </div>
  </div>

  <!-- Query Input -->
  <div style="margin-bottom: 20px;">
    <h2>SQL Query</h2>
    <p style="padding: 10px; background: #d1ecf1; border: 1px solid #17a2b8; margin-bottom: 10px;">
      ℹ️ <strong>Column Names:</strong> Use <code>session_date</code> (not date), <code>temperature</code> (not temp), <code>session_type</code> (not session)
    </p>
    <textarea 
      bind:value={sqlQuery}
      placeholder="Enter SQL query..."
      style="width: 100%; min-height: 120px; font-family: monospace; padding: 10px; border: 1px solid #ddd;"
    ></textarea>
    <div style="margin-top: 10px;">
      <button 
        onclick={executeQuery} 
        disabled={loading || !initialized}
        style="padding: 10px 20px; background: #4CAF50; color: white; border: none; cursor: pointer; font-size: 16px;"
      >
        {loading ? 'Executing...' : 'Execute Query'}
      </button>
    </div>
  </div>

  <!-- Error Display -->
  {#if error}
    <div style="margin-bottom: 20px; padding: 15px; background: #ffebee; border: 1px solid #ef5350; color: #c62828;">
      <strong>Error:</strong> {error}
    </div>
  {/if}

  <!-- Results Display -->
  {#if results}
    <div style="margin-bottom: 20px;">
      <h2>Results ({results.length} rows)</h2>
      {#if results.length === 0}
        <p>No results found.</p>
      {:else}
        <div style="overflow-x: auto; background: white; border: 1px solid #ddd;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                {#each Object.keys(results[0]) as key}
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-weight: bold;">
                    {key}
                  </th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each results as row}
                <tr>
                  {#each Object.values(row) as value}
                    <td style="padding: 10px; border: 1px solid #ddd;">
                      {value !== null && value !== undefined ? value : '—'}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}

  <!-- JSON View -->
  {#if results && results.length > 0}
    <div style="margin-bottom: 20px;">
      <h2>JSON Output</h2>
      <pre style="background: #f5f5f5; padding: 15px; overflow-x: auto; border: 1px solid #ddd; max-height: 400px;">{JSON.stringify(results, null, 2)}</pre>
    </div>
  {/if}
</div>

<style>
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  button:not(:disabled):hover {
    opacity: 0.9;
  }
  
  h1 {
    margin-bottom: 20px;
  }
  
  h2 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 18px;
  }
  
  h3 {
    margin-top: 0;
    font-size: 16px;
  }
</style>

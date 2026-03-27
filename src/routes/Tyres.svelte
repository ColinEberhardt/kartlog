<script>
  import { onMount } from 'svelte';
  import { push, link } from 'svelte-spa-router';
  import { getUserTyres, deleteTyre, retireTyre } from '../lib/firestore/tyres.js';
  import { getUserSessions } from '../lib/firestore/sessions.js';
  import { calculateItemStats, mergeItemsWithStats } from '../lib/sessionStats.js';
  import DataTable, { Head, Body, Row, Cell } from '@smui/data-table';
  import Button from '@smui/button';
  import IconButton from '@smui/icon-button';
  import Menu from '@smui/menu';
  import List, { Item, Text } from '@smui/list';
  import CircularProgress from '@smui/circular-progress';
  import './table.css';
  import './action-buttons.css';

  let tyres = [];
  let groupedTyres = []; // Array of { make, types: [{ type, tyres: [...] }] }
  let retiredTyres = [];
  let loading = true;
  let error = '';
  let menuMap = {}; // Store menu instances for each row

  const sortByCreatedAt = (a, b) => {
    const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return bDate - aDate;
  };

  const buildGroupedTyres = (allTyres) => {
    const active = allTyres.filter(t => !t.retired);
    retiredTyres = allTyres.filter(t => t.retired).sort(sortByCreatedAt);

    // Group active tyres by make, then by type
    const makeMap = {};
    for (const tyre of active) {
      const make = tyre.make || 'Unknown';
      const type = tyre.type || 'Unknown';
      if (!makeMap[make]) makeMap[make] = {};
      if (!makeMap[make][type]) makeMap[make][type] = [];
      makeMap[make][type].push(tyre);
    }

    // Convert to array structure, sorting each group internally
    groupedTyres = Object.keys(makeMap).sort().map(make => ({
      make,
      types: Object.keys(makeMap[make]).sort().map(type => ({
        type,
        tyres: makeMap[make][type].sort(sortByCreatedAt)
      }))
    }));
  };

  const loadTyres = async () => {
    try {
      loading = true;
      const rawTyres = await getUserTyres();
      const sessions = await getUserSessions();
      
      // Calculate tyre statistics from sessions
      const tyreStats = calculateItemStats(sessions, 'tyreId');
      
      // Merge tyre data with statistics
      const tyresWithStats = mergeItemsWithStats(rawTyres, tyreStats);
      
      tyres = tyresWithStats;
      buildGroupedTyres(tyresWithStats);
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  const handleDelete = async (tyreId) => {
    if (!confirm('Are you sure you want to delete this tyre? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTyre(tyreId);
      await loadTyres(); // Reload the list
    } catch (err) {
      error = err.message;
    }
  };

  const handleRetire = async (tyreId) => {
    if (!confirm('Are you sure you want to retire this tyre?')) {
      return;
    }

    try {
      await retireTyre(tyreId);
      await loadTyres(); // Reload the list
    } catch (err) {
      error = err.message;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  };

  const handleRowClick = (tyre) => {
    if (tyre.sessions > 0) {
      const filters = encodeURIComponent(JSON.stringify([{ type: 'tyre', id: tyre.id, label: tyre.name }]));
      push(`/sessions?filters=${filters}`);
    }
  };

  const handleMenuItemClick = (action, tyreId) => {
    // Close the menu
    if (menuMap[tyreId]) {
      menuMap[tyreId].setOpen(false);
    }
    
    if (action === 'edit') {
      push(`/tyres/${tyreId}`);
    } else if (action === 'retire') {
      handleRetire(tyreId);
    } else if (action === 'delete') {
      handleDelete(tyreId);
    }
  };

  onMount(() => {
    loadTyres();
  });
</script>

<div class="container container-lg">
  <div class="page-header">
    <h1>Tyres</h1>
    <Button href="/tyres/new" tag="a" use={[link]} variant="raised" color="primary">+ Add New Tyre</Button>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  {#if loading}
    <div class="loading-state">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading tyres...</p>
    </div>
  {:else if tyres.length === 0}
    <div class="empty-state">
      <h3>No tyres found</h3>
      <p>Get started by adding your first tyre.</p>
      <Button href="/tyres/new" tag="a" use={[link]} variant="raised" color="primary">Add Tyre</Button>
    </div>
  {:else}
    {#each groupedTyres as makeGroup}
      <div class="group-section">
        <h2 class="make-header">{makeGroup.make}</h2>
        {#each makeGroup.types as typeGroup}
          <h3 class="type-header">{typeGroup.type}</h3>
          <div class="table-container">
            <DataTable style="width: 100%;">
              <Head>
                <Row>
                  <Cell>Name</Cell>
                  <Cell>Laps</Cell>
                  <Cell class="col-sessions">Sessions</Cell>
                  <Cell class="actions-header col-actions">Actions</Cell>
                </Row>
              </Head>
              <Body>
                {#each typeGroup.tyres as tyre (tyre.id)}
                  <Row class="tyre-row">
                    <div 
                      class="clickable-row {tyre.sessions > 0 ? 'has-sessions' : ''}" 
                      on:click={() => handleRowClick(tyre)} 
                      on:keydown={(e) => e.key === 'Enter' && handleRowClick(tyre)} 
                      tabindex="0" 
                      role="button"
                    >
                      <Cell>{tyre.name}</Cell>
                      <Cell>{tyre.totalLaps}</Cell>
                      <Cell class="col-sessions">{tyre.sessions}</Cell>
                      <Cell class="col-actions">
                        <div class="action-buttons desktop-actions">
                          <a href="/tyres/{tyre.id}" use:link class="text-button" on:click|stopPropagation>
                            Edit
                          </a>
                          <button on:click|stopPropagation|preventDefault={() => handleRetire(tyre.id)} class="text-button retire-button">
                            Retire
                          </button>
                          <button on:click|stopPropagation|preventDefault={() => handleDelete(tyre.id)} class="text-button delete-button">
                            Delete
                          </button>
                        </div>
                        <div class="kebab-menu-container" on:click|stopPropagation on:keydown|stopPropagation role="none">
                          <div class="menu-surface-anchor">
                            <button 
                              class="kebab-button-simple" 
                              on:click={() => menuMap[tyre.id]?.setOpen(true)}
                              aria-label="More actions"
                            >
                              ⋮
                            </button>
                            <Menu bind:this={menuMap[tyre.id]}>
                              <List>
                                <Item onSMUIAction={() => handleMenuItemClick('edit', tyre.id)}>
                                  <Text>Edit</Text>
                                </Item>
                                <Item onSMUIAction={() => handleMenuItemClick('retire', tyre.id)}>
                                  <Text>Retire</Text>
                                </Item>
                                <Item onSMUIAction={() => handleMenuItemClick('delete', tyre.id)}>
                                  <Text class="delete-text">Delete</Text>
                                </Item>
                              </List>
                            </Menu>
                          </div>
                        </div>
                      </Cell>
                    </div>
                  </Row>
                {/each}
              </Body>
            </DataTable>
          </div>
        {/each}
      </div>
    {/each}

    {#if retiredTyres.length > 0}
      <div class="group-section retired-section">
        <h2 class="make-header retired-header">Retired</h2>
        <div class="table-container">
          <DataTable style="width: 100%;">
            <Head>
              <Row>
                <Cell>Name</Cell>
                <Cell>Make / Type</Cell>
                <Cell>Laps</Cell>
                <Cell class="col-sessions">Sessions</Cell>
                <Cell class="actions-header col-actions">Actions</Cell>
              </Row>
            </Head>
            <Body>
              {#each retiredTyres as tyre (tyre.id)}
                <Row class="tyre-row retired-row">
                  <div 
                    class="clickable-row {tyre.sessions > 0 ? 'has-sessions' : ''}" 
                    on:click={() => handleRowClick(tyre)} 
                    on:keydown={(e) => e.key === 'Enter' && handleRowClick(tyre)} 
                    tabindex="0" 
                    role="button"
                  >
                    <Cell>{tyre.name}</Cell>
                    <Cell>{tyre.make} / {tyre.type}</Cell>
                    <Cell>{tyre.totalLaps}</Cell>
                    <Cell class="col-sessions">{tyre.sessions}</Cell>
                    <Cell class="col-actions">
                      <div class="action-buttons desktop-actions">
                        <a href="/tyres/{tyre.id}" use:link class="text-button" on:click|stopPropagation>
                          Edit
                        </a>
                        <button on:click|stopPropagation|preventDefault={() => handleDelete(tyre.id)} class="text-button delete-button">
                          Delete
                        </button>
                      </div>
                      <div class="kebab-menu-container" on:click|stopPropagation on:keydown|stopPropagation role="none">
                        <div class="menu-surface-anchor">
                          <button 
                            class="kebab-button-simple" 
                            on:click={() => menuMap[tyre.id]?.setOpen(true)}
                            aria-label="More actions"
                          >
                            ⋮
                          </button>
                          <Menu bind:this={menuMap[tyre.id]}>
                            <List>
                              <Item onSMUIAction={() => handleMenuItemClick('edit', tyre.id)}>
                                <Text>Edit</Text>
                              </Item>
                              <Item onSMUIAction={() => handleMenuItemClick('delete', tyre.id)}>
                                <Text class="delete-text">Delete</Text>
                              </Item>
                            </List>
                          </Menu>
                        </div>
                      </div>
                    </Cell>
                  </div>
                </Row>
              {/each}
            </Body>
          </DataTable>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  /* Group section styles */
  .group-section {
    margin-bottom: 2rem;
  }

  .make-header {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 1.5rem 0 0.5rem;
    color: #333;
  }

  .type-header {
    font-size: 1rem;
    font-weight: 500;
    margin: 0.75rem 0 0.25rem;
    color: #666;
  }

  .retired-header {
    color: #9e9e9e;
  }

  .retired-section {
    opacity: 0.6;
  }

  /* Tyre-specific table styles */
  :global(.tyre-row) {
    position: relative;
  }

  :global(.tyre-row td) {
    vertical-align: middle;
    font-size: 16px;
    overflow: visible;
  }

  :global(.tyre-row td.col-actions) {
    position: relative;
    overflow: visible;
  }

  .clickable-row {
    display: contents;
    cursor: default;
  }

  .clickable-row.has-sessions {
    cursor: pointer;
  }

  .clickable-row.has-sessions:hover :global(td) {
    background-color: rgba(0, 0, 0, 0.04);
  }

  :global(.retired-row td) {
    opacity: 0.6;
  }

  :global(.actions-header) {
    text-align: right;
  }

  /* Kebab menu */
  .kebab-menu-container {
    display: none;
    position: relative;
  }

  .menu-surface-anchor {
    position: relative;
    display: inline-block;
  }

  .kebab-button-simple {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    color: #495057;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .kebab-button-simple:hover {
    background-color: #e9ecef;
    border-radius: 4px;
  }

  .desktop-actions {
    display: flex;
  }

  :global(.kebab-icon-button) {
    color: #495057;
  }

  :global(.delete-menu-item) {
    color: #dc3545;
  }

  :global(.delete-text) {
    color: #dc3545;
  }

  /* Responsive column hiding */
  @media (max-width: 768px) {
    :global(.col-sessions) {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .desktop-actions {
      display: none;
    }

    .kebab-menu-container {
      display: block;
    }

    :global(.actions-header) {
      width: 48px;
    }
  }
</style>

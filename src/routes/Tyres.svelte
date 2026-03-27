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
  let groupedTyres = [];
  let retiredTyres = [];
  let loading = true;
  let error = '';
  let menuMap = {}; // Store menu instances for each row

  const loadTyres = async () => {
    try {
      loading = true;
      const rawTyres = await getUserTyres();
      const sessions = await getUserSessions();
      
      // Calculate tyre statistics from sessions
      const tyreStats = calculateItemStats(sessions, 'tyreId');
      
      // Merge tyre data with statistics
      const tyresWithStats = mergeItemsWithStats(rawTyres, tyreStats);
      
      // Separate active and retired tyres
      const activeTyres = tyresWithStats.filter(tyre => !tyre.retired);
      retiredTyres = tyresWithStats.filter(tyre => tyre.retired);
      
      // Sort retired tyres by createdAt (most recent first)
      retiredTyres.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate - aDate;
      });
      
      // Group active tyres by make, then by type
      const makeGroups = {};
      
      activeTyres.forEach(tyre => {
        if (!makeGroups[tyre.make]) {
          makeGroups[tyre.make] = {};
        }
        if (!makeGroups[tyre.make][tyre.type]) {
          makeGroups[tyre.make][tyre.type] = [];
        }
        makeGroups[tyre.make][tyre.type].push(tyre);
      });
      
      // Sort tyres within each group by createdAt (most recent first)
      Object.keys(makeGroups).forEach(make => {
        Object.keys(makeGroups[make]).forEach(type => {
          makeGroups[make][type].sort((a, b) => {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return bDate - aDate;
          });
        });
      });
      
      // Convert to flat array with group headers for rendering
      groupedTyres = [];
      const sortedMakes = Object.keys(makeGroups).sort();
      
      sortedMakes.forEach(make => {
        const sortedTypes = Object.keys(makeGroups[make]).sort();
        
        sortedTypes.forEach(type => {
          // Add group header
          groupedTyres.push({
            isGroupHeader: true,
            headerText: `${make} - ${type}`,
            make: make,
            type: type
          });
          
          // Add tyres in this group
          groupedTyres.push(...makeGroups[make][type]);
        });
      });
      
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
  {:else if groupedTyres.length === 0 && retiredTyres.length === 0}
    <div class="empty-state">
      <h3>No tyres found</h3>
      <p>Get started by adding your first tyre.</p>
      <Button href="/tyres/new" tag="a" use={[link]} variant="raised" color="primary">Add Tyre</Button>
    </div>
  {:else}
    <div class="table-container">
      <DataTable style="width: 100%;">
        <Head>
          <Row>
            <Cell>Name</Cell>
            <Cell>Make </Cell>
            <Cell>Laps</Cell>
            <Cell class="col-sessions">Sessions</Cell>
            <Cell class="col-status">Status</Cell>
            <Cell class="actions-header col-actions">Actions</Cell>
          </Row>
        </Head>
        <Body>
          {#each groupedTyres as item (item.id || item.headerText)}
            {#if item.isGroupHeader}
              <Row class="group-header-row">
                <Cell colspan="6" class="group-header-cell">
                  <span class="group-header-text">{item.headerText}</span>
                </Cell>
              </Row>
            {:else}
              <Row class="tyre-row">
                <div 
                  class="clickable-row {item.sessions > 0 ? 'has-sessions' : ''}" 
                  on:click={() => handleRowClick(item)} 
                  on:keydown={(e) => e.key === 'Enter' && handleRowClick(item)} 
                  tabindex="0" 
                  role="button"
                >
                  <Cell>{item.name}</Cell>
                  <Cell>{item.make} / {item.type}</Cell>
                  <Cell>{item.totalLaps}</Cell>
                  <Cell class="col-sessions">{item.sessions}</Cell>
                  <Cell class="col-status">
                    <span class="active-badge">Active</span>
                  </Cell>
                  <Cell class="col-actions">
                    <div class="action-buttons desktop-actions">
                      <a href="/tyres/{item.id}" use:link class="text-button" on:click|stopPropagation>
                        Edit
                      </a>
                      <button on:click|stopPropagation|preventDefault={() => handleRetire(item.id)} class="text-button retire-button">
                        Retire
                      </button>
                      <button on:click|stopPropagation|preventDefault={() => handleDelete(item.id)} class="text-button delete-button">
                        Delete
                      </button>
                    </div>
                    <div class="kebab-menu-container" on:click|stopPropagation on:keydown|stopPropagation role="none">
                      <div class="menu-surface-anchor">
                        <button 
                          class="kebab-button-simple" 
                          on:click={() => menuMap[item.id]?.setOpen(true)}
                          aria-label="More actions"
                        >
                          ⋮
                        </button>
                        <Menu bind:this={menuMap[item.id]}>
                          <List>
                            <Item onSMUIAction={() => handleMenuItemClick('edit', item.id)}>
                              <Text>Edit</Text>
                            </Item>
                            <Item onSMUIAction={() => handleMenuItemClick('retire', item.id)}>
                              <Text>Retire</Text>
                            </Item>
                            <Item onSMUIAction={() => handleMenuItemClick('delete', item.id)}>
                              <Text class="delete-text">Delete</Text>
                            </Item>
                          </List>
                        </Menu>
                      </div>
                    </div>
                  </Cell>
                </div>
              </Row>
            {/if}
          {/each}
          
          {#if retiredTyres.length > 0}
            <Row class="group-header-row">
              <Cell colspan="6" class="group-header-cell">
                <span class="group-header-text retired-header">Retired Tyres</span>
              </Cell>
            </Row>
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
                  <Cell class="col-status">
                    <span class="retired-badge">Retired</span>
                  </Cell>
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
          {/if}
        </Body>
      </DataTable>
    </div>
  {/if}
</div>

<style>
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

  /* Group header styles */
  :global(.group-header-row) {
    background-color: #e9ecef !important;
  }

  :global(.group-header-row td) {
    padding: 12px 16px !important;
    border-bottom: 2px solid #dee2e6 !important;
    background-color: #e9ecef !important;
  }

  /* Remove alternating row backgrounds */
  :global(.mdc-data-table__row) {
    background-color: white !important;
  }

  :global(.mdc-data-table__row:nth-child(even)) {
    background-color: white !important;
  }

  .group-header-cell {
    font-weight: 600;
    color: #495057;
    font-size: 14px;
  }

  .group-header-text {
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .retired-header {
    color: #6c757d;
  }

  :global(.actions-header) {
    text-align: right;
  }

  /* Tyre status badges */
  .retired-badge {
    display: inline-block;
    padding: 2px 8px;
    background-color: #9e9e9e;
    color: white;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .active-badge {
    display: inline-block;
    padding: 2px 8px;
    background-color: #4caf50;
    color: white;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
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

  @media (max-width: 640px) {
    :global(.col-status) {
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
<script>
  import { createEventDispatcher } from 'svelte';

  // Props
  export let selectedFilters = []; // Array of { type: string, id: string, label: string }
  export let filterOptions = []; // Array of { type: string, id: string, label: string }
  export let placeholder = "Filter...";
  export let pillColors = {}; // Object mapping type to CSS class suffix, e.g., { session: 'blue', tyre: 'orange' }

  // Local state
  let filterInput = '';
  let filterDropdownOpen = false;
  let filterDropdownActiveIdx = -1;

  const dispatch = createEventDispatcher();

  // Filter options based on input
  $: filteredOptions = filterOptions.filter(option => 
    !filterInput || option.label.toLowerCase().includes(filterInput.toLowerCase())
  );

  function selectFilter(option) {
    // Don't add duplicate filters
    const exists = selectedFilters.some(f => f.type === option.type && f.id === option.id);
    if (!exists) {
      dispatch('add', option);
    }
    filterInput = '';
    filterDropdownOpen = false;
    filterDropdownActiveIdx = -1;
  }

  function removeFilter(index) {
    dispatch('remove', index);
  }

  function handleFilterInput(e) {
    filterInput = e.target.value;
    filterDropdownOpen = true;
    filterDropdownActiveIdx = 0;
    dispatch('input', filterInput);
  }

  function handleFilterBlur() {
    setTimeout(() => {
      filterDropdownOpen = false;
      filterDropdownActiveIdx = -1;
    }, 100);
  }

  function handleFilterKeydown(e) {
    // Handle backspace to remove last pill when input is empty
    if (e.key === 'Backspace' && filterInput === '' && selectedFilters.length > 0) {
      e.preventDefault();
      dispatch('removeLast');
      return;
    }

    if (!filterDropdownOpen || filteredOptions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      filterDropdownActiveIdx = (filterDropdownActiveIdx + 1) % filteredOptions.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      filterDropdownActiveIdx = (filterDropdownActiveIdx - 1 + filteredOptions.length) % filteredOptions.length;
    } else if (e.key === 'Enter') {
      if (filterDropdownActiveIdx >= 0 && filterDropdownActiveIdx < filteredOptions.length) {
        e.preventDefault();
        selectFilter(filteredOptions[filterDropdownActiveIdx]);
      }
    } else if (e.key === 'Escape') {
      filterDropdownOpen = false;
      filterDropdownActiveIdx = -1;
    }
  }

  function getPillClass(type) {
    const suffix = pillColors[type];
    return suffix ? `${suffix}-pill` : '';
  }
</script>

<div class="filter-pills-autocomplete">
  <div class="filter-pills-container">
    {#each selectedFilters as filter, idx}
      <span 
        class="filter-pill {getPillClass(filter.type)}"
      >
        {filter.label}
        <button
          class="pill-remove"
          on:click={() => removeFilter(idx)}
          aria-label="Remove {filter.label} filter"
          type="button"
        >×</button>
      </span>
    {/each}
    <input
      class="filter-input"
      type="text"
      {placeholder}
      bind:value={filterInput}
      on:input={handleFilterInput}
      on:focus={() => { filterDropdownOpen = true; filterDropdownActiveIdx = 0; }}
      on:blur={handleFilterBlur}
      on:keydown={handleFilterKeydown}
      autocomplete="off"
      aria-autocomplete="list"
      aria-controls="filter-list"
      aria-activedescendant={filterDropdownActiveIdx >= 0 ? `filter-item-${filterDropdownActiveIdx}` : undefined}
    />
  </div>
  {#if filterDropdownOpen && filteredOptions.length > 0}
    <ul
      class="filter-dropdown"
      id="filter-list"
      role="listbox"
    >
      {#each filteredOptions as option, idx}
        <li
          id={"filter-item-" + idx}
          class:selected={idx === filterDropdownActiveIdx}
          on:mousedown={() => selectFilter(option)}
          role="option"
          aria-selected={idx === filterDropdownActiveIdx}
        >{option.label}</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .filter-pills-autocomplete {
    position: relative;
  }

  .filter-pills-container {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4em;
    background: #fff;
    padding: 0.3em 0.5em;
    border-radius: 4px;
    min-height: 2.4em;
    box-sizing: border-box;
  }

  .filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    padding: 0.2em 0.6em;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .filter-pill:global(.session-pill) {
    background: #e3f2fd;
    color: #1976d2;
    border: 1px solid #90caf9;
  }

  .filter-pill:global(.tyre-pill) {
    background: #fff3e0;
    color: #f57c00;
    border: 1px solid #ffb74d;
  }

  .filter-pill:global(.track-pill) {
    background: #f3e5f5;
    color: #7b1fa2;
    border: 1px solid #ce93d8;
  }

  .filter-pill:global(.engine-pill) {
    background: #e8f5e9;
    color: #388e3c;
    border: 1px solid #81c784;
  }

  .filter-pill:global(.chassis-pill) {
    background: #fff9c4;
    color: #f57f17;
    border: 1px solid #fdd835;
  }

  .filter-pill:global(.race-pill) {
    background: #fce4ec;
    color: #c2185b;
    border: 1px solid #f48fb1;
  }

  .pill-remove {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.3em;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    margin: 0;
    width: 1.2em;
    height: 1.2em;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.15s;
  }

  .pill-remove:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  .pill-remove:focus {
    outline: 2px solid currentColor;
    outline-offset: 1px;
  }

  .filter-input {
    font-size: 1rem;
    padding: 0.3em 0.5em;
    border: none;
    background: transparent;
    color: #222;
    font-weight: 500;
    outline: none;
    min-width: 120px;
    flex: 1;
  }

  .filter-pills-container:focus-within {
    box-shadow: 0 0 0 2px rgba(0,123,255,0.2);
  }

  .filter-dropdown {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    z-index: 10;
    background: #fff;
    color: #222;
    border: 1px solid #d0d0d0;
    border-radius: 0 0 4px 4px;
    max-height: 180px;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  .filter-dropdown li {
    padding: 0.4em 0.8em;
    cursor: pointer;
    transition: background 0.15s;
  }

  .filter-dropdown li:hover {
    background: #f0f4fa;
  }

  .filter-dropdown li.selected,
  .filter-dropdown li[aria-selected="true"] {
    background: #e6f0ff;
    color: #007bff;
  }
</style>

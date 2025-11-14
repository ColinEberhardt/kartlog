<script>
  import { push } from 'svelte-spa-router';
  import { addTyre } from '../lib/firestore/tyres.js';
  import Card from '@smui/card';
  import Textfield from '@smui/textfield';
  import Select, { Option } from '@smui/select';
  import Checkbox from '@smui/checkbox';
  import FormField from '@smui/form-field';
  import Button from '@smui/button';

  let name = '';
  let make = '';
  let type = '';
  let description = '';
  let retired = false;
  let loading = false;
  let error = '';

  const handleSubmit = async () => {
    if (!name.trim() || !make.trim() || !type.trim()) {
      error = 'Please fill in all required fields (Name, Make and Type)';
      return;
    }

    loading = true;
    error = '';

    try {
      await addTyre(name.trim(), make.trim(), type.trim(), description.trim(), retired);
      push('/tyres');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  const handleCancel = () => {
    push('/tyres');
  };
</script>

<div class="form-page">
  <div class="page-header">
    <h1>Add Tyre</h1>
  </div>

  {#if error}
    <div class="error-message">{error}</div>
  {/if}

  <Card style="padding: 2rem;">
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <Textfield
          variant="outlined"
          bind:value={name}
          label="Name"
          required
          disabled={loading}
          style="width: 100%;"
        />
      </div>

      <div class="form-group">
        <Textfield
          variant="outlined"
          bind:value={make}
          label="Make"
          required
          disabled={loading}
          style="width: 100%;"
        />
      </div>

      <div class="form-group">
        <Select bind:value={type} label="Type" required disabled={loading} style="width: 100%;">
          <Option value="">Select type</Option>
          <Option value="Slick">Slick</Option>
          <Option value="Wet">Wet</Option>
        </Select>
      </div>

      <div class="form-group">
        <Textfield
          variant="outlined"
          bind:value={description}
          label="Description"
          textarea
          disabled={loading}
          style="width: 100%;"
          input$rows={4}
        />
      </div>

      <div class="form-actions">
        <Button type="button" onclick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="raised" disabled={loading} style="background-color: #28a745;">
          {loading ? 'Adding...' : 'Add Tyre'}
        </Button>
      </div>
    </form>
  </Card>
</div>

<style>
  /* Component-specific styles only - utilities handled by global.css */
</style>

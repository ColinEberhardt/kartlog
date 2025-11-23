<script>
  import Router from 'svelte-spa-router';
  import { user, loading } from './lib/stores.js';
  import CircularProgress from '@smui/circular-progress';
  import Login from './routes/Login.svelte';
  import Dashboard from './routes/Dashboard.svelte';
  import NewTyre from './routes/NewTyre.svelte';
  import EditTyre from './routes/EditTyre.svelte';
  import Engines from './routes/Engines.svelte';
  import NewEngine from './routes/NewEngine.svelte';
  import EditEngine from './routes/EditEngine.svelte';
  import Sessions from './routes/Sessions.svelte';
  import NewSession from './routes/NewSession.svelte';
  import EditSession from './routes/EditSession.svelte';
  import ViewSession from './routes/ViewSession.svelte';
  import Tracks from './routes/Tracks.svelte';
  import NewTrack from './routes/NewTrack.svelte';
  import EditTrack from './routes/EditTrack.svelte';
  import Tyres from './routes/Tyres.svelte';
  import Chassis from './routes/Chassis.svelte';
  import NewChassis from './routes/NewChassis.svelte';
  import EditChassis from './routes/EditChassis.svelte';
  import Chat from './routes/Chat.svelte';
  import Navigation from './components/Navigation.svelte';

  import Marketing from './routes/marketing.svelte';
  import { location } from 'svelte-spa-router';

  const routes = {
    '/': Dashboard,
    '/login': Login,
    '/marketing': Marketing,
    '/advertise': Marketing,
    '/tyres': Tyres,
    '/tyres/new': NewTyre,
    '/tyres/:id': EditTyre,
    '/engines': Engines,
    '/engines/new': NewEngine,
    '/engines/:id': EditEngine,
    '/chassis': Chassis,
    '/chassis/new': NewChassis,
    '/chassis/:id': EditChassis,
    '/sessions': Sessions,
    '/sessions/new': NewSession,
    '/sessions/view/:id': ViewSession,
    '/sessions/edit/:id': EditSession,
    '/tracks': Tracks,
    '/tracks/new': NewTrack,
    '/tracks/:id': EditTrack,
    '/chat': Chat
  };

  const publicRoutes = {
    '/': Marketing,
    '/login': Login,
    '/marketing': Marketing,
    '/advertise': Marketing
  };
</script>

<main>
  {#if $loading}
    <div class="loading">
      <CircularProgress style="height: 48px; width: 48px;" indeterminate />
      <p>Loading...</p>
    </div>
  {:else if $user}
    <Navigation />
    <div class={$location === '/chat' ? '' : 'container'}>
      <Router {routes} />
    </div>
  {:else}
    <div class={$location === '/chat' ? '' : 'container'}>
      <Router routes={publicRoutes} />
    </div>
  {/if}
</main>

<style>
  .loading {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.2rem;
    gap: var(--spacing-sm);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }
  }

  main {
    font-family: Arial, sans-serif;
    background-color: #f5f6f7;
    min-height: 100vh;
  }
</style>

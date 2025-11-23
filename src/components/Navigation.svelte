<script>
  import { link, push } from 'svelte-spa-router';
  import { user } from '../lib/stores.js';
  import { auth, signOut } from '../lib/firebase.js';
  import TopAppBar, { Row, Section, Title } from '@smui/top-app-bar';
  import Button from '@smui/button';
  import Menu from '@smui/menu';
  import List, { Item, Text } from '@smui/list';
  import IconButton from '@smui/icon-button';

  let mobileMenuOpen = false;
  let userMenu;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      mobileMenuOpen = false;
      if (userMenu) {
        userMenu.setOpen(false);
      }
      // Navigate to the public marketing/root page after sign out
      push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMobileMenu = () => {
    mobileMenuOpen = !mobileMenuOpen;
  };

  const closeMobileMenu = () => {
    mobileMenuOpen = false;
  };

  const openUserMenu = () => {
    if (userMenu) {
      userMenu.setOpen(true);
    }
  };
</script>

<TopAppBar variant="static" style="background-color: #ffffff; border-bottom: 1px solid #dee2e6;">
  <Row>
    <Section>
      <Title>
        <a href="/" use:link class="logo-link">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
            <line x1="4" y1="22" x2="4" y2="15"/>
          </svg>
          KartLog
        </a>
      </Title>
    </Section>
    <Section align="end" toolbar class="desktop-nav">
      <a href="/sessions" use:link class="nav-link">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Sessions
      </a>
      <a href="/tracks" use:link class="nav-link">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="10" r="3"/>
          <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/>
        </svg>
        Tracks
      </a>
      <a href="/tyres" use:link class="nav-link">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
        Tyres
      </a>
      <a href="/chat" use:link class="nav-link">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Chat
      </a>
      <div class="user-info">
        <div class="menu-surface-anchor">
          <button class="user-icon-button" on:click={openUserMenu} aria-label="User menu">
            <svg class="user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
          <Menu bind:this={userMenu} anchorCorner="BOTTOM_LEFT">
            <List>
              <Item disabled>
                <Text class="user-email-menu">{$user?.email}</Text>
              </Item>
              <Item onSMUIAction={handleSignOut}>
                <Text class="sign-out-text">Sign Out</Text>
              </Item>
            </List>
          </Menu>
        </div>
      </div>
    </Section>
    <Section align="end" toolbar class="mobile-nav">
      <button class="hamburger-button" on:click={toggleMobileMenu} aria-label="Toggle menu">
        {#if mobileMenuOpen}
          ✕
        {:else}
          ☰
        {/if}
      </button>
    </Section>
  </Row>
</TopAppBar>

<div class="mobile-menu" class:open={mobileMenuOpen}>
  <a href="/sessions" use:link class="mobile-nav-link" on:click={closeMobileMenu}>
    <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
    Sessions
  </a>
  <a href="/tracks" use:link class="mobile-nav-link" on:click={closeMobileMenu}>
    <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="10" r="3"/>
      <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 6.9 8 11.7z"/>
    </svg>
    Tracks
  </a>
  <a href="/tyres" use:link class="mobile-nav-link" on:click={closeMobileMenu}>
    <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
    Tyres
  </a>
  <a href="/chat" use:link class="mobile-nav-link" on:click={closeMobileMenu}>
    <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
    Chat
  </a>
  <a href="/marketing" use:link class="mobile-nav-link" on:click={closeMobileMenu}>
    <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
    About
  </a>
  <div class="mobile-user-info">
    <span class="user-email">
      <svg class="user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      {$user?.email}
    </span>
  <Button onclick={handleSignOut} variant="raised" color="secondary" style="background-color: #dc3545; width: 100%;">Sign Out</Button>
  </div>
</div>

<style>
  :global(.desktop-nav) {
    display: flex;
    gap: 0.5rem;
  }

  :global(.mobile-nav) {
    display: none;
  }

  .hamburger-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #495057;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  }

  .hamburger-button:hover {
    background-color: #e9ecef;
    border-radius: 4px;
  }

  .logo-link {
    text-decoration: none;
    color: #000000;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .logo-icon {
    width: 24px;
    height: 24px;
    stroke: #000000;
    flex-shrink: 0;
  }

  .nav-link {
    text-decoration: none;
    color: #495057;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-link:hover {
    background-color: #e9ecef;
  }

  .nav-icon {
    width: 20px;
    height: 20px;
    stroke: #000000;
    flex-shrink: 0;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: 1rem;
    padding-left: 1rem;
    border-left: 1px solid #dee2e6;
    position: relative;
  }

  .menu-surface-anchor {
    position: relative;
    display: inline-block;
  }

  .user-icon-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  }

  .user-icon-button:hover {
    background-color: #e9ecef;
  }

  .user-icon {
    width: 20px;
    height: 20px;
    stroke: #000000;
    flex-shrink: 0;
  }

  :global(.user-email-menu) {
    color: #6c757d;
    font-size: 0.875rem;
  }

  :global(.sign-out-text) {
    color: #dc3545;
    font-weight: 500;
  }

  .user-email {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .mobile-menu {
    flex-direction: column;
    background-color: #ffffff;
    border-bottom: 1px solid #dee2e6;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-in-out;
    display: none;
  }

  @media (max-width: 768px) {
    :global(.desktop-nav) {
      display: none;
    }

    :global(.mobile-nav) {
      display: flex;
    }

    .mobile-menu {
      display: flex;
    }

    .mobile-menu.open {
      max-height: 500px;
    }

    .mobile-nav-link {
      text-decoration: none;
      color: #495057;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e9ecef;
      transition: background-color 0.2s;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mobile-nav-link:hover {
      background-color: #e9ecef;
    }

    .mobile-user-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-top: 2px solid #dee2e6;
    }

    .mobile-user-info .user-email {
      font-size: 0.875rem;
      max-width: 100%;
    }
  }

  @media (max-width: 480px) {
    .user-email {
      max-width: 150px;
    }
  }
</style>

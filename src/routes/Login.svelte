<script>
  import { push } from 'svelte-spa-router';
  import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from '../lib/firebase.js';
  import Card from '@smui/card';
  import Textfield from '@smui/textfield';
  import Button from '@smui/button';

  let email = '';
  let password = '';
  let isSignUp = false;
  let error = '';
  let loading = false;

  const handleEmailAuth = async () => {
    if (!email || !password) {
      error = 'Please fill in all fields';
      return;
    }

    loading = true;
    error = '';

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // After successful authentication, navigate to dashboard
      push('/');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  const handleGoogleAuth = async () => {
    loading = true;
    error = '';

    try {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
  push('/');
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  };

  const toggleMode = () => {
    isSignUp = !isSignUp;
    error = '';
  };
</script>

<div class="login-container">
  <Card style="max-width: 400px; width: 100%; padding: 3rem;">
    <h1>KartLog</h1>
    <h2>{isSignUp ? 'Create Account' : 'Sign In'}</h2>

    {#if error}
      <div class="error-message">{error}</div>
    {/if}

    <form on:submit|preventDefault={handleEmailAuth}>
      <div class="form-group">
        <Textfield
          variant="outlined"
          bind:value={email}
          label="Email"
          type="email"
          required
          disabled={loading}
          style="width: 100%;"
        />
      </div>

      <div class="form-group">
        <Textfield
          variant="outlined"
          bind:value={password}
          label="Password"
          type="password"
          required
          disabled={loading}
          style="width: 100%;"
        />
      </div>

      <Button type="submit" variant="raised" color="primary" disabled={loading} style="width: 100%; margin-bottom: 1rem;">
        {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
      </Button>
    </form>

    <div class="divider">
      <span>or</span>
    </div>

    <Button onclick={handleGoogleAuth} disabled={loading} style="width: 100%; margin-bottom: 1rem;">
      <span class="google-icon">🔑</span>
      <span style="margin-left: 0.5rem;">Continue with Google</span>
    </Button>

    <div class="toggle-mode">
      <p>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <Button onclick={toggleMode} style="padding: 0; min-width: auto; color: #007bff;" disabled={loading}>
          {isSignUp ? 'Sign In' : 'Create Account'}
        </Button>
      </p>
    </div>
  </Card>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f8f9fa;
    padding: 2rem;
  }

  h1 {
    text-align: center;
    color: #007bff;
    margin-bottom: 0.5rem;
    font-size: 2rem;
  }

  h2 {
    text-align: center;
    color: #495057;
    margin-bottom: 2rem;
    font-size: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .divider {
    text-align: center;
    margin: 1.5rem 0;
    position: relative;
  }

  .divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #ced4da;
  }

  .divider span {
    background: white;
    padding: 0 1rem;
    color: #6c757d;
    position: relative;
  }

  .toggle-mode {
    text-align: center;
    margin-top: 2rem;
  }

  .toggle-mode p {
    color: #6c757d;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .google-icon {
    font-size: 1.2rem;
  }
</style>

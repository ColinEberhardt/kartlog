<script>
  import { onMount } from 'svelte';
  import { sendChatMessage, createSystemMessage, getStoredApiKey, storeApiKey } from '../lib/chat.js';
  import Button from '@smui/button';
  import Textfield from '@smui/textfield';
  import Paper from '@smui/paper';
  import CircularProgress from '@smui/circular-progress';

  let messages = [];
  let inputMessage = '';
  let isLoading = false;
  let isStreaming = false;
  let streamingContent = '';
  let messagesContainer;
  let apiKey = '';
  let showApiKeyDialog = false;
  let isConfigured = false;

  onMount(() => {
    // Check if API key is already configured
    const storedKey = getStoredApiKey();
    if (storedKey) {
      apiKey = storedKey;
      isConfigured = true;
      initializeChat();
    } else {
      showApiKeyDialog = true;
    }
  });

  function initializeChat() {
    // Initialize conversation with system message and a UI welcome message
    messages = [createSystemMessage(), {
      role: 'assistant',
      content: 'Hello! I\'m your KartLog AI assistant. I can help you manage and understand your karting equipment and racing data. Ask me about your tyres, engines, chassis, or sessions, and I\'ll provide personalized insights based on your actual data!'
    }];
  }

  function handleSaveApiKey() {
    if (apiKey && apiKey.trim()) {
      storeApiKey(apiKey.trim());
      isConfigured = true;
      showApiKeyDialog = false;
      if (messages.length === 0) {
        initializeChat();
      }
    }
  }

  function handleOpenSettings() {
    showApiKeyDialog = true;
  }

  function handleClearApiKey() {
    storeApiKey(null);
    apiKey = '';
    isConfigured = false;
    messages = [];
    showApiKeyDialog = true;
  }

  function handleCloseDialog() {
    showApiKeyDialog = false;
  }

  function scrollToBottom() {
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }

  async function handleSendMessage() {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    inputMessage = '';

    // Add user message to conversation
    messages = [...messages, {
      role: 'user',
      content: userMessage
    }];

    scrollToBottom();

    isLoading = true;
    isStreaming = true;
    streamingContent = '';

    try {
      await sendChatMessage(
        messages,
        // onChunk callback
        (chunk) => {
          streamingContent += chunk;
          scrollToBottom();
        },
        // onComplete callback
        (assistantMessage) => {
          messages = [...messages, assistantMessage];
          isStreaming = false;
          streamingContent = '';
          isLoading = false;
          scrollToBottom();
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Check if it's an API key issue
      if (error.message.includes('API key') || error.status === 401) {
        messages = [...messages, {
          role: 'assistant',
          content: `Sorry, there was an issue with your API key. Please check your configuration.`
        }];
        showApiKeyDialog = true;
      } else {
        messages = [...messages, {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message}`
        }];
      }
      
      isStreaming = false;
      streamingContent = '';
      isLoading = false;
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  // Filter out system and function messages for display.
  // Also ignore assistant messages that have no textual content (these are usually
  // assistant function_call placeholders returned by the API and cause an empty
  // message bubble to appear before the real, streamed reply arrives).
  $: displayMessages = messages.filter(m => 
    m.role !== 'system' && 
    m.role !== 'function' && 
    // hide assistant messages with empty/whitespace-only content
    !(m.role === 'assistant' && (!m.content || String(m.content).trim() === ''))
  );
</script>

{#if showApiKeyDialog}
  <div class="modal-overlay" role="presentation">
    <div class="modal-content" role="dialog" aria-labelledby="modal-title">
      <h2 id="modal-title">Configure OpenAI API Key</h2>
      <p class="modal-description">
        To use the AI chat assistant, you need to provide your own OpenAI API key. 
        Your key will be stored locally in your browser and never sent to our servers.
      </p>
      <p class="modal-description">
        You can get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI's platform</a>.
      </p>
      <Textfield
        bind:value={apiKey}
        label="OpenAI API Key"
        type="password"
        style="width: 100%; margin-bottom: 1rem;"
      />
      <div class="modal-actions">
        <Button onclick={handleCloseDialog}>Cancel</Button>
        {#if isConfigured}
          <Button onclick={handleClearApiKey}>Clear</Button>
        {/if}
        <Button onclick={handleSaveApiKey} variant="raised">Save</Button>
      </div>
    </div>
  </div>
{/if}

<div class="chat-container">
    <div class="chat-header">
      <h2>AI Assistant</h2>
      <Button onclick={handleOpenSettings} variant="outlined">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"/>
        </svg>
      </Button>
    </div>
    <div class="messages-container" bind:this={messagesContainer}>
      {#each displayMessages as message}
        <div class="message {message.role}">
          <div class="message-avatar">
            {#if message.role === 'user'}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            {:else}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            {/if}
          </div>
          <div class="message-content">
            <div class="message-text">{message.content}</div>
          </div>
        </div>
      {/each}
      
      {#if isStreaming}
        <div class="message assistant">
          <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <div class="message-content">
            <div class="message-text">{streamingContent}<span class="cursor">▊</span></div>
          </div>
        </div>
      {/if}
    </div>

    {#if isConfigured}
      <div class="input-container">
        <div class="input-wrapper">
          <Textfield
            bind:value={inputMessage}
            input$onkeydown={handleKeyDown}
            style="width: 100%;"
            disabled={isLoading}
            label="Type your message..."
          />
          <Button
            onclick={() => handleSendMessage()}
            variant="raised"
            disabled={isLoading || !inputMessage.trim()}
          >
            {#if isLoading}
              <CircularProgress style="height: 20px; width: 20px;" indeterminate />
            {:else}
              <svg class="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            {/if}
          </Button>
        </div>
      </div>
    {:else}
      <div class="input-container">
        <div style="text-align: center; padding: 1rem;">
          <p style="color: #666; margin-bottom: 1rem;">Please configure your OpenAI API key to start chatting.</p>
          <Button onclick={handleOpenSettings} variant="raised">Configure API Key</Button>
        </div>
      </div>
    {/if}
  
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 64px);
    max-width: 1200px;
    margin: 0 auto;
    background: #f8f9fa;
  }

  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #dee2e6;
  }

  .chat-header h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #212529;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 2rem 1rem;
    scroll-behavior: smooth;
  }

  .message {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    animation: fadeIn 0.3s ease-in;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message.user {
    flex-direction: row-reverse;
  }

  .message-avatar {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .message.user .message-avatar {
    background: #0066cc;
    color: white;
  }

  .message.assistant .message-avatar {
    background: #6c757d;
    color: white;
  }

  .message-avatar svg {
    width: 24px;
    height: 24px;
  }

  .message-content {
    max-width: 70%;
  }

  .message-text {
    background: white;
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    color: #212529;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .message.user .message-text {
    background: #0066cc;
    color: white;
  }

  .cursor {
    animation: blink 1s infinite;
    color: #0066cc;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .input-container {
    padding: 1rem;
    background: white;
    border-top: 1px solid #dee2e6;
  }

  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .input-wrapper :global(.mdc-text-field) {
    height: 56px;
  }

  .send-icon {
    width: 20px;
    height: 20px;
  }

  /* Scrollbar styling */
  .messages-container::-webkit-scrollbar {
    width: 8px;
  }

  .messages-container::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  .messages-container::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  .messages-container::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .modal-content h2 {
    margin: 0 0 1rem 0;
    color: #212529;
  }

  .modal-description {
    margin-bottom: 1rem;
    color: #666;
    line-height: 1.5;
  }

  .modal-description a {
    color: #0066cc;
    text-decoration: none;
  }

  .modal-description a:hover {
    text-decoration: underline;
  }

  .modal-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  @media (max-width: 768px) {
    .chat-container {
      height: calc(100vh - 56px);
    }    

    .message-content {
      max-width: 85%;
    }

    .messages-container {
      padding: 1rem 0.5rem;
    }
  }
</style>

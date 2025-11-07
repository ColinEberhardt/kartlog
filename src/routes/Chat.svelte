<script>
  import { onMount } from 'svelte';
  import { sendChatMessage, createSystemMessage, isConfigured } from '../lib/chat.js';
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
  let configured = false;

  onMount(() => {
    configured = isConfigured();
    
    if (configured) {
      // Initialize conversation with system message
      messages = [createSystemMessage()];
      
      // Add welcome message
      messages = [...messages, {
        role: 'assistant',
        content: 'Hello! I\'m your KartLog AI assistant. I can help you manage and understand your karting equipment and racing data. Ask me about your tyres, engines, chassis, or sessions, and I\'ll provide personalized insights based on your actual data!'
      }];
    }
  });

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
      messages = [...messages, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure your OpenAI API key is configured correctly.`
      }];
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

  // Filter out system messages for display
  $: displayMessages = messages.filter(m => m.role !== 'system' && m.role !== 'function');
</script>

<div class="chat-container">
  {#if !configured}
    <div class="config-warning">
      <Paper elevation={4} style="padding: 2rem; max-width: 600px; margin: 2rem auto;">
        <div class="warning-content">
          <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>OpenAI API Key Required</h3>
          <p>To use the AI chat feature, you need to configure your OpenAI API key.</p>
          <div class="config-steps">
            <ol>
              <li>Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI Platform</a></li>
              <li>Create a <code>.env</code> file in the project root</li>
              <li>Add: <code>VITE_OPENAI_API_KEY=your_key_here</code></li>
              <li>Restart the development server</li>
            </ol>
          </div>
          <p class="note"><strong>Note:</strong> For production use, implement a backend proxy to keep your API key secure.</p>
        </div>
      </Paper>
    </div>
  {:else}
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

    <div class="input-container">
      <div class="input-wrapper">
        <Textfield
          bind:value={inputMessage}
          input$onkeydown={handleKeyDown}
          style="width: 100%;"
          disabled={isLoading}
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

  .config-warning {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .warning-content {
    text-align: center;
  }

  .warning-icon {
    width: 64px;
    height: 64px;
    color: #ffc107;
    margin: 0 auto 1rem;
  }

  .warning-content h3 {
    margin: 0 0 1rem 0;
    color: #212529;
  }

  .warning-content p {
    color: #6c757d;
    margin: 0.5rem 0;
  }

  .config-steps {
    text-align: left;
    margin: 1.5rem 0;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .config-steps ol {
    margin: 0;
    padding-left: 1.5rem;
  }

  .config-steps li {
    margin: 0.5rem 0;
    color: #495057;
  }

  .config-steps code {
    background: #e9ecef;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.85rem;
  }

  .note {
    font-size: 0.85rem;
    color: #6c757d;
    margin-top: 1rem;
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

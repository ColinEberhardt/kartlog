# AI Chat Configuration

## Overview

The KartLog application now includes an AI-powered chat interface that uses OpenAI's GPT-4 with function calling to provide intelligent assistance about your tyre inventory.

## Features

- **Natural Language Interaction**: Ask questions about your tyres in plain English
- **Function Calling**: The AI can automatically retrieve your tyre data to answer specific questions
- **Real-time Streaming**: Responses stream in real-time for a better user experience
- **Context-Aware**: The AI understands karting terminology and provides relevant advice

## Setup Instructions

### 1. Get an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the generated API key (you won't be able to see it again!)

### 2. Configure Environment Variable

Create a `.env` file in the project root directory:

```bash
# In the karting-firebase directory
touch .env
```

Add your OpenAI API key to the `.env` file:

```env
VITE_OPENAI_API_KEY=sk-your-api-key-here
```

**Important**: Make sure `.env` is in your `.gitignore` to prevent committing your API key!

### 3. Restart Development Server

After adding the environment variable, restart your development server:

```bash
npm run dev
```

### 4. Access the Chat Interface

Once configured, you can access the chat interface by:
- Clicking "Chat" in the navigation menu
- Or navigating to `/chat` in your browser

## Usage Examples

Try asking the AI assistant questions like:

- "What tyres do I have?"
- "Tell me about my slick tyres"
- "Which tyres are retired?"
- "What's the difference between my wet and dry tyres?"
- "How many tyre sets do I own?"

## How It Works

### Function Calling API

The chat interface uses OpenAI's function calling feature to access your tyre data:

1. User sends a message
2. AI determines if it needs tyre data to answer
3. If needed, it calls the `get_user_tyres` function
4. Function retrieves data from Firestore
5. AI receives the data and formulates a response
6. Response streams back to the user

### Available Functions

- **get_user_tyres**: Retrieves all tyres for the authenticated user
  - Parameters:
    - `includeRetired` (boolean): Whether to include retired tyres (default: true)

## Security Considerations

### Development Environment

Currently, the implementation uses `dangerouslyAllowBrowser: true` which allows the OpenAI SDK to run directly in the browser. This is acceptable for development but has security implications:

- Your API key is exposed in the browser
- Anyone with access to your app can use your API key
- API calls count against your OpenAI usage limits

### Production Recommendations

For production deployment, you should:

1. **Implement a Backend Proxy**:
   ```
   Browser → Your Backend → OpenAI API
   ```

2. **Use Firebase Functions** (recommended for this app):
   - Create a Cloud Function that handles OpenAI requests
   - Store API key in Firebase Environment Config
   - Authenticate users before allowing API calls
   - Implement rate limiting per user

3. **Example Architecture**:
   ```javascript
   // Frontend sends request to your backend
   const response = await fetch('/api/chat', {
     method: 'POST',
     headers: { 'Authorization': userToken },
     body: JSON.stringify({ messages })
   });
   
   // Backend (Cloud Function) calls OpenAI
   // API key stays secure on server
   ```

4. **Additional Security Measures**:
   - Implement user authentication checks
   - Add rate limiting (e.g., 20 messages per user per hour)
   - Monitor API usage and costs
   - Set spending limits in OpenAI dashboard
   - Log all requests for auditing

## Cost Considerations

### GPT-4 Pricing (as of 2024)

- Input: ~$0.03 per 1K tokens
- Output: ~$0.06 per 1K tokens

### Estimated Costs

A typical chat interaction with tyre data:
- System prompt: ~150 tokens
- User message: ~20 tokens
- Function call + data: ~100 tokens
- AI response: ~200 tokens
- **Total per interaction: ~470 tokens = ~$0.015**

For 100 chat interactions per day: ~$1.50/day or ~$45/month

### Cost Optimization Tips

1. Use GPT-4o-mini for lower costs (5-10x cheaper)
2. Implement caching for common questions
3. Set max_tokens limits on responses
4. Consider using embeddings + retrieval for FAQ-style questions

## Troubleshooting

### "OpenAI API Key Required" Warning

- Ensure `.env` file exists in project root
- Verify the variable name is exactly `VITE_OPENAI_API_KEY`
- Restart the development server after creating/modifying `.env`
- Check browser console for any configuration errors

### Function Calling Not Working

- Verify user is authenticated (Firebase Auth)
- Check browser console for Firestore permission errors
- Ensure Firestore security rules allow the user to read their tyres

### API Errors

- **401 Unauthorized**: Invalid API key
- **429 Rate Limit**: Too many requests, wait or upgrade OpenAI plan
- **500 Server Error**: OpenAI service issue, try again later

## Extending the Chat

### Adding More Functions

You can extend the chat to access other data:

```javascript
// In src/lib/chat.js, add new functions:
const functions = [
  // ... existing tyre function
  {
    name: 'get_user_sessions',
    description: 'Retrieves racing sessions for the user',
    parameters: { /* ... */ }
  }
];

// Add handler in executeFunctionCall
if (functionName === 'get_user_sessions') {
  const sessions = await getUserSessions();
  return { success: true, data: sessions };
}
```

### Customizing AI Behavior

Modify the system message in `src/lib/chat.js`:

```javascript
export function createSystemMessage() {
  return {
    role: 'system',
    content: `Your custom instructions here...`
  };
}
```

## Resources

- [OpenAI Function Calling Guide](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

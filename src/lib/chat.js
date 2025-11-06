import OpenAI from 'openai';
import { getUserTyres } from './tyres.js';

// Initialize OpenAI client
// API key should be set in environment variable VITE_OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: For production, implement a backend proxy
});

// Define the function schema for getting user tyres
const functions = [
  {
    name: 'get_user_tyres',
    description: 'Retrieves all tyres owned by the current user. Returns information about each tyre including name, make, type, description, and retirement status. Use this when the user asks about their tyres, tyre inventory, or wants information about specific tyres.',
    parameters: {
      type: 'object',
      properties: {
        includeRetired: {
          type: 'boolean',
          description: 'Whether to include retired tyres in the results. Defaults to true.',
          default: true
        }
      }
    }
  }
];

// Function to execute the actual tyre retrieval
async function executeFunctionCall(functionName, functionArgs) {
  if (functionName === 'get_user_tyres') {
    try {
      const tyres = await getUserTyres();
      const includeRetired = functionArgs.includeRetired !== false;
      
      const filteredTyres = includeRetired 
        ? tyres 
        : tyres.filter(tyre => !tyre.retired);
      
      return {
        success: true,
        data: filteredTyres.map(tyre => ({
          id: tyre.id,
          name: tyre.name,
          make: tyre.make,
          type: tyre.type,
          description: tyre.description,
          retired: tyre.retired
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  return {
    success: false,
    error: 'Unknown function'
  };
}

// Main chat function with streaming support
export async function sendChatMessage(messages, onChunk, onComplete) {
  try {
    // Create initial chat completion request
    let response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      functions: functions,
      function_call: 'auto',
      stream: false // We'll handle function calls first, then stream final response
    });

    let assistantMessage = response.choices[0].message;

    // Handle function calling loop
    while (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      const functionArgs = JSON.parse(assistantMessage.function_call.arguments);
      
      // Execute the function
      const functionResult = await executeFunctionCall(functionName, functionArgs);
      
      // Add assistant's function call to messages
      messages.push(assistantMessage);
      
      // Add function result to messages
      messages.push({
        role: 'function',
        name: functionName,
        content: JSON.stringify(functionResult)
      });
      
      // Get next response
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        functions: functions,
        function_call: 'auto',
        stream: false
      });
      
      assistantMessage = response.choices[0].message;
    }

    // Now stream the final response
    const streamResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [...messages, assistantMessage],
      stream: true
    });

    let fullContent = '';
    
    for await (const chunk of streamResponse) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullContent += content;
        if (onChunk) {
          onChunk(content);
        }
      }
    }

    // Return the complete assistant message
    const finalMessage = {
      role: 'assistant',
      content: fullContent
    };

    if (onComplete) {
      onComplete(finalMessage);
    }

    return finalMessage;

  } catch (error) {
    console.error('Error in chat:', error);
    throw error;
  }
}

// Helper function to create a system message with context
export function createSystemMessage() {
  return {
    role: 'system',
    content: `You are a helpful AI assistant for a go-kart racing app called KartLog. 
You help users manage and understand their karting equipment, particularly their tyres.
You have access to the user's tyre inventory through the get_user_tyres function.

When discussing tyres, be knowledgeable about:
- Different tyre types (slicks, wets, intermediates)
- Tyre wear patterns and maintenance
- Performance characteristics
- When to retire tyres

Always be friendly, concise, and focused on helping users make better decisions about their karting equipment.
When providing tyre information, format it clearly and highlight key details.`
  };
}

// Validate that API key is configured
export function isConfigured() {
  return !!import.meta.env.VITE_OPENAI_API_KEY;
}

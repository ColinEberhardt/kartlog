import OpenAI from 'openai';
import { getUserTyres } from './tyres.js';
import { getUserEngines } from './engines.js';
import { getUserChassis } from './chassis.js';
import { getUserSessions } from './sessions.js';

// Initialize OpenAI client
// API key should be set in environment variable VITE_OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: For production, implement a backend proxy
});

// Define the function schemas for accessing user data
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
  },
  {
    name: 'get_user_engines',
    description: 'Retrieves all engines owned by the current user. Returns information about each engine including name, make, model, serial number, and retirement status. Use this when the user asks about their engines, engine inventory, or wants information about specific engines.',
    parameters: {
      type: 'object',
      properties: {
        includeRetired: {
          type: 'boolean',
          description: 'Whether to include retired engines in the results. Defaults to true.',
          default: true
        }
      }
    }
  },
  {
    name: 'get_user_chassis',
    description: 'Retrieves all chassis owned by the current user. Returns information about each chassis including name, make, model, serial number, and retirement status. Use this when the user asks about their chassis, chassis inventory, or wants information about specific chassis.',
    parameters: {
      type: 'object',
      properties: {
        includeRetired: {
          type: 'boolean',
          description: 'Whether to include retired chassis in the results. Defaults to true.',
          default: true
        }
      }
    }
  },
  {
    name: 'get_user_sessions',
    description: 'Retrieves racing sessions for the current user. Returns detailed session data including date, circuit, weather, equipment used (tyres, engine, chassis), kart setup (sprockets, tire pressures, etc.), lap times, and race results. Use this when the user asks about their sessions, race history, lap times, or performance data. Can optionally limit the number of results.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of sessions to return. If not specified, returns all sessions.',
          default: null
        }
      }
    }
  }
];

// Function to execute the actual data retrieval
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
  
  if (functionName === 'get_user_engines') {
    try {
      const engines = await getUserEngines();
      const includeRetired = functionArgs.includeRetired !== false;
      
      const filteredEngines = includeRetired 
        ? engines 
        : engines.filter(engine => !engine.retired);
      
      return {
        success: true,
        data: filteredEngines.map(engine => ({
          id: engine.id,
          name: engine.name,
          make: engine.make,
          model: engine.model,
          serialNumber: engine.serialNumber,
          description: engine.description,
          retired: engine.retired
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  if (functionName === 'get_user_chassis') {
    try {
      const chassis = await getUserChassis();
      const includeRetired = functionArgs.includeRetired !== false;
      
      const filteredChassis = includeRetired 
        ? chassis 
        : chassis.filter(ch => !ch.retired);
      
      return {
        success: true,
        data: filteredChassis.map(ch => ({
          id: ch.id,
          name: ch.name,
          make: ch.make,
          model: ch.model,
          serialNumber: ch.serialNumber,
          description: ch.description,
          retired: ch.retired
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  if (functionName === 'get_user_sessions') {
    try {
      const sessions = await getUserSessions();
      const limit = functionArgs.limit;
      
      const limitedSessions = limit ? sessions.slice(0, limit) : sessions;
      
      return {
        success: true,
        data: limitedSessions.map(session => ({
          id: session.id,
          date: session.date,
          circuitId: session.circuitId,
          session: session.session,
          temp: session.temp,
          weatherCode: session.weatherCode,
          tyreId: session.tyreId,
          engineId: session.engineId,
          chassisId: session.chassisId,
          rearSprocket: session.rearSprocket,
          frontSprocket: session.frontSprocket,
          caster: session.caster,
          rideHeight: session.rideHeight,
          jet: session.jet,
          rearInner: session.rearInner,
          rearOuter: session.rearOuter,
          frontInner: session.frontInner,
          frontOuter: session.frontOuter,
          laps: session.laps,
          fastest: session.fastest,
          isRace: session.isRace,
          entries: session.entries,
          startPos: session.startPos,
          endPos: session.endPos,
          penalties: session.penalties,
          notes: session.notes
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
You help users manage and understand their karting equipment and racing data.
You have access to the user's complete karting inventory and session history through these functions:
- get_user_tyres: Access tyre inventory
- get_user_engines: Access engine inventory
- get_user_chassis: Access chassis inventory
- get_user_sessions: Access racing session data including lap times, setup details, and results

When discussing equipment:
- Tyres: different types (slicks, wets, intermediates), wear patterns, maintenance, performance characteristics
- Engines: makes, models, serial numbers, maintenance schedules
- Chassis: makes, models, serial numbers, setup preferences
- Sessions: lap times, weather conditions, kart setup (sprockets, tire pressures, etc.), race results

Provide insights by analyzing patterns across sessions:
- Compare performance with different equipment combinations
- Identify trends in lap times and conditions
- Suggest setup adjustments based on historical data
- Help track equipment usage and retirement decisions

Whenever discussion setup related topics, fetch the most recent kart setup from the most recent session and apply the advice you give to the current kart setup.

Always be friendly, concise, and focused on helping users make better decisions about their karting.
When providing information, format it clearly and highlight key insights.`
  };
}

// Validate that API key is configured
export function isConfigured() {
  return !!import.meta.env.VITE_OPENAI_API_KEY;
}

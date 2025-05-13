// create-itinerary.js - Script for generating daily itineraries
const axios = require('axios');
const fs = require('fs');
const moment = require('moment');

async function main() {
  try {
    const command = process.argv[2] || '';
    const details = process.argv[3] || '';
    const issueNumber = process.argv[4] || '';
    
    console.log(`Creating itinerary based on: ${command}`);
    
    // Extract date from command or details, default to today
    const date = extractDate(command) || extractDate(details) || moment().format('YYYY-MM-DD');
    
    // Generate the itinerary using AI
    const itinerary = await generateItinerary(date, details);
    
    // Create a file with the itinerary
    const fileName = `itinerary-${date}.md`;
    fs.writeFileSync(fileName, itinerary);
    
    // Write the response to the standard response file
    fs.writeFileSync('response.md', `## Daily Itinerary - ${date}\n\nI've created your itinerary for ${date}. You can find it in the repository as [${fileName}](${fileName}).\n\n### Preview\n\n${itinerary.substring(0, 500)}${itinerary.length > 500 ? '...' : ''}`);
    
    // Signal that we should commit changes
    fs.writeFileSync('commit_changes', 'true');
    
    console.log('Itinerary created successfully');
  } catch (error) {
    console.error('Error creating itinerary:', error);
    fs.writeFileSync('response.md', `## Butler AI Assistant Error\n\nI apologize, but I encountered an error creating your itinerary:\n\n\`\`\`\n${error.message}\n\`\`\``);
  }
}

function extractDate(text) {
  if (!text) return null;
  
  // Try to match dates in various formats
  const dateRegex = /\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2}\/\d{2}|today|tomorrow|yesterday)\b/i;
  const match = text.match(dateRegex);
  
  if (match) {
    const dateText = match[1].toLowerCase();
    
    if (dateText === 'today') {
      return moment().format('YYYY-MM-DD');
    } else if (dateText === 'tomorrow') {
      return moment().add(1, 'days').format('YYYY-MM-DD');
    } else if (dateText === 'yesterday') {
      return moment().subtract(1, 'days').format('YYYY-MM-DD');
    } else {
      // Try to parse the date string
      return moment(dateText).format('YYYY-MM-DD');
    }
  }
  
  return null;
}

async function generateItinerary(date, details) {
  // Try OpenAI first, fall back to Anthropic if needed
  try {
    return await generateItineraryWithOpenAI(date, details);
  } catch (error) {
    console.error('Error with OpenAI, falling back to Anthropic:', error.message);
    return await generateItineraryWithAnthropic(date, details);
  }
}

async function generateItineraryWithOpenAI(date, details) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  
  const formattedDate = moment(date).format('MMMM D, YYYY');
  
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are Butler, a sophisticated AI assistant that creates detailed daily itineraries.
                   You speak formally and professionally, like a British butler.
                   Create a well-structured itinerary for ${formattedDate} in Markdown format.
                   Include sections for morning routine, work tasks, meetings, breaks, and evening activities.
                   Be specific with times and activities. Make reasonable assumptions based on a typical professional schedule.
                   Include some focus time blocks for deep work and proper breaks for meals and rest.`
        },
        {
          role: 'user',
          content: `Create a detailed itinerary for ${formattedDate}.${details ? '\n\nAdditional preferences: ' + details : ''}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );
  
  return response.data.choices[0].message.content;
}

async function generateItineraryWithAnthropic(date, details) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key is not configured');
  }
  
  const formattedDate = moment(date).format('MMMM D, YYYY');
  
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      system: `You are Butler, a sophisticated AI assistant that creates detailed daily itineraries.
              You speak formally and professionally, like a British butler.
              Create a well-structured itinerary for ${formattedDate} in Markdown format.
              Include sections for morning routine, work tasks, meetings, breaks, and evening activities.
              Be specific with times and activities. Make reasonable assumptions based on a typical professional schedule.
              Include some focus time blocks for deep work and proper breaks for meals and rest.`,
      messages: [
        {
          role: 'user',
          content: `Create a detailed itinerary for ${formattedDate}.${details ? '\n\nAdditional preferences: ' + details : ''}`
        }
      ]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }
  );
  
  return response.data.content[0].text;
}

main();

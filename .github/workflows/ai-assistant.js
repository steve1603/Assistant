// ai-assistant.js - Main script for AI processing
const axios = require('axios');
const fs = require('fs');

async function main() {
  try {
    const command = process.argv[2] || '';
    const details = process.argv[3] || '';
    const issueNumber = process.argv[4] || '';
    
    console.log(`Processing AI assistant command: ${command}`);
    
    // First try OpenAI API
    let response;
    try {
      response = await callOpenAI(command, details);
    } catch (error) {
      console.error('Error calling OpenAI, falling back to Anthropic:', error.message);
      response = await callAnthropic(command, details);
    }
    
    // Write the response to a file
    fs.writeFileSync('response.md', formatResponse(response));
    
    // Signal that we should commit changes
    if (command.includes('generate') || command.includes('update')) {
      fs.writeFileSync('commit_changes', 'true');
    }
    
    console.log('Processing complete');
  } catch (error) {
    console.error('Error in AI assistant:', error);
    fs.writeFileSync('response.md', `## Butler AI Assistant Error\n\nI apologize, but I encountered an error processing your request:\n\n\`\`\`\n${error.message}\n\`\`\``);
  }
}

async function callOpenAI(command, details) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are Butler, a sophisticated AI assistant that helps manage tasks, schedule appointments, and provide helpful information.
                   You speak formally and professionally, like a British butler. Be concise but thorough.
                   When responding, provide the information in Markdown format for better readability.
                   Current date: ${new Date().toISOString().split('T')[0]}`
        },
        {
          role: 'user',
          content: details ? `${command}\n\nAdditional details: ${details}` : command
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
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

async function callAnthropic(command, details) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key is not configured');
  }
  
  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      system: `You are Butler, a sophisticated AI assistant that helps manage tasks, schedule appointments, and provide helpful information.
              You speak formally and professionally, like a British butler. Be concise but thorough.
              When responding, provide the information in Markdown format for better readability.
              Current date: ${new Date().toISOString().split('T')[0]}`,
      messages: [
        {
          role: 'user',
          content: details ? `${command}\n\nAdditional details: ${details}` : command
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

function formatResponse(text) {
  return `## Butler AI Response\n\n${text}\n\n---\n*Processed by Butler AI Assistant - GitHub Actions Automation*`;
}

main();

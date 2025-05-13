// nlpManager.js - Handles natural language processing using OpenAI

const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

class NLPManager {
  constructor() {
    // Initialize OpenAI client
    // In production, use environment variables or a secure config
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here', // Replace with actual API key or use environment variable
    });
    
    // Store conversation history
    this.conversationHistory = [];
    this.maxHistoryLength = 10; // Keep last 10 exchanges
    
    // Add system prompt to define butler persona
    this.systemPrompt = `
      You are a sophisticated butler AI assistant named Butler. You speak formally and professionally, 
      addressing the user as "sir" or "madam" based on their preference. Your tone is polite, efficient, 
      and slightly British in style. You're attentive to details and always aim to be helpful.
      
      You can:
      1. Manage tasks and reminders
      2. Schedule appointments and meetings
      3. Create daily itineraries
      4. Offer recommendations and suggestions
      5. Keep the user on track with their goals
      
      Always respond concisely but thoroughly. If you need to take an action, explain what you're doing.
      When scheduling, always confirm the date, time, and description.
      When creating tasks, confirm the description, due date, and priority.
    `;
    
    // Load user preferences
    this.userPreferences = this.loadUserPreferences();
  }
  
  // Load user preferences
  loadUserPreferences() {
    const preferencesPath = path.join(__dirname, 'data', 'preferences.json');
    
    try {
      if (fs.existsSync(preferencesPath)) {
        const data = fs.readFileSync(preferencesPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
    
    // Default preferences
    return {
      userName: 'Sir',
      workHours: {
        start: '9:00',
        end: '17:00'
      },
      focusTime: 45, // minutes
      breakTime: 15, // minutes
      notificationPreferences: {
        tasks: true,
        appointments: true,
        reminders: true
      }
    };
  }
  
  // Process user message and generate assistant response
  async processMessage(message, contextData = {}) {
    // Add message to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: message
    });
    
    // Prepare messages array with system prompt and conversation history
    const messages = [
      {
        role: 'system',
        content: this.systemPrompt + 
          `\nUser preferences: ${JSON.stringify(this.userPreferences)}\n` +
          `\nCurrent contextual data: ${JSON.stringify(contextData)}\n`
      },
      ...this.conversationHistory.slice(-this.maxHistoryLength)
    ];
    
    try {
      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo', // or your preferred model
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      });
      
      const response = completion.choices[0].message.content;
      
      // Add assistant response to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: response
      });
      
      // Parse the response to extract structured data and commands
      return this.parseResponse(response);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return {
        type: 'error',
        content: `I apologize, but I seem to be having some difficulty processing your request. Please try again in a moment.`,
        error: error.message
      };
    }
  }
  
  // Parse assistant response to extract structured data and commands
  parseResponse(response) {
    // Check for command patterns in the response
    const schedulingPattern = /I've (scheduled|added|created|set up) ["'](.+?)["'] (for|on) (.+?)(?: at (.+?))?([.,]|$)/i;
    const taskPattern = /I've (added|created) (a task|a reminder|the task) ["'](.+?)["'](?: with (.+?) priority)?(?: due (on|by) (.+?))?([.,]|$)/i;
    const itineraryPattern = /(Here's|I've prepared) your itinerary/i;
    
    let result = {
      type: 'text',
      content: response,
      action: null,
      data: {}
    };
    
    // Check for scheduling actions
    const schedulingMatch = response.match(schedulingPattern);
    if (schedulingMatch) {
      result.type = 'scheduling';
      result.action = 'create_appointment';
      result.data = {
        description: schedulingMatch[2],
        date: schedulingMatch[4],
        time: schedulingMatch[5] || '',
      };
    }
    
    // Check for task actions
    const taskMatch = response.match(taskPattern);
    if (taskMatch) {
      result.type = 'task';
      result.action = 'create_task';
      result.data = {
        description: taskMatch[3],
        priority: taskMatch[4] || 'medium',
        dueDate: taskMatch[6] || '',
      };
    }
    
    // Check for itinerary actions
    if (itineraryPattern.test(response)) {
      result.type = 'itinerary';
      result.action = 'create_itinerary';
    }
    
    return result;
  }
  
  // Update user preferences
  updateUserPreferences(newPreferences) {
    this.userPreferences = { ...this.userPreferences, ...newPreferences };
    
    // Save to file
    try {
      const preferencesPath = path.join(__dirname, 'data', 'preferences.json');
      fs.writeFileSync(preferencesPath, JSON.stringify(this.userPreferences, null, 2));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
    
    return this.userPreferences;
  }
}

module.exports = NLPManager;

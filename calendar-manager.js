// calendarManager.js - Handles calendar integration

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const readline = require('readline');

class CalendarManager {
  constructor() {
    // Configuration for Google Calendar API
    this.SCOPES = ['https://www.googleapis.com/auth/calendar'];
    this.TOKEN_PATH = path.join(__dirname, 'data', 'token.json');
    this.CREDENTIALS_PATH = path.join(__dirname, 'data', 'credentials.json');
    
    this.calendarId = 'primary'; // Use the primary calendar by default
    this.authorized = false;
    this.auth = null;
    
    // Initialize authorization
    this.initialize();
  }
  
  // Initialize the calendar manager
  async initialize() {
    try {
      // Check if credentials file exists
      if (fs.existsSync(this.CREDENTIALS_PATH)) {
        const content = fs.readFileSync(this.CREDENTIALS_PATH);
        const credentials = JSON.parse(content);
        await this.authorize(credentials);
      } else {
        console.log('Google Calendar credentials not found. Calendar integration disabled.');
      }
    } catch (error) {
      console.error('Error initializing calendar manager:', error);
    }
  }
  
  // Authorize with Google
  async authorize(credentials) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]
    );
    
    // Check if we have previously stored a token
    try {
      if (fs.existsSync(this.TOKEN_PATH)) {
        const token = fs.readFileSync(this.TOKEN_PATH);
        oAuth2Client.setCredentials(JSON.parse(token));
        this.auth = oAuth2Client;
        this.authorized = true;
        console.log('Calendar authorization successful');
      } else {
        await this.getNewToken(oAuth2Client);
      }
    } catch (error) {
      console.error('Error authorizing with Google:', error);
      await this.getNewToken(oAuth2Client);
    }
  }
  
  // Get a new OAuth token
  async getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
    });
    
    console.log('Authorize this app by visiting this url:', authUrl);
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    // This will need to be handled by the UI in a real implementation
    rl.question('Enter the code from that page here: ', async (code) => {
      rl.close();
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        
        // Save the token for future use
        fs.writeFileSync(this.TOKEN_PATH, JSON.stringify(tokens));
        console.log('Token stored to', this.TOKEN_PATH);
        
        this.auth = oAuth2Client;
        this.authorized = true;
      } catch (error) {
        console.error('Error retrieving access token:', error);
      }
    });
  }
  
  // Create a new calendar event
  async createEvent(event) {
    if (!this.authorized) {
      return {
        success: false,
        error: 'Calendar not authorized. Please set up Google Calendar integration.'
      };
    }
    
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.auth });
      
      // Parse date and time
      const dateTime = this.parseDateTime(event.date, event.time);
      
      // Create calendar event
      const calendarEvent = {
        summary: event.description,
        description: event.description,
        start: {
          dateTime: dateTime.start,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: dateTime.end,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 30 },
            { method: 'email', minutes: 60 },
          ],
        },
      };
      
      const response = await calendar.events.insert({
        calendarId: this.calendarId,
        resource: calendarEvent,
      });
      
      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Get calendar events for a specific day
  async getEvents(date = 'today') {
    if (!this.authorized) {
      return {
        success: false,
        error: 'Calendar not authorized. Please set up Google Calendar integration.'
      };
    }
    
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.auth });
      
      // Parse date
      const { startTime, endTime } = this.getTimeRange(date);
      
      const response = await calendar.events.list({
        calendarId: this.calendarId,
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });
      
      const events = response.data.items.map(event => {
        return {
          id: event.id,
          summary: event.summary,
          description: event.description || '',
          start: event.start.dateTime || event.start.date,
          end: event.end.dateTime || event.end.date,
          htmlLink: event.htmlLink
        };
      });
      
      return {
        success: true,
        events
      };
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  // Parse date and time strings
  parseDateTime(dateStr, timeStr) {
    const now = new Date();
    let startDate = new Date();
    
    // Parse date
    if (dateStr.toLowerCase() === 'today') {
      // Use today's date
    } else if (dateStr.toLowerCase() === 'tomorrow') {
      startDate.setDate(startDate.getDate() + 1);
    } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(dateStr.toLowerCase())) {
      // Set to next occurrence of the day
      const days = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
      const targetDay = days[dateStr.toLowerCase()];
      const currentDay = startDate.getDay();
      const daysToAdd = (targetDay + 7 - currentDay) % 7;
      startDate.setDate(startDate.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
    } else {
      // Try to parse as MM/DD/YYYY
      const dateParts = dateStr.split('/');
      if (dateParts.length >= 2) {
        const month = parseInt(dateParts[0]) - 1; // 0-indexed months
        const day = parseInt(dateParts[1]);
        const year = dateParts.length > 2 ? parseInt(dateParts[2]) : now.getFullYear();
        startDate = new Date(year, month, day);
      }
    }
    
    // Reset time part
    startDate.setHours(0, 0, 0, 0);
    
    // Parse time
    let startDateTime = new Date(startDate);
    let endDateTime = new Date(startDate);
    
    if (timeStr) {
      const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?(?:\s*(am|pm))?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
        
        // Handle AM/PM
        if (ampm === 'pm' && hours < 12) {
          hours += 12;
        } else if (ampm === 'am' && hours === 12) {
          hours = 0;
        }
        
        startDateTime.setHours(hours, minutes, 0, 0);
        endDateTime = new Date(startDateTime);
        endDateTime.setHours(hours + 1, minutes, 0, 0); // Default to 1 hour event
      }
    } else {
      // Default to all-day event
      startDateTime.setHours(9, 0, 0, 0); // Default to 9 AM
      endDateTime.setHours(10, 0, 0, 0); // Default to 1 hour event
    }
    
    return {
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString()
    };
  }
  
  // Get time range for a specific day
  getTimeRange(dateStr) {
    const now = new Date();
    let date = new Date();
    
    // Parse date
    if (dateStr.toLowerCase() === 'today') {
      // Use today's date
    } else if (dateStr.toLowerCase() === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(dateStr.toLowerCase())) {
      // Set to next occurrence of the day
      const days = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
      const targetDay = days[dateStr.toLowerCase()];
      const currentDay = date.getDay();
      const daysToAdd = (targetDay + 7 - currentDay) % 7;
      date.setDate(date.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
    } else {
      // Try to parse as MM/DD/YYYY
      const dateParts = dateStr.split('/');
      if (dateParts.length >= 2) {
        const month = parseInt(dateParts[0]) - 1; // 0-indexed months
        const day = parseInt(dateParts[1]);
        const year = dateParts.length > 2 ? parseInt(dateParts[2]) : now.getFullYear();
        date = new Date(year, month, day);
      }
    }
    
    // Set start to beginning of day, end to end of day
    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);
    
    return { startTime, endTime };
  }
}

module.exports = CalendarManager;

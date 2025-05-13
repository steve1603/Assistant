// TaskManager.js - Handles all task-related functionality

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const dataPath = path.join(__dirname, 'data');

class TaskManager {
  constructor() {
    this.ensureDataDirectory();
    this.tasks = this.loadTasks();
    this.appointments = this.loadAppointments();
  }

  // Ensure the data directory exists
  ensureDataDirectory() {
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }
    
    // Create files if they don't exist
    const tasksPath = path.join(dataPath, 'tasks.json');
    const appointmentsPath = path.join(dataPath, 'appointments.json');
    
    if (!fs.existsSync(tasksPath)) {
      fs.writeFileSync(tasksPath, JSON.stringify([]));
    }
    
    if (!fs.existsSync(appointmentsPath)) {
      fs.writeFileSync(appointmentsPath, JSON.stringify([]));
    }
  }

  // Load tasks from storage
  loadTasks() {
    try {
      const data = fs.readFileSync(path.join(dataPath, 'tasks.json'), 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  // Load appointments from storage
  loadAppointments() {
    try {
      const data = fs.readFileSync(path.join(dataPath, 'appointments.json'), 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading appointments:', error);
      return [];
    }
  }

  // Save tasks to storage
  saveTasks() {
    try {
      fs.writeFileSync(
        path.join(dataPath, 'tasks.json'),
        JSON.stringify(this.tasks, null, 2)
      );
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  // Save appointments to storage
  saveAppointments() {
    try {
      fs.writeFileSync(
        path.join(dataPath, 'appointments.json'),
        JSON.stringify(this.appointments, null, 2)
      );
    } catch (error) {
      console.error('Error saving appointments:', error);
    }
  }

  // Handle scheduling requests
  handleSchedulingRequest(message) {
    // Basic NLP to extract date, time, and event information
    // This would be much more sophisticated in a real implementation
    const datePattern = /\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)\b|\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/gi;
    const timePattern = /\b(at|from|between)?\s*\b((1[0-2]|0?[1-9]):[0-5][0-9]\s*(am|pm)?|([01]?[0-9]|2[0-3]):[0-5][0-9])\b/gi;
    
    const dateMatch = message.match(datePattern);
    const timeMatch = message.match(timePattern);
    
    let date = dateMatch ? dateMatch[0] : 'today';
    let time = timeMatch ? timeMatch[0].replace(/at|from|between/i, '').trim() : '';
    
    // Extract the event description (everything that's not a date or time)
    let eventDescription = message
      .replace(datePattern, '')
      .replace(timePattern, '')
      .replace(/schedule|appointment|meeting|event|calendar|add|create|set( up)?/gi, '')
      .trim();
    
    if (eventDescription) {
      // Create a new appointment
      const newAppointment = {
        id: Date.now(),
        date,
        time,
        description: eventDescription,
        created: new Date().toISOString()
      };
      
      this.appointments.push(newAppointment);
      this.saveAppointments();
      
      // Set up system notification for the appointment
      this.scheduleNotification(newAppointment);
      
      return {
        type: 'scheduling',
        content: `Very good, sir. I've scheduled "${eventDescription}" for ${date} ${time ? 'at ' + time : ''}.`
      };
    } else {
      return {
        type: 'error',
        content: `I apologize, sir, but I couldn't determine what to schedule. Could you please provide more details?`
      };
    }
  }

  // Handle task creation/management requests
  handleTaskRequest(message) {
    // Extract task details using basic NLP
    // This would be more sophisticated in a real implementation
    const dueDatePattern = /\bdue( by| on)?\b.*?\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2}(\/\d{2,4})?)\b/i;
    const priorityPattern = /\b(high|medium|low)( priority)?\b/i;
    
    const dueDateMatch = message.match(dueDatePattern);
    const priorityMatch = message.match(priorityPattern);
    
    let dueDate = dueDateMatch ? dueDateMatch[2] : '';
    let priority = priorityMatch ? priorityMatch[1] : 'medium';
    
    // Extract the task description
    let taskDescription = message
      .replace(/remind( me)?|task|to-do|todo|add|create|make( a)?( new)?/gi, '')
      .replace(dueDatePattern, '')
      .replace(priorityPattern, '')
      .trim();
    
    if (taskDescription) {
      // Create a new task
      const newTask = {
        id: Date.now(),
        description: taskDescription,
        dueDate,
        priority,
        completed: false,
        created: new Date().toISOString()
      };
      
      this.tasks.push(newTask);
      this.saveTasks();
      
      return {
        type: 'task',
        content: `Certainly, sir. I've added "${taskDescription}" to your task list${dueDate ? ' due on ' + dueDate : ''}${priority ? ' with ' + priority + ' priority' : ''}.`
      };
    } else {
      return {
        type: 'error',
        content: `I apologize, sir, but I couldn't determine what task to add. Could you please provide more details?`
      };
    }
  }

  // Create an itinerary for the day
  createItinerary(message) {
    const today = new Date();
    const todayString = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    
    // Filter tasks and appointments for today
    const todaysTasks = this.tasks.filter(task => 
      task.dueDate === 'today' || 
      task.dueDate === todayString
    );
    
    const todaysAppointments = this.appointments.filter(apt => 
      apt.date === 'today' || 
      apt.date === todayString
    );
    
    // Sort appointments by time
    todaysAppointments.sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
    
    // Sort tasks by priority
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    todaysTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    // Generate the itinerary
    let itinerary = "### Today's Itinerary\n\n";
    
    if (todaysAppointments.length > 0) {
      itinerary += "#### Scheduled Appointments\n";
      todaysAppointments.forEach(apt => {
        itinerary += `- ${apt.time || 'Anytime'}: ${apt.description}\n`;
      });
      itinerary += "\n";
    }
    
    if (todaysTasks.length > 0) {
      itinerary += "#### Tasks for Today\n";
      todaysTasks.forEach(task => {
        itinerary += `- [${task.completed ? 'x' : ' '}] (${task.priority.toUpperCase()}) ${task.description}\n`;
      });
      itinerary += "\n";
    }
    
    if (todaysAppointments.length === 0 && todaysTasks.length === 0) {
      itinerary += "You have no scheduled appointments or tasks due today. How refreshing, sir.\n\n";
    }
    
    // Add recommendations based on weather, previous patterns, etc.
    // This would use external APIs in a full implementation
    itinerary += "#### Butler's Recommendations\n";
    itinerary += "- It would be an excellent day to review your quarterly goals, sir.\n";
    itinerary += "- Consider taking a short walk between 2pm and 3pm for optimal productivity.\n";
    
    return {
      type: 'itinerary',
      content: itinerary
    };
  }

  // Schedule a system notification for an appointment
  scheduleNotification(appointment) {
    // This is platform-specific and would need to be implemented
    // differently for Windows, macOS, and Linux
    // This is just a placeholder implementation
    console.log(`Notification scheduled for: ${appointment.description}`);
  }
}

module.exports = TaskManager;

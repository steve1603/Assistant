// Butler AI Assistant - Main Application
// Electron-based desktop widget with advanced AI capabilities

const { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Import managers
const TaskManager = require('./taskManager');
const NLPManager = require('./nlpManager');
const CalendarManager = require('./calendarManager');
const NotificationManager = require('./notificationManager');
const VoiceManager = require('./voiceManager');

// Create manager instances
const taskManager = new TaskManager();
const nlpManager = new NLPManager();
const calendarManager = new CalendarManager();
const notificationManager = new NotificationManager();
const voiceManager = new VoiceManager();

// Global variables
let mainWindow;
let tray;
let isListening = false;
const autoLaunch = { enabled: true };

// Ensure the data directory exists
const dataPath = path.join(__dirname, 'data');
if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath, { recursive: true });
}

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 350,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  mainWindow.loadFile('index.html');
  
  // Position the window on the right side of the screen
  const { width } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setPosition(width - 350, 100);
  
  // Make the window draggable
  mainWindow.setMovable(true);
  
  // Hide window on blur unless pinned
  mainWindow.on('blur', () => {
    // Check if window should be hidden when blurred
    if (!isWindowPinned()) {
      mainWindow.hide();
    }
  });
  
  // Developer tools (remove in production)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// Create the system tray icon
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'tray-icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show Butler', 
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    { 
      label: 'Toggle Voice Recognition',
      type: 'checkbox',
      checked: isListening,
      click: () => toggleVoiceRecognition()
    },
    { type: 'separator' },
    { 
      label: 'Start at Login',
      type: 'checkbox',
      checked: autoLaunch.enabled,
      click: () => toggleAutoLaunch()
    },
    { type: 'separator' },
    { 
      label: 'Settings', 
      click: () => showSettings()
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => app.quit()
    }
  ]);
  
  tray.setToolTip('Butler AI Assistant');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Check if window is pinned (always on top)
function isWindowPinned() {
  return mainWindow.isAlwaysOnTop();
}

// Toggle voice recognition
function toggleVoiceRecognition() {
  if (isListening) {
    voiceManager.stopListening();
    isListening = false;
  } else {
    isListening = voiceManager.startListening(async (error, command) => {
      if (error) {
        console.error('Voice recognition error:', error);
        return;
      }
      
      console.log('Voice command recognized:', command);
      
      // Show the window if hidden
      if (!mainWindow.isVisible()) {
        mainWindow.show();
        mainWindow.focus();
      }
      
      // Process the command
      mainWindow.webContents.send('voice-command', command);
      
      // Process the command and get a response
      const contextData = {
        tasks: taskManager.tasks,
        appointments: taskManager.appointments
      };
      
      const response = await processMessage(command, contextData);
      mainWindow.webContents.send('assistant-response', response);
      
      // Speak the response
      if (response.content) {
        voiceManager.speak(response.content);
      }
    });
  }
  
  // Update tray menu
  tray.setContextMenu(Menu.buildFromTemplate([
    { 
      label: 'Show Butler', 
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    { 
      label: 'Toggle Voice Recognition',
      type: 'checkbox',
      checked: isListening,
      click: () => toggleVoiceRecognition()
    },
    { type: 'separator' },
    { 
      label: 'Start at Login',
      type: 'checkbox',
      checked: autoLaunch.enabled,
      click: () => toggleAutoLaunch()
    },
    { type: 'separator' },
    { 
      label: 'Settings', 
      click: () => showSettings()
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => app.quit()
    }
  ]));
}

// Toggle auto launch
function toggleAutoLaunch() {
  autoLaunch.enabled = !autoLaunch.enabled;
  
  // In a real implementation, you would use the auto-launch module
  // to set the application to start at login
  console.log('Auto launch toggled:', autoLaunch.enabled);
  
  // Update tray menu
  tray.setContextMenu(Menu.buildFromTemplate([
    { 
      label: 'Show Butler', 
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    { 
      label: 'Toggle Voice Recognition',
      type: 'checkbox',
      checked: isListening,
      click: () => toggleVoiceRecognition()
    },
    { type: 'separator' },
    { 
      label: 'Start at Login',
      type: 'checkbox',
      checked: autoLaunch.enabled,
      click: () => toggleAutoLaunch()
    },
    { type: 'separator' },
    { 
      label: 'Settings', 
      click: () => showSettings()
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => app.quit()
    }
  ]));
}

// Show settings window
function showSettings() {
  console.log('Settings requested');
  
  // Create settings window
  const settingsWindow = new BrowserWindow({
    width: 500,
    height: 600,
    title: 'Butler Settings',
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  settingsWindow.loadFile('settings.html');
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });
}

// Initialize the application
app.whenReady().then(() => {
  createWindow();
  createTray();
  
  // Register global shortcut to show/hide the assistant
  globalShortcut.register('Alt+Space', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  // Start checking for due tasks and appointments
  setInterval(checkForReminders, 60000); // Check every minute
});

// Check for tasks and appointments that need reminders
function checkForReminders() {
  const now = new Date();
  
  // Check tasks due soon
  const dueTasks = taskManager.tasks.filter(task => {
    if (!task.completed && task.dueDate) {
      const dueDate = parseDate(task.dueDate);
      
      // If due in less than 1 hour
      const timeDiff = dueDate.getTime() - now.getTime();
      return timeDiff > 0 && timeDiff < 3600000; // 1 hour in milliseconds
    }
    return false;
  });
  
  // Notify for due tasks
  dueTasks.forEach(task => {
    notificationManager.notifyTask(task, {
      onClick: () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('show-tasks');
      }
    });
  });
  
  // Check upcoming appointments
  const upcomingAppointments = taskManager.appointments.filter(apt => {
    if (apt.date) {
      const aptDate = parseDate(apt.date);
      const aptTime = apt.time ? parseTime(apt.time) : null;
      
      if (aptTime) {
        // Set the time on the date
        aptDate.setHours(aptTime.getHours(), aptTime.getMinutes(), 0, 0);
        
        // If appointment is in 15-30 minutes
        const timeDiff = aptDate.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff < 1800000; // 30 minutes in milliseconds
      }
    }
    return false;
  });
  
  // Notify for upcoming appointments
  upcomingAppointments.forEach(apt => {
    notificationManager.notifyAppointment(apt, {
      onClick: () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('show-appointments');
      }
    });
  });
}

// Parse date strings
function parseDate(dateStr) {
  const now = new Date();
  
  if (dateStr.toLowerCase() === 'today') {
    return now;
  } else if (dateStr.toLowerCase() === 'tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(dateStr.toLowerCase())) {
    // Set to next occurrence of the day
    const days = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const targetDay = days[dateStr.toLowerCase()];
    const currentDay = now.getDay();
    const daysToAdd = (targetDay + 7 - currentDay) % 7;
    
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
    return nextDay;
  } else {
    // Try to parse as MM/DD/YYYY
    const dateParts = dateStr.split('/');
    if (dateParts.length >= 2) {
      const month = parseInt(dateParts[0]) - 1; // 0-indexed months
      const day = parseInt(dateParts[1]);
      const year = dateParts.length > 2 ? parseInt(dateParts[2]) : now.getFullYear();
      return new Date(year, month, day);
    }
  }
  
  // Default to today if unable to parse
  return now;
}

// Parse time strings
function parseTime(timeStr) {
  const now = new Date();
  const time = new Date(now);
  
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
    
    time.setHours(hours, minutes, 0, 0);
    return time;
  }
  
  // Default to now if unable to parse
  return now;
}

// IPC handlers
ipcMain.on('assistant-message', async (event, message) => {
  // Process user message and get assistant response
  const contextData = {
    tasks: taskManager.tasks,
    appointments: taskManager.appointments
  };
  
  const response = await processMessage(message, contextData);
  event.reply('assistant-response', response);
  
  // Show window if hidden
  if (!mainWindow.isVisible()) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// Process messages using NLP and other managers
async function processMessage(message, contextData = {}) {
  try {
    // Process the message using NLP
    const nlpResponse = await nlpManager.processMessage(message, contextData);
    
    // Handle different action types
    if (nlpResponse.action === 'create_appointment') {
      // Create an appointment
      const result = taskManager.handleSchedulingRequest(message);
      
      // If Google Calendar integration is authorized, add to calendar as well
      if (calendarManager.authorized) {
        const calendarResult = await calendarManager.createEvent(nlpResponse.data);
        if (calendarResult.success) {
          result.content += ` I've also added it to your Google Calendar.`;
        }
      }
      
      return result;
      
    } else if (nlpResponse.action === 'create_task') {
      // Create a task
      return taskManager.handleTaskRequest(message);
      
    } else if (nlpResponse.action === 'create_itinerary') {
      // Create an itinerary
      return taskManager.createItinerary(message);
      
    } else {
      // For other actions, return the NLP response
      return {
        type: nlpResponse.type,
        content: nlpResponse.content
      };
    }
  } catch (error) {
    console.error('Error processing message:', error);
    return {
      type: 'error',
      content: `I apologize, but I encountered an issue processing your request. Please try again.`
    };
  }
}

// Exit the app when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS, re-create the window when the dock icon is clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up before quit
app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
  
  // Stop listening for voice commands
  if (isListening) {
    voiceManager.stopListening();
  }
});

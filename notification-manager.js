// notificationManager.js - Handles system notifications

const notifier = require('node-notifier');
const path = require('path');
const fs = require('fs');

class NotificationManager {
  constructor() {
    this.appName = 'Butler AI';
    this.iconPath = path.join(__dirname, 'assets', 'icon.png');
    
    // Load notification preferences
    this.preferences = this.loadPreferences();
    
    // Queue for managing multiple notifications
    this.notificationQueue = [];
    this.isProcessingQueue = false;
    
    // Track scheduled notifications
    this.scheduledNotifications = [];
  }
  
  // Load notification preferences
  loadPreferences() {
    const preferencesPath = path.join(__dirname, 'data', 'preferences.json');
    
    try {
      if (fs.existsSync(preferencesPath)) {
        const data = fs.readFileSync(preferencesPath, 'utf8');
        const preferences = JSON.parse(data);
        return preferences.notificationPreferences || this.getDefaultPreferences();
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
    
    return this.getDefaultPreferences();
  }
  
  // Get default notification preferences
  getDefaultPreferences() {
    return {
      enabled: true,
      sound: true,
      tasks: true,
      appointments: true,
      reminders: true,
      focusMode: {
        enabled: false,
        dndStart: '09:00',
        dndEnd: '12:00'
      }
    };
  }
  
  // Show a notification
  notify(options) {
    // Add to queue
    this.notificationQueue.push(options);
    
    // Process queue if not already processing
    if (!this.isProcessingQueue) {
      this.processNotificationQueue();
    }
  }
  
  // Process the notification queue
  async processNotificationQueue() {
    if (this.notificationQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    
    this.isProcessingQueue = true;
    const options = this.notificationQueue.shift();
    
    // Check if notifications are enabled
    if (!this.preferences.enabled) {
      console.log('Notifications disabled, skipping:', options.title);
      this.processNotificationQueue();
      return;
    }
    
    // Check if in Do Not Disturb mode
    if (this.isInDoNotDisturbMode() && options.bypassDnd !== true) {
      console.log('In Do Not Disturb mode, skipping notification:', options.title);
      this.processNotificationQueue();
      return;
    }
    
    // Check notification type against preferences
    if (
      (options.type === 'task' && !this.preferences.tasks) ||
      (options.type === 'appointment' && !this.preferences.appointments) ||
      (options.type === 'reminder' && !this.preferences.reminders)
    ) {
      console.log(`${options.type} notifications disabled, skipping:`, options.title);
      this.processNotificationQueue();
      return;
    }
    
    // Show the notification
    notifier.notify({
      title: options.title || 'Butler AI',
      message: options.message,
      icon: this.iconPath,
      sound: this.preferences.sound,
      wait: true, // Wait for user interaction
      actions: options.actions || ['Dismiss', 'View'],
      timeout: options.timeout || 10,
      appID: this.appName
    });
    
    // Listen for notification events
    notifier.on('click', () => {
      if (options.onClick) {
        options.onClick();
      }
    });
    
    notifier.on('action', (action) => {
      if (action === 'View' && options.onAction) {
        options.onAction(action);
      }
    });
    
    // Wait a bit before showing the next notification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Process the next notification in the queue
    this.processNotificationQueue();
  }
  
  // Schedule a notification for a future time
  scheduleNotification(options, scheduledTime) {
    const now = new Date();
    const notificationTime = new Date(scheduledTime);
    
    // Calculate time until notification should be shown
    const timeUntilNotification = notificationTime.getTime() - now.getTime();
    
    if (timeUntilNotification <= 0) {
      // Time has already passed, show immediately
      this.notify(options);
      return null;
    }
    
    // Schedule the notification
    const timeoutId = setTimeout(() => {
      this.notify(options);
      
      // Remove from scheduled notifications
      this.scheduledNotifications = this.scheduledNotifications.filter(
        notification => notification.id !== timeoutId
      );
    }, timeUntilNotification);
    
    // Track the scheduled notification
    const scheduledNotification = {
      id: timeoutId,
      time: notificationTime,
      options: options
    };
    
    this.scheduledNotifications.push(scheduledNotification);
    return timeoutId;
  }
  
  // Cancel a scheduled notification
  cancelScheduledNotification(id) {
    const notification = this.scheduledNotifications.find(
      notification => notification.id === id
    );
    
    if (notification) {
      clearTimeout(notification.id);
      
      // Remove from scheduled notifications
      this.scheduledNotifications = this.scheduledNotifications.filter(
        notification => notification.id !== id
      );
      
      return true;
    }
    
    return false;
  }
  
  // Check if current time is within Do Not Disturb hours
  isInDoNotDisturbMode() {
    if (!this.preferences.focusMode.enabled) {
      return false;
    }
    
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHours * 60 + currentMinutes; // Convert to minutes
    
    // Parse DND start and end times
    const startParts = this.preferences.focusMode.dndStart.split(':');
    const endParts = this.preferences.focusMode.dndEnd.split(':');
    
    const startTime = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endTime = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
    
    // Check if current time is within DND period
    return currentTime >= startTime && currentTime <= endTime;
  }
  
  // Notification for tasks
  notifyTask(task, options = {}) {
    this.notify({
      type: 'task',
      title: 'Task Reminder',
      message: task.description,
      onClick: options.onClick,
      onAction: options.onAction
    });
  }
  
  // Notification for appointments
  notifyAppointment(appointment, options = {}) {
    this.notify({
      type: 'appointment',
      title: 'Upcoming Appointment',
      message: `${appointment.description} ${appointment.time ? 'at ' + appointment.time : ''}`,
      onClick: options.onClick,
      onAction: options.onAction
    });
  }
  
  // Notification for custom reminders
  notifyReminder(message, options = {}) {
    this.notify({
      type: 'reminder',
      title: 'Butler Reminder',
      message: message,
      onClick: options.onClick,
      onAction: options.onAction
    });
  }
  
  // Update notification preferences
  updatePreferences(newPreferences) {
    this.preferences = { ...this.preferences, ...newPreferences };
    return this.preferences;
  }
}

module.exports = NotificationManager;

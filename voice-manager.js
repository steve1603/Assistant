// voiceManager.js - Handles voice recognition and text-to-speech

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class VoiceManager {
  constructor() {
    this.isListening = false;
    this.recognitionProcess = null;
    this.audioPath = path.join(__dirname, 'data', 'audio');
    
    // Create audio directory if it doesn't exist
    if (!fs.existsSync(this.audioPath)) {
      fs.mkdirSync(this.audioPath, { recursive: true });
    }
    
    // Check for system dependencies
    this.checkDependencies();
  }
  
  // Check if necessary system dependencies are installed
  async checkDependencies() {
    try {
      // Check for ffmpeg (used for audio processing)
      await execPromise('ffmpeg -version');
      
      // On Windows, check for PowerShell (used for text-to-speech)
      if (process.platform === 'win32') {
        await execPromise('powershell -Command "Get-Command Speak-Out"');
      }
      
      // On macOS, check for say command
      if (process.platform === 'darwin') {
        await execPromise('say -v ?');
      }
      
      // On Linux, check for either espeak or festival
      if (process.platform === 'linux') {
        try {
          await execPromise('espeak --version');
        } catch (error) {
          await execPromise('festival --version');
        }
      }
      
      console.log('Voice dependencies check passed');
    } catch (error) {
      console.warn('Some voice dependencies are missing. Voice features may not work:', error.message);
    }
  }
  
  // Start listening for voice commands
  startListening(callback) {
    if (this.isListening) {
      console.log('Already listening');
      return false;
    }
    
    console.log('Starting voice recognition...');
    this.isListening = true;
    
    // This is a simplified implementation that would need to be replaced
    // with a proper speech recognition library in a real application
    
    // For demonstration, we'll simulate voice recognition by watching for an audio file
    // In a real implementation, you would use a library like node-record-lpcm16,
    // then send the audio to a service like Google Speech-to-Text or use a local
    // speech recognition library
    
    const audioFilePath = path.join(this.audioPath, 'command.wav');
    
    // Watch for new audio files
    fs.watchFile(audioFilePath, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        console.log('Audio command detected');
        
        // In a real implementation, this is where you would send the audio
        // to a speech recognition service
        
        // Simulate speech recognition with a timeout
        setTimeout(() => {
          // Simulated recognition result
          const result = 'schedule a meeting tomorrow at 3pm';
          
          // Pass the result to the callback
          if (callback) {
            callback(null, result);
          }
          
          // Delete the file
          fs.unlinkSync(audioFilePath);
        }, 1000);
      }
    });
    
    return true;
  }
  
  // Stop listening for voice commands
  stopListening() {
    if (!this.isListening) {
      return false;
    }
    
    console.log('Stopping voice recognition...');
    this.isListening = false;
    
    // If using a real speech recognition library, you would stop the recording here
    
    // Stop watching for audio files
    const audioFilePath = path.join(this.audioPath, 'command.wav');
    fs.unwatchFile(audioFilePath);
    
    return true;
  }
  
  // Convert text to speech
  async speak(text, options = {}) {
    const voice = options.voice || 'default';
    const rate = options.rate || 1.0;
    
    try {
      // Platform-specific text-to-speech implementation
      if (process.platform === 'win32') {
        // Windows: Use PowerShell's Speak-Out
        await execPromise(`powershell -Command "Add-Type -AssemblyName System.Speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Rate = ${(rate - 1) * 10}; $speak.Speak('${text.replace(/'/g, "''")}')"`)
          .catch(error => {
            console.error('Error using PowerShell TTS:', error);
            return execPromise(`powershell -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${text.replace(/'/g, "''")}')"`)
          });
      } else if (process.platform === 'darwin') {
        // macOS: Use the built-in 'say' command
        await execPromise(`say -v "${voice}" -r ${Math.round(rate * 200)} "${text.replace(/"/g, '\\"')}"`);
      } else if (process.platform === 'linux') {
        // Linux: Try espeak, fall back to festival
        try {
          await execPromise(`espeak -v ${voice} -s ${Math.round(rate * 175)} "${text.replace(/"/g, '\\"')}"`);
        } catch (error) {
          // Fall back to festival
          const festivalProcess = spawn('festival', ['--tts']);
          festivalProcess.stdin.write(text);
          festivalProcess.stdin.end();
          
          await new Promise((resolve, reject) => {
            festivalProcess.on('close', resolve);
            festivalProcess.on('error', reject);
          });
        }
      } else {
        console.warn('Text-to-speech not supported on this platform');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error during text-to-speech:', error);
      return false;
    }
  }
  
  // Create a greeting based on time of day
  async speakGreeting(userName = 'Sir') {
    const hour = new Date().getHours();
    let greeting;
    
    if (hour < 12) {
      greeting = `Good morning, ${userName}. How may I assist you today?`;
    } else if (hour < 18) {
      greeting = `Good afternoon, ${userName}. What can I do for you?`;
    } else {
      greeting = `Good evening, ${userName}. How may I be of service?`;
    }
    
    return this.speak(greeting);
  }
  
  // Speak a notification
  async speakNotification(notification) {
    let text;
    
    if (typeof notification === 'string') {
      text = notification;
    } else {
      text = `${notification.title}. ${notification.message}`;
    }
    
    return this.speak(text);
  }
}

module.exports = VoiceManager;

// schedule-meeting.js - Script for scheduling meetings
const axios = require('axios');
const fs = require('fs');
const moment = require('moment');

async function main() {
  try {
    const command = process.argv[2] || '';
    const details = process.argv[3] || '';
    const issueNumber = process.argv[4] || '';
    
    console.log(`Scheduling meeting based on: ${command}`);
    
    // Extract meeting information
    const meetingInfo = extractMeetingInfo(command + ' ' + details);
    
    // Load existing meetings data
    let meetings = [];
    const meetingsFile = 'meetings.json';
    if (fs.existsSync(meetingsFile)) {
      meetings = JSON.parse(fs.readFileSync(meetingsFile));
    }
    
    // Add new meeting with a unique ID
    const newMeeting = {
      id: Date.now().toString(),
      ...meetingInfo,
      createdAt: new Date().toISOString()
    };
    
    meetings.push(newMeeting);
    
    // Save updated meetings
    fs.writeFileSync(meetingsFile, JSON.stringify(meetings, null, 2));
    
    // Create a calendar entry markdown file
    const fileName = `meeting-${newMeeting.id}.md`;
    const meetingMarkdown = generateMeetingMarkdown(newMeeting);
    fs.writeFileSync(fileName, meetingMarkdown);
    
    // Create a nice response
    const response = `## Meeting Scheduled

I've scheduled your meeting for ${formatMeetingDateTime(newMeeting)}.

### Meeting Details
- **Title**: ${newMeeting.title}
- **Date**: ${formatDate(newMeeting.date)}
- **Time**: ${formatTime(newMeeting.startTime)} - ${formatTime(newMeeting.endTime)}
${newMeeting.location ? `- **Location**: ${newMeeting.location}` : ''}
${newMeeting.attendees.length > 0 ? `- **Attendees**: ${newMeeting.attendees.join(', ')}` : ''}
${newMeeting.description ? `- **Description**: ${newMeeting.description}` : ''}

The meeting has been added to your calendar file: [${fileName}](${fileName})`;
    
    fs.writeFileSync('response.md', response);
    
    // Signal that we should commit changes
    fs.writeFileSync('commit_changes', 'true');
    
    console.log('Meeting scheduled successfully');
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    fs.writeFileSync('response.md', `## Butler AI Assistant Error\n\nI apologize, but I encountered an error scheduling your meeting:\n\n\`\`\`\n${error.message}\n\`\`\``);
  }
}

function extractMeetingInfo(text) {
  // Default meeting duration in minutes
  const DEFAULT_DURATION = 60;
  
  // Extract title - assumes the first part is the title until a time/date indicator
  const titleMatch = text.match(/schedule(?:\s+a)?\s+meeting(?:\s+(?:on|about|for))?\s+(.*?)(?=\s+(?:on|at|with|tomorrow|today|next|this|for\s+\d+)|\s*$)/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Meeting';
  
  // Extract date
  let date = moment().format('YYYY-MM-DD'); // Default to today
  const dateRegex = /\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2}\/\d{2}|today|tomorrow|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|this\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i;
  const dateMatch = text.match(dateRegex);
  
  if (dateMatch) {
    const dateText = dateMatch[1].toLowerCase();
    
    if (dateText === 'today') {
      date = moment().format('YYYY-MM-DD');
    } else if (dateText === 'tomorrow') {
      date = moment().add(1, 'days').format('YYYY-MM-DD');
    } else if (dateText.startsWith('next ')) {
      const day = dateText.replace('next ', '');
      date = moment().day(day).add(moment().day() >= moment().day(day).day() ? 7 : 0, 'days').format('YYYY-MM-DD');
    } else if (dateText.startsWith('this ')) {
      const day = dateText.replace('this ', '');
      date = moment().day(day).format('YYYY-MM-DD');
    } else {
      // Try to parse the date string
      date = moment(dateText).format('YYYY-MM-DD');
    }
  }
  
  // Extract time
  let startTime = '09:00';
  let endTime = '10:00';
  const timeRegex = /\b(at|from)\s+(\d{1,2}(?::\d{2})?)\s*(?:([ap]\.?m\.?)|([ap]\.?m\.?))?\b/i;
  const timeMatch = text.match(timeRegex);
  
  if (timeMatch) {
    let hour = parseInt(timeMatch[2].split(':')[0]);
    const minutes = timeMatch[2].includes(':') ? timeMatch[2].split(':')[1] : '00';
    const period = timeMatch[3] || timeMatch[4] || '';
    
    // Adjust hour for PM if needed
    if (period.toLowerCase().startsWith('p') && hour < 12) {
      hour += 12;
    } else if (period.toLowerCase().startsWith('a') && hour === 12) {
      hour = 0;
    }
    
    startTime = `${hour.toString().padStart(2, '0')}:${minutes}`;
    
    // Calculate end time based on default duration
    endTime = moment(`${date}T${startTime}`).add(DEFAULT_DURATION, 'minutes').format('HH:mm');
  }
  
  // Extract duration if specified
  const durationRegex = /\b(?:for|duration)\s+(\d+)\s*(?:min(?:ute)?s?|hours?|hrs?)\b/i;
  const durationMatch = text.match(durationRegex);
  
  if (durationMatch) {
    const duration = parseInt(durationMatch[1]);
    const unit = durationMatch[0].toLowerCase().includes('hour') || durationMatch[0].toLowerCase().includes('hr') ? 'hours' : 'minutes';
    endTime = moment(`${date}T${startTime}`).add(duration, unit).format('HH:mm');
  }
  
  // Extract location
  const locationRegex = /\b(?:at|in|location|place)\s+((?:(?!\bat\b|\bin\b|\bwith\b|\bfor\b|\bduration\b).)+)(?=\s+(?:with|at|on|for)|\s*$)/i;
  const locationMatch = text.match(locationRegex);
  const location = locationMatch ? locationMatch[1].trim() : '';
  
  // Extract attendees
  const attendeesRegex = /\bwith\s+((?:(?!\bat\b|\bin\b|\bfor\b|\bduration\b).)+)(?=\s+(?:at|in|on|for)|\s*$)/i;
  const attendeesMatch = text.match(attendeesRegex);
  const attendees = attendeesMatch ? attendeesMatch[1].split(/(?:,|and)/g).map(a => a.trim()).filter(a => a) : [];
  
  // Extract description or agenda
  const descriptionRegex = /\b(?:about|regarding|agenda|description)\s+((?:(?!\bat\b|\bin\b|\bwith\b|\bfor\b|\bduration\b).)+)(?=\s+(?:with|at|in|on|for)|\s*$)/i;
  const descriptionMatch = text.match(descriptionRegex);
  const description = descriptionMatch ? descriptionMatch[1].trim() : '';
  
  return {
    title,
    date,
    startTime,
    endTime,
    location,
    attendees,
    description
  };
}

function formatMeetingDateTime(meeting) {
  const dateStr = formatDate(meeting.date);
  const timeStr = `${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`;
  return `${dateStr} at ${timeStr}`;
}

function formatDate(dateStr) {
  return moment(dateStr).format('dddd, MMMM D, YYYY');
}

function formatTime(timeStr) {
  return moment(`2000-01-01T${timeStr}`).format('h:mm A');
}

function generateMeetingMarkdown(meeting) {
  return `# Meeting: ${meeting.title}

## Date and Time
- **Date**: ${formatDate(meeting.date)}
- **Time**: ${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}
${meeting.location ? `- **Location**: ${meeting.location}` : ''}

${meeting.attendees.length > 0 ? `## Attendees
${meeting.attendees.map(a => `- ${a}`).join('\n')}
` : ''}

${meeting.description ? `## Description
${meeting.description}
` : ''}

## Notes
<!-- Add meeting notes here -->

---
Created by Butler AI Assistant on ${moment().format('MMMM D, YYYY [at] h:mm A')}
`;
}

main();

import fs from 'fs';
import path from 'path';
import { Event } from './eventsUtils';

// Define paths
const EVENTS_FILE_PATH = path.join(process.cwd(), 'public', 'data', 'events.json');
const DATA_DIR = path.join(process.cwd(), 'public', 'data');

// Ensure data directory exists
const ensureDataDirectoryExists = () => {
  console.log(`Ensuring data directory exists at: ${DATA_DIR}`);
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Created data directory at ${DATA_DIR}`);
    } catch (error) {
      console.error(`Error creating data directory: ${error}`);
      throw error;
    }
  }
};

// Load events from file or create empty list if file doesn't exist
export const getEvents = (): Event[] => {
  ensureDataDirectoryExists();
  console.log(`Loading events from ${EVENTS_FILE_PATH}`);
  
  if (!fs.existsSync(EVENTS_FILE_PATH)) {
    console.log('Events file does not exist, creating empty one');
    saveEvents([]);
    return [];
  }
  
  try {
    const data = fs.readFileSync(EVENTS_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading events file: ${error}`);
    return [];
  }
};

// Save events to file
export const saveEvents = (events: Event[]): void => {
  ensureDataDirectoryExists();
  console.log(`Saving ${events.length} events to ${EVENTS_FILE_PATH}`);
  
  try {
    fs.writeFileSync(EVENTS_FILE_PATH, JSON.stringify(events, null, 2), 'utf8');
    console.log('Events saved successfully');
  } catch (error) {
    console.error(`Error saving events: ${error}`);
    throw error;
  }
};

// Add a new event
export const addEvent = (event: Omit<Event, 'id'>): Event => {
  const events = getEvents();
  
  // Generate a unique ID
  const newEvent: Event = {
    ...event,
    id: generateUniqueId(),
  };
  
  // Add to events array
  events.push(newEvent);
  
  // Sort by position
  const sortedEvents = events.sort((a, b) => a.position - b.position);
  
  // Save updated events
  saveEvents(sortedEvents);
  
  return newEvent;
};

// Update an existing event
export const updateEvent = (eventId: string, updatedEvent: Partial<Event>): Event | null => {
  const events = getEvents();
  const index = events.findIndex(event => event.id === eventId);
  
  if (index === -1) {
    return null;
  }
  
  // Update the event
  events[index] = {
    ...events[index],
    ...updatedEvent,
  };
  
  // Sort by position
  const sortedEvents = events.sort((a, b) => a.position - b.position);
  
  // Save updated events
  saveEvents(sortedEvents);
  
  return events[index];
};

// Delete an event
export const deleteEvent = (eventId: string): boolean => {
  const events = getEvents();
  const filteredEvents = events.filter(event => event.id !== eventId);
  
  if (filteredEvents.length === events.length) {
    return false; // No event was removed
  }
  
  // Save updated events
  saveEvents(filteredEvents);
  
  return true;
};

// Generate a unique ID
const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Get the next available position
export const getNextPosition = (): number => {
  const events = getEvents();
  
  if (events.length === 0) {
    return 1;
  }
  
  return Math.max(...events.map(event => event.position)) + 1;
};

// Reorder events
export const reorderEvents = (eventIds: string[]): Event[] => {
  const events = getEvents();
  const reorderedEvents: Event[] = [];
  
  // Assign new positions based on the order of IDs
  eventIds.forEach((id, index) => {
    const event = events.find(e => e.id === id);
    if (event) {
      reorderedEvents.push({
        ...event,
        position: index + 1,
      });
    }
  });
  
  // Include any events that weren't in the reorder list
  const missingEvents = events.filter(event => !eventIds.includes(event.id));
  reorderedEvents.push(...missingEvents);
  
  // Sort by position
  const sortedEvents = reorderedEvents.sort((a, b) => a.position - b.position);
  
  // Save updated events
  saveEvents(sortedEvents);
  
  return sortedEvents;
}; 
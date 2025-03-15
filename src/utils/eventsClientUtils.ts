import { Event, formatDisplayDate, formatDisplayTime } from './eventsUtils';

// Empty event template
export const emptyEvent: Omit<Event, 'id'> = {
  date: '',
  venue: '',
  eventName: '',
  address: '',
  postcode: '',
  timeStart: '',
  timeEnd: '',
  ticketLink: '',
  position: 0
};

// Fetch all events
export const fetchEvents = async (includeArchived = false): Promise<Event[]> => {
  try {
    const response = await fetch(`/api/events?includeArchived=${includeArchived}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.events;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

// Add a new event
export const addEvent = async (event: Omit<Event, 'id'>): Promise<Event | null> => {
  try {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event }),
    });

    if (!response.ok) {
      throw new Error(`Error adding event: ${response.statusText}`);
    }

    const data = await response.json();
    return data.event;
  } catch (error) {
    console.error('Error adding event:', error);
    return null;
  }
};

// Update an existing event
export const updateEvent = async (eventId: string, updatedEvent: Partial<Event>): Promise<Event | null> => {
  try {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event: updatedEvent }),
    });

    if (!response.ok) {
      throw new Error(`Error updating event: ${response.statusText}`);
    }

    const data = await response.json();
    return data.event;
  } catch (error) {
    console.error('Error updating event:', error);
    return null;
  }
};

// Delete an event
export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error deleting event: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
};

// Reorder events
export const reorderEvents = async (eventIds: string[]): Promise<Event[]> => {
  try {
    const response = await fetch('/api/events/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventIds }),
    });

    if (!response.ok) {
      throw new Error(`Error reordering events: ${response.statusText}`);
    }

    const data = await response.json();
    return data.events;
  } catch (error) {
    console.error('Error reordering events:', error);
    return [];
  }
};

// Re-export formatDisplayDate and formatDisplayTime from eventsUtils
export { formatDisplayDate, formatDisplayTime }; 
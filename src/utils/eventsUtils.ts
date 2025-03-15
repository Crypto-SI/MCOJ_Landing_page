// Define event types
export interface Event {
  id: string;
  date: string;
  venue: string;
  eventName: string;
  address: string;
  postcode?: string; // Optional postcode for directions
  timeStart: string;
  timeEnd: string;
  ticketLink: string;
  position: number;
}

// Format date for display
export const formatDisplayDate = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Format time for display
export const formatDisplayTime = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    // For 24-hour format like "14:30", convert to "2:30 PM"
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
}; 
// Utility functions for formatting data

/**
 * Format timestamp to display full date with hours and minutes
 * @param {Object} timestamp - Firebase Timestamp object
 * @param {boolean} showTime - Whether to show time (default: true)
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (timestamp, showTime = true) => {
  if (!timestamp || !timestamp.toDate) {
    return '';
  }

  const date = timestamp.toDate();

  const dateOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };

  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };

  if (showTime) {
    return `${date.toLocaleDateString('en-US', dateOptions)} at ${date.toLocaleTimeString('en-US', timeOptions)}`;
  }

  return date.toLocaleDateString('en-US', dateOptions);
};

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 * @param {Object} timestamp - Firebase Timestamp object
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp || !timestamp.toDate) {
    return '';
  }

  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatTimestamp(timestamp, true);
  }
};

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

/**
 * Parse markdown-like formatting and return React elements
 * This function converts markdown syntax to actual HTML elements
 */
export const parseMarkdownToHtml = (text) => {
  if (!text) return '';

  let html = text
    // Headers
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')

    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

    // Italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')

    // Code blocks
    .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')

    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')

    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

    // Blockquotes
    .replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>')

    // Unordered lists
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  // Wrap in paragraph if not already wrapped
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }

  return html;
};
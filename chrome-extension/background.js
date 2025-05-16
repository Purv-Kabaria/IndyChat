// Configuration
const CONFIG = {
  // Base URL for the Next.js application - keep in sync with popup.js
  nextJsBaseUrl: 'http://localhost:3000',
  
  // API endpoints
  endpoints: {
    chat: '/api/chat',
    notifications: '/api/notifications', // Assuming a notifications endpoint exists or will exist
  },
  
  // Update check interval in minutes
  updateCheckInterval: 5,
};

// Log the configuration
console.log('Extension configuration:', {
  baseUrl: CONFIG.nextJsBaseUrl,
  endpoints: CONFIG.endpoints,
  updateInterval: CONFIG.updateCheckInterval
});

console.log('Background service worker initializing...');

// Initialize the extension when installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed or updated:', details.reason);
  
  try {
    // Set up initial state in storage
    chrome.storage.local.set({
      lastUpdateCheck: Date.now(),
      unreadNotifications: 0,
      isNextJsConnected: false
    }, () => {
      console.log('Initial storage state set');
    });
    
    // Set up an alarm for periodic checks
    if (chrome.alarms) {
      chrome.alarms.create('checkForUpdates', {
        periodInMinutes: CONFIG.updateCheckInterval
      });
      console.log(`Alarm created with interval: ${CONFIG.updateCheckInterval} minutes`);
    } else {
      console.error('Alarms API not available - check permissions');
    }
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message, 'from:', sender);
  
  if (message.type === 'CHECK_CONNECTION') {
    checkNextJsConnection()
      .then(isConnected => {
        sendResponse({ isConnected });
        updateConnectionStatus(isConnected);
      })
      .catch(error => {
        console.error('Connection check error:', error);
        sendResponse({ isConnected: false, error: error.message });
        updateConnectionStatus(false);
      });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  if (message.type === 'GET_NOTIFICATIONS') {
    fetchNotifications()
      .then(notifications => {
        sendResponse({ success: true, notifications });
      })
      .catch(error => {
        console.error('Error fetching notifications:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
  
  if (message.type === 'CONTENT_LOADED') {
    // Handle message from content script when page loads
    // This could trigger specific actions based on the URL
    if (sender.tab && sender.tab.url) {
      console.log('Content loaded on:', sender.tab.url);
      // You could send a response or take other actions
      sendResponse({ received: true });
    }
    return true;
  }
});

// Listen for alarms to check for updates
if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('Alarm triggered:', alarm.name);
    if (alarm.name === 'checkForUpdates') {
      console.log('Checking for updates...');
      checkForUpdates();
    }
  });
  console.log('Alarm listener registered');
} else {
  console.error('Alarms API not available for listener');
}

// Log that the service worker is ready
console.log('Background service worker initialized successfully');

// Keep the service worker alive with periodic self-ping
// This helps ensure the service worker doesn't get terminated prematurely
const keepAlive = () => {
  const intervalMinutes = 1;
  const intervalMillis = intervalMinutes * 60 * 1000;
  
  setInterval(() => {
    console.log('Service worker keepalive ping');
    
    // Re-create the alarm if needed
    if (chrome.alarms) {
      chrome.alarms.get('checkForUpdates', (alarm) => {
        if (!alarm) {
          console.log('Recreating missing alarm');
          chrome.alarms.create('checkForUpdates', {
            periodInMinutes: CONFIG.updateCheckInterval
          });
        }
      });
    }
  }, intervalMillis);
};

// Start the keepalive process
keepAlive();

// Function to check if Next.js app is accessible
async function checkNextJsConnection() {
  console.log(`Checking connection to ${CONFIG.nextJsBaseUrl}/api/health`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${CONFIG.nextJsBaseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const result = response.ok;
    console.log(`Connection check result: ${result ? 'OK' : 'Failed'}, status: ${response.status}`);
    
    // Additional detailed logging
    if (response.ok) {
      try {
        const data = await response.clone().json();
        console.log('Health check response:', data);
      } catch (parseError) {
        console.warn('Could not parse health check response as JSON:', parseError);
      }
    } else {
      try {
        const errorText = await response.clone().text();
        console.error('Health check error response:', errorText);
      } catch (textError) {
        console.error('Could not read health check error response');
      }
    }
    
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Connection check timed out after 5 seconds - Is the Next.js server running at:', CONFIG.nextJsBaseUrl);
    } else if (error.message.includes('Failed to fetch')) {
      console.error('Connection check failed - Unable to reach server. Check if Next.js is running at:', CONFIG.nextJsBaseUrl);
    } else {
      console.error('Connection check failed:', error);
    }
    return false;
  }
}

// Update the connection status and potentially notify the user
function updateConnectionStatus(isConnected) {
  console.log(`Updating connection status: ${isConnected ? 'Connected' : 'Disconnected'} to ${CONFIG.nextJsBaseUrl}`);
  
  try {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ 
        isNextJsConnected: isConnected,
        connectionUrl: CONFIG.nextJsBaseUrl,
        lastConnectionCheck: new Date().toISOString()
      }, () => {
        console.log('Connection status saved to storage');
      });
    }
    
    // If the connection status changed, we might want to update the badge or show a notification
    if (chrome.action) {
      if (!isConnected) {
        // Set a badge indicating the app is disconnected
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#d32f2f' });
        console.log('Set disconnected badge');
        
        // Log troubleshooting tips
        console.warn('Connection troubleshooting tips:');
        console.warn('1. Make sure the Next.js app is running on port 3001');
        console.warn('2. Check if the /api/health endpoint is implemented and working');
        console.warn('3. Ensure CORS is properly configured in the Next.js app');
        console.warn('4. Verify network connectivity between the extension and the server');
      } else {
        // Clear the badge if we're connected
        chrome.action.setBadgeText({ text: '' });
        console.log('Cleared badge (connected)');
      }
    } else {
      console.error('Action API not available');
    }
  } catch (error) {
    console.error('Error updating connection status:', error);
  }
}

// Check for updates from the Next.js app
async function checkForUpdates() {
  console.log('Running checkForUpdates function');
  try {
    // First check if the connection is available
    const isConnected = await checkNextJsConnection();
    console.log('Connection check result:', isConnected);
    updateConnectionStatus(isConnected);
    
    if (!isConnected) {
      console.log('Next.js app not connected, skipping notifications check');
      return;
    }
    
    // Check for notifications
    console.log('Fetching notifications...');
    await fetchNotifications();
    
    // Update the last check timestamp
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ lastUpdateCheck: Date.now() }, () => {
        console.log('Updated lastUpdateCheck timestamp');
      });
    } else {
      console.error('Storage API not available');
    }
    
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

// Fetch notifications from the Next.js app
async function fetchNotifications() {
  try {
    const response = await fetch(`${CONFIG.nextJsBaseUrl}${CONFIG.endpoints.notifications}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // If there are unread notifications, update the badge
    if (data.unreadCount && data.unreadCount > 0) {
      chrome.action.setBadgeText({ text: data.unreadCount.toString() });
      chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });
      
      // Store the notification data
      chrome.storage.local.set({ 
        unreadNotifications: data.unreadCount,
        notifications: data.notifications 
      });
      
      // Optionally show a system notification for important updates
      if (data.importantUpdates && data.importantUpdates.length > 0) {
        showNotification(data.importantUpdates[0]);
      }
    } else {
      // No unread notifications, clear the badge (unless there's a connection issue)
      chrome.storage.local.get(['isNextJsConnected'], (result) => {
        if (result.isNextJsConnected !== false) {
          chrome.action.setBadgeText({ text: '' });
        }
      });
      
      chrome.storage.local.set({ 
        unreadNotifications: 0,
        notifications: data.notifications || []
      });
    }
    
    return data.notifications || [];
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

// Show a system notification
function showNotification(notificationData) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'images/icon128.png',
    title: notificationData.title || 'IndyChat Update',
    message: notificationData.message || 'You have a new notification',
    priority: 2
  });
}

// Handle click events on the extension icon (browser action)
chrome.action.onClicked.addListener((tab) => {
  // This will only trigger if there's no default popup set in the manifest
  // If you have a default popup, this won't be called
  console.log('Extension icon clicked without popup');
  
  // You could open the main app page or a specific extension page
  chrome.tabs.create({ url: CONFIG.nextJsBaseUrl });
});

// Listen for tab updates to potentially inject content scripts
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only proceed if the tab has completely loaded
  if (changeInfo.status === 'complete' && tab.url) {
    // Example: Check if we're on a specific site where we want to inject our content
    if (tab.url.includes('example.com')) {
      chrome.tabs.sendMessage(tabId, { 
        type: 'PAGE_LOADED',
        url: tab.url
      }).catch(error => {
        // This might error if the content script isn't loaded yet, which is fine
        console.log('Could not send message to tab, content script may not be loaded');
      });
    }
  }
});

// Optional: Handle external messages (from your Next.js app via window.postMessage)
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    // Validate the sender
    if (new URL(sender.url).origin !== new URL(CONFIG.nextJsBaseUrl).origin) {
      console.warn('Received message from unauthorized source:', sender.url);
      return;
    }
    
    console.log('External message received:', message);
    
    // Handle various message types from your web app
    if (message.type === 'NEW_NOTIFICATION') {
      // Update the badge and show a notification
      chrome.action.setBadgeText({ text: '1' });
      chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });
      
      if (message.notification) {
        showNotification(message.notification);
      }
      
      sendResponse({ success: true });
    }
  }
);

// Log that the service worker has started
console.log('IndyChat extension background service worker initialized');


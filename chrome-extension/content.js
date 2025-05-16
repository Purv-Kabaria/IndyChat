/**
 * IndyChat Chrome Extension Content Script
 * 
 * This script runs on web pages as specified in the manifest.json.
 * It provides integration between web pages and the extension,
 * allowing for features like text selection sharing and page enhancement.
 */

// Configuration
const CONFIG = {
  // Define any content script specific settings here
  selectionContextMenu: true, // Enable right-click menu on text selection
  enhancePages: true,         // Add IndyChat features to compatible pages
  debug: false                // Set to true for additional console logging
};

// Global state
let state = {
  isExtensionActive: true,
  selectedText: '',
  pageInfo: {
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname
  }
};

// Initialize the content script
function initialize() {
  logDebug('IndyChat content script initialized on: ' + state.pageInfo.url);
  
  // Notify the background script that the content script has loaded
  chrome.runtime.sendMessage({ 
    type: 'CONTENT_LOADED', 
    url: state.pageInfo.url,
    title: state.pageInfo.title
  });
  
  // Set up listeners and functionality
  setupEventListeners();
  setupTextSelectionFeature();
  injectUiComponents();
  
  // Check if we need to enhance this page with IndyChat features
  if (CONFIG.enhancePages) {
    enhancePageIfCompatible();
  }
}

// Set up communication with the background script
function setupEventListeners() {
  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logDebug('Received message in content script:', message);
    
    if (message.type === 'PAGE_LOADED') {
      // The background script is telling us the page has loaded
      // We might want to perform some actions based on this
      sendResponse({ status: 'content_script_ready' });
    }
    
    if (message.type === 'TOGGLE_ACTIVATION') {
      // Toggle whether the extension is active on this page
      state.isExtensionActive = message.isActive;
      updateUiVisibility();
      sendResponse({ status: 'activation_toggled', isActive: state.isExtensionActive });
    }
    
    if (message.type === 'GET_SELECTED_TEXT') {
      // The popup or background script wants the currently selected text
      sendResponse({ selectedText: state.selectedText || getSelectedText() });
    }
    
    // Return true to indicate that we might respond asynchronously
    return true;
  });
}

// Set up the text selection feature
function setupTextSelectionFeature() {
  // Track text selections
  document.addEventListener('mouseup', () => {
    const selectedText = getSelectedText();
    if (selectedText && selectedText !== state.selectedText) {
      state.selectedText = selectedText;
      
      // If the selection is longer than just a few characters, notify the background
      if (selectedText.length > 10) {
        chrome.runtime.sendMessage({ 
          type: 'TEXT_SELECTED', 
          text: selectedText.substring(0, 500) // Limit to first 500 chars for message size
        });
      }
      
      // Show the FloatingButton if we have a non-trivial selection
      if (selectedText.length > 20 && CONFIG.selectionContextMenu) {
        showFloatingButton();
      }
    } else if (!selectedText) {
      state.selectedText = '';
      hideFloatingButton();
    }
  });
  
  // Hide the floating button when clicking elsewhere
  document.addEventListener('mousedown', (e) => {
    // If the click is not on our floating button, hide it
    if (e.target.id !== 'indychat-floating-button' && 
        !e.target.closest('#indychat-floating-button')) {
      hideFloatingButton();
    }
  });
}

// Get the user's current text selection
function getSelectedText() {
  const selection = window.getSelection();
  return selection ? selection.toString().trim() : '';
}

// Show a floating button near selected text
function showFloatingButton() {
  hideFloatingButton(); // Remove any existing button
  
  // Only proceed if the extension is active
  if (!state.isExtensionActive) return;
  
  // Create the floating button if it doesn't exist
  let floatingBtn = document.getElementById('indychat-floating-button');
  if (!floatingBtn) {
    floatingBtn = document.createElement('div');
    floatingBtn.id = 'indychat-floating-button';
    floatingBtn.innerHTML = `
      <div style="
        position: absolute;
        background: #3f51b5;
        color: white;
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 14px;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        cursor: pointer;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 6px;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
        </svg>
        Share with IndyChat
      </div>
    `;
    
    // Add event listener for button click
    floatingBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Send the selected text to the extension
      chrome.runtime.sendMessage({ 
        type: 'SHARE_WITH_INDYCHAT', 
        text: state.selectedText,
        url: state.pageInfo.url,
        title: state.pageInfo.title
      });
      
      hideFloatingButton();
    });
    
    document.body.appendChild(floatingBtn);
  }
  
  // Position the button near the selection
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position above or below the selection based on space available
    const buttonHeight = 40; // Approximate height
    let topPosition = window.scrollY + rect.bottom + 10; // 10px below selection
    
    // If we're too close to the bottom of the viewport, position above
    if (rect.bottom + buttonHeight + 10 > window.innerHeight) {
      topPosition = window.scrollY + rect.top - buttonHeight - 10;
    }
    
    // Center horizontally relative to the selection
    const leftPosition = window.scrollX + rect.left + (rect.width / 2) - 75; // 75px is approx half button width
    
    floatingBtn.style.position = 'absolute';
    floatingBtn.style.top = `${topPosition}px`;
    floatingBtn.style.left = `${Math.max(window.scrollX + 10, leftPosition)}px`; // Ensure not too far left
    floatingBtn.style.display = 'block';
  }
}

// Hide the floating button
function hideFloatingButton() {
  const floatingBtn = document.getElementById('indychat-floating-button');
  if (floatingBtn) {
    floatingBtn.style.display = 'none';
  }
}

// Inject any UI components needed for the extension
function injectUiComponents() {
  // This function would inject any permanent UI elements
  // that the extension needs on the page
  
  // For now, we'll just create a container for future use
  let container = document.getElementById('indychat-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'indychat-container';
    container.style.display = 'none'; // Hidden by default
    document.body.appendChild(container);
  }
}

// Update UI visibility based on extension activation state
function updateUiVisibility() {
  const container = document.getElementById('indychat-container');
  if (container) {
    container.style.display = state.isExtensionActive ? 'block' : 'none';
  }
  
  if (!state.isExtensionActive) {
    hideFloatingButton();
  }
}

// Check if the current page is compatible for enhancement
function enhancePageIfCompatible() {
  // This function would check if the current page
  // should be enhanced with IndyChat functionality
  
  // Example: If we're on a specific domain or page type
  if (window.location.hostname.includes('example.com') || 
      document.querySelector('article, .blog-post, .forum-post')) {
    
    logDebug('Page is compatible for enhancement');
    
    // Add enhancement here - like adding IndyChat comment sections
    // or integrating with existing content
  }
}

// Utility function for conditional logging
function logDebug(...args) {
  if (CONFIG.debug) {
    console.log('[IndyChat]', ...args);
  }
}

// Helper function to safely handle message sending
function sendMessageToBackground(message) {
  try {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        logDebug('Error sending message:', chrome.runtime.lastError);
        return;
      }
      
      logDebug('Background response:', response);
    });
  } catch (error) {
    logDebug('Failed to send message:', error);
  }
}

// Initialize the content script when the page is loaded
if (document.readyState === 'complete') {
  initialize();
} else {
  window.addEventListener('load', initialize);
}


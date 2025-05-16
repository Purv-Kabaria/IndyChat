// Configuration for the Next.js app and Dify API
const CONFIG = {
    // Base URL for the Next.js application
    // Change this to your production URL when deploying
    nextJsBaseUrl: 'http://localhost:3000',
    
    // API endpoints
    endpoints: {
        chat: '/api/chat',  // Updated to match the working Next.js API route
        upload: '/api/upload',
        health: '/api/health'
    },
    
    // Chat configuration
    chat: {
        // Initial greeting message
        welcomeMessage: "Hello! I'm your IndyChat assistant. How can I help you today?",
        
        // Maximum number of messages to keep in history
        maxHistoryLength: 50,
        
        // How many recent messages to display when opening the chat
        displayMessageCount: 10
    }
};

// Chat history management
const CHAT_HISTORY_KEY = 'chatHistory';
const MAX_CHAT_HISTORY_LENGTH = 50;

// Save chat history to Chrome storage
const saveChatHistory = (history) => {
  chrome.storage.local.set({ [CHAT_HISTORY_KEY]: history });
};

// Load chat history from Chrome storage
const loadChatHistory = () => {
  return new Promise((resolve) => {
    chrome.storage.local.get([CHAT_HISTORY_KEY], (result) => {
      resolve(result[CHAT_HISTORY_KEY] || []);
    });
  });
};

// Add a message to chat history
const addMessageToHistory = async (message, isUser = true) => {
  const history = await loadChatHistory();
  const newMessage = {
    content: message,
    sender: isUser ? 'user' : 'bot',
    timestamp: new Date().toISOString()
  };
  
  // Add the new message and trim the history if needed
  const updatedHistory = [newMessage, ...history].slice(0, MAX_CHAT_HISTORY_LENGTH);
  saveChatHistory(updatedHistory);
  
  return newMessage;
};

// Utility functions
const updateStatus = (statusElement, message, isError = false) => {
  if (!statusElement) return;
  
  statusElement.textContent = message;
  statusElement.style.color = isError ? '#d32f2f' : '#4caf50';
  
  // Clear status after 5 seconds
  setTimeout(() => {
    if (statusElement) {
      statusElement.textContent = '';
    }
  }, 5000);
};

const handleApiError = (statusElement, error) => {
  console.error('API Error:', error);
  updateStatus(statusElement, 'Error: ' + (error.message || 'Something went wrong'), true);
};

// Format timestamp to a readable format
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Create a message element and add it to the chat
const createMessageElement = (message, isUser) => {
  const messageEl = document.createElement('div');
  messageEl.classList.add('message');
  messageEl.classList.add(isUser ? 'user-message' : 'bot-message');
  messageEl.textContent = message.content;
  
  const timeEl = document.createElement('div');
  timeEl.classList.add('message-time');
  timeEl.textContent = formatTimestamp(message.timestamp);
  messageEl.appendChild(timeEl);
  
  return messageEl;
};

// Show typing indicator
const showTypingIndicator = () => {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.classList.remove('hidden');
    // Make sure the typing indicator is scrolled into view
    typingIndicator.scrollIntoView({ behavior: 'smooth' });
  }
};

// Hide typing indicator
const hideTypingIndicator = () => {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.classList.add('hidden');
  }
};

// Add a message to the UI
const addMessageToUI = (message, isUser) => {
  const messagesContainer = document.getElementById('messages-container');
  if (!messagesContainer) return;
  
  const messageEl = createMessageElement(message, isUser);
  messagesContainer.appendChild(messageEl);
  
  // Scroll to the bottom of the messages container
  messageEl.scrollIntoView({ behavior: 'smooth' });
};

// Send a chat message to the API and handle the response
const sendChatMessage = async (message, statusElement) => {
  try {
    // Add user message to UI and history
    const userMessage = await addMessageToHistory(message, true);
    addMessageToUI(userMessage, true);
    
    // Show typing indicator
    showTypingIndicator();
    
    // Get conversation ID
    const conversationId = await getConversationId();
    
    // Update the request body format to match Dify API requirements
    // Simplify the request body to only include what's needed by the API
    const requestBody = {
        query: message
    };
    console.log('Sending request to:', `${CONFIG.nextJsBaseUrl}${CONFIG.endpoints.chat}`);
    console.log('Request body:', requestBody);
    
    let response;
    let data;
    let botResponseText;
    
    try {
      // Send message to API with simplified headers
      // Send message to API with headers for streaming response
      response = await fetch(`${CONFIG.nextJsBaseUrl}${CONFIG.endpoints.chat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody)
      });
      // Log detailed response information for debugging
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      // Don't hide typing indicator here - we'll hide it after processing the stream
      
      // Handle non-OK responses with improved error capture
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response (raw):', errorText);
        
        // Try to parse the error as JSON if possible
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Error response (parsed):', errorJson);
          throw new Error(`API error (${response.status}): ${errorJson.error || errorJson.message || response.statusText}`);
        } catch (jsonError) {
          // If it's not valid JSON, use the raw text
          console.error('Could not parse error as JSON:', jsonError);
          throw new Error(`API error (${response.status}): ${errorText || response.statusText}`);
        }
      }
      
      // Handle streaming response
      // Handle streaming response
      try {
        // Create a temporary bot message element for incremental updates
        const tempBotMessage = {
          content: '',
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        addMessageToUI(tempBotMessage, false);
        const messageElement = document.querySelector('.bot-message:last-child');
        
        // Get reader from response body stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botResponseText = '';
        let hasReceivedContent = false;
        
        try {
          // Read the stream
          while (true) {
            try {
              const { done, value } = await reader.read();
              if (done) {
                console.log('Stream complete');
                break;
              }
              
              // Decode the chunk and process it
              const chunk = decoder.decode(value, { stream: true });
              console.log('Received chunk:', chunk);
              
              if (!chunk || chunk.trim() === '') {
                console.log('Empty chunk received, continuing...');
                continue;
              }
              
              // Process the SSE data (format: "data: {JSON}")
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (!line || line.trim() === '') continue;
                
                if (line.startsWith('data:')) {
                  try {
                    // Extract the JSON data
                    const jsonStr = line.substring(5).trim();
                    if (!jsonStr || jsonStr === '[DONE]') continue;
                    
                    const jsonData = JSON.parse(jsonStr);
                    console.log('Parsed SSE data:', jsonData);
                    
                    // Handle different event types from Dify API
                    if (jsonData.event === 'agent_message' && jsonData.answer !== undefined) {
                      // This is the main message content we want to display
                      hasReceivedContent = true;
                      const newContent = jsonData.answer || '';
                      botResponseText += newContent;
                      
                      // Update the temporary message in UI
                      if (messageElement) {
                        messageElement.textContent = botResponseText;
                        // Ensure scrolling follows the message
                        messageElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    } else if (jsonData.event === 'message_end') {
                      // End of message, log any metadata if available
                      console.log('Message complete, metadata:', jsonData.metadata);
                    } else if (jsonData.event === 'agent_thought') {
                      // Agent's thought process, can be used for debugging
                      console.log('Agent thought:', jsonData.thought || '');
                    }
                  } catch (parseError) {
                    console.error('Error parsing SSE data:', parseError, line);
                    // Don't throw here, try to continue processing other lines
                  }
                }
              }
            } catch (streamError) {
              console.error('Error reading stream:', streamError);
              // Don't break the loop for a single error, try to continue
              continue;
            }
          }
          
          // Always hide typing indicator after stream is complete
          hideTypingIndicator();
          
          console.log('Complete bot response:', botResponseText);
          
          // If no response was received, use a fallback message
          if (!hasReceivedContent || !botResponseText) {
            botResponseText = "I received your message, but I couldn't generate a proper response.";
            if (messageElement) {
              messageElement.textContent = botResponseText;
            }
          }
          
          // Save the final message to history
          await addMessageToHistory(botResponseText, false);
          
        } catch (streamProcessingError) {
          // Handle errors during stream processing
          console.error('Stream processing failed:', streamProcessingError);
          hideTypingIndicator();
          
          // Show an error message in the UI
          const errorMessage = "Sorry, there was an error processing the response stream.";
          if (messageElement) {
            messageElement.textContent = errorMessage;
          }
          
          // Save the error message to history
          await addMessageToHistory(errorMessage, false);
        }
      } catch (responseSetupError) {
        // Handle errors during response setup (before streaming)
        console.error('Failed to set up streaming response:', responseSetupError);
        hideTypingIndicator();
        
        // Show an error message in the UI and save to history
        const errorMessage = "Sorry, there was an error setting up the chat connection.";
        const errorBotMessage = {
          content: errorMessage,
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        addMessageToUI(errorBotMessage, false);
        await addMessageToHistory(errorMessage, false);
      }
    } catch (error) {
      // Handle all request errors in one place
      console.error('API request failed:', error);
      hideTypingIndicator();
      
      // Add error message to chat
      const errorMessage = await addMessageToHistory('Sorry, there was an error processing your request. Please try again.', false);
      addMessageToUI(errorMessage, false);
      
      // Update status with error information
      updateStatus(statusElement, `Error: ${error.message}`, true);
      
      return null;
    }
  } catch (error) {
    console.error('Chat request failed:', error);
    hideTypingIndicator();
    
    // Detailed error handling
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      // Network error - server is probably down or unreachable
      console.error('Network error - API server unreachable');
      updateStatus(statusElement, 'Cannot connect to chat server. Please check your connection.', true);
    } else if (error.message.includes('Server error (429)')) {
      // Rate limiting error
      updateStatus(statusElement, 'Too many requests. Please try again in a moment.', true);
    } else {
      // General API error
      handleApiError(statusElement, error);
    }
    
    // Add error message to chat
    const errorMessage = await addMessageToHistory('Sorry, there was an error processing your request. Please try again later.', false);
    addMessageToUI(errorMessage, false);
    
    return null;
  }
};

// Helper function to get conversation ID from storage
const getConversationId = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['conversationId'], (result) => {
      if (result.conversationId) {
        resolve(result.conversationId);
      } else {
        // Generate a new conversation ID if none exists
        const newId = 'conv_' + Date.now();
        chrome.storage.local.set({ conversationId: newId });
        resolve(newId);
      }
    });
  });
};

// Helper function to extract bot response from API data based on format
const getBotResponseFromData = (data) => {
  // Attempt to extract response text from various possible response formats
  // Adjust based on your actual API response structure
  if (typeof data === 'string') {
    return data;
  }
  
  if (data.response) {
    return data.response;
  }
  
  if (data.message) {
    return data.message;
  }
  
  if (data.text) {
    return data.text;
  }
  
  if (data.content) {
    return data.content;
  }
  
  if (data.answer) {
    return data.answer;
  }
  
  // If we can't find a recognizable format, return a fallback message
  console.warn('Unknown API response format:', data);
  return 'I received your message, but I\'m having trouble formatting my response.';
};

// Check if the Next.js app is accessible
const checkConnectionStatus = async (statusElement) => {
  try {
    const response = await fetch(`${CONFIG.nextJsBaseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const isConnected = response.ok;
    
    if (isConnected) {
      updateStatus(statusElement, 'Connected to API', false);
      return true;
    } else {
      updateStatus(statusElement, 'API connection error', true);
      return false;
    }
  } catch (error) {
    console.error('Connection check error:', error);
    updateStatus(statusElement, 'API connection error', true);
    return false;
  }
};

// Initialize the chat UI with history and event listeners
const initializeChatUI = async () => {
  const messagesContainer = document.getElementById('messages-container');
  if (!messagesContainer) return;
  
  // Clear any existing messages first
  messagesContainer.innerHTML = '';
  
  // Add welcome message if there's no history
  const history = await loadChatHistory();
  if (history.length === 0) {
    // Add the welcome message from the HTML
    const welcomeMessage = {
      content: "Hello! I'm your IndyChat assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date().toISOString()
    };
    addMessageToUI(welcomeMessage, false);
    await addMessageToHistory(welcomeMessage.content, false);
  } else {
    // Display most recent messages (in reverse order since newest are first in storage)
    const recentMessages = history.slice(0, 10).reverse();
    recentMessages.forEach(message => {
      addMessageToUI(message, message.sender === 'user');
    });
  }
};

// Function to refresh the chat
const refreshChat = async () => {
  // Show loading indicator
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.remove('hidden');
  }

  try {
    // Clear chat history from storage
    await saveChatHistory([]);
    
    // Wait a moment for visual feedback of the refresh
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Reinitialize the UI with just the welcome message
    await initializeChatUI();
    
    // Update status
    const statusElement = document.getElementById('status');
    updateStatus(statusElement, 'Chat refreshed', false);
  } catch (error) {
    console.error('Error refreshing chat:', error);
    const statusElement = document.getElementById('status');
    updateStatus(statusElement, 'Error refreshing chat', true);
  } finally {
    // Hide loading indicator
    if (loading) {
      loading.classList.add('hidden');
    }
  }
};

// Handle send message when user clicks send button or presses Enter
const handleSendMessage = async () => {
  const messageInput = document.getElementById('message-input');
  const statusElement = document.getElementById('status');
  
  if (!messageInput) return;
  
  const message = messageInput.value.trim();
  if (!message) {
    updateStatus(statusElement, 'Please enter a message', true);
    return;
  }
  
  // Clear input field
  messageInput.value = '';
  
  // Send message to API
  await sendChatMessage(message, statusElement);
};

// Wait for DOM to be fully loaded before accessing elements
document.addEventListener('DOMContentLoaded', async function() {
  // DOM elements
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const openAppButton = document.getElementById('openApp');
  const refreshButton = document.getElementById('refresh-chat');
  const statusElement = document.getElementById('status');
  const loading = document.getElementById('loading');
  
  // Show loading indicator
  if (loading) {
    loading.classList.remove('hidden');
  }
  
  // Initialize chat UI with history
  await initializeChatUI();
  
  // Check connection status with the API
  const isConnected = await checkConnectionStatus(statusElement);
  console.log('Connection status:', isConnected ? 'Connected' : 'Disconnected');
  
  // Hide loading indicator
  if (loading) {
    loading.classList.add('hidden');
  }
  
  // Event Handlers
  // Send message when clicking the send button
  if (sendButton) {
    sendButton.addEventListener('click', handleSendMessage);
  }
  
  // Send message when pressing Enter in the input field
  if (messageInput) {
    messageInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSendMessage();
      }
    });
    
    // Focus the input field when the popup opens
    messageInput.focus();
  }
  
  // Open the Next.js application in a new tab
  if (openAppButton) {
    openAppButton.addEventListener('click', () => {
      chrome.tabs.create({ url: CONFIG.nextJsBaseUrl });
    });
  }
  
  // Add event listener for refresh button
  if (refreshButton) {
    refreshButton.addEventListener('click', refreshChat);
  }
  
  // Check for connection status updates from background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'CONNECTION_STATUS_UPDATE') {
      updateStatus(statusElement, 
        message.isConnected ? 'Connected to API' : 'API connection error', 
        !message.isConnected);
    }
  });
  
  // Inform background script that popup is open
  chrome.runtime.sendMessage({ type: 'POPUP_OPENED' });
});

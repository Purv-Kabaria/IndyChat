// Constants
const DIFY_API_KEY = 'app-3OpCWrbRkXEDPuDIYlojNVkL';
const API_BASE_URL = 'https://api.dify.ai/v1';  // Include v1 in the base URL
const API_TIMEOUT = 30000; // 30 seconds timeout for API calls
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// DOM Elements
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.getElementById('messages-container');
const refreshButton = document.getElementById('refresh-chat');
const loadingIndicator = document.getElementById('loading');
const typingIndicator = document.getElementById('typing-indicator');
const fileUpload = document.getElementById('file-upload');
const filePreview = document.getElementById('file-preview');
const fileName = document.getElementById('file-name');
const removeFileButton = document.getElementById('remove-file');
const statusElement = document.getElementById('status');

// State
let currentFile = null;
let conversationId = null; // Track conversation ID for chat continuity

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Check for existing conversation ID
    chrome.storage.local.get(['conversationId'], (result) => {
        if (result.conversationId) {
            conversationId = result.conversationId;
        }
        
        // Load saved chat history
        loadChatHistory();
        
        // Setup event listeners
        setupEventListeners();
        
        // Force layout reflow to ensure animations work
        setTimeout(() => {
            document.querySelector('.container').style.opacity = '1';
        }, 100);
        
        // Verify API connectivity
        checkApiConnection();
    });
}

// Check API connection
// Check API connection
async function checkApiConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/chat-messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: {},
                query: "Hello",
                user: "user",
                response_mode: "streaming",  // Changed from "blocking" to "streaming"
                stream: true  // Changed from false to true
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Connection Test Error:', errorData);
            showStatus('API connection issue. Please check your API key.', 'warning');
            return false;
        } else {
            // For streaming responses, we need to verify that we can read the stream
            try {
                const reader = response.body.getReader();
                // Read just the first chunk to verify the stream works
                const { done, value } = await reader.read();
                
                if (done) {
                    console.log('Stream ended immediately, but connection was successful');
                    return true;
                }
                
                // Check if we got valid data in the first chunk
                const chunk = new TextDecoder().decode(value);
                console.log('API Connection Test - First chunk received:', chunk);
                
                if (chunk.includes('data:')) {
                    console.log('API connection successful with streaming response');
                    
                    // Close the reader and release the stream resources
                    reader.cancel();
                    return true;
                } else {
                    console.warn('API response does not contain expected format');
                    showStatus('API connection issue. Unexpected response format.', 'warning');
                    return false;
                }
            } catch (streamError) {
                console.error('Error reading stream:', streamError);
                showStatus('API connection issue. Could not process streaming response.', 'warning');
                return false;
            }
        }
    } catch (error) {
        console.error('API connection test error:', error);
        showStatus('API connection issue. Please check your internet connection.', 'warning');
        return false;
    }
}

// Event Listeners Setup
function setupEventListeners() {
    sendButton.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    refreshButton.addEventListener('click', handleRefreshChat);
    fileUpload.addEventListener('change', handleFileSelect);
    removeFileButton.addEventListener('click', removeFile);
}

// File Handling Functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        currentFile = file;
        fileName.textContent = file.name;
        filePreview.classList.add('active');
    }
}

function removeFile() {
    currentFile = null;
    fileUpload.value = '';
    filePreview.classList.remove('active');
}

async function uploadFile(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        // Using the constant for consistency
        const response = await fetch(`${API_BASE_URL}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIFY_API_KEY}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('File upload failed');
        }

        const data = await response.json();
        return data.id; // Return the file ID from Dify
    } catch (error) {
        console.error('Error uploading file:', error);
        showStatus('Error uploading file. Please try again.', 'error');
        return null;
    }
}

// Message Handling Functions
// Add this new function to handle streaming messages
function createOrUpdateStreamingMessage(content, isThinking = false) {
    let messageElement = document.querySelector('.bot-message.streaming');
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    if (!messageElement) {
        // Create a new streaming message element if it doesn't exist
        messageElement = document.createElement('div');
        messageElement.classList.add('message', 'bot-message', 'streaming');
        
        const textElement = document.createElement('div');
        textElement.classList.add('message-content');
        messageElement.appendChild(textElement);
        
        const timeElement = document.createElement('div');
        timeElement.classList.add('message-timestamp');
        timeElement.textContent = timestamp;
        messageElement.appendChild(timeElement);
        
        messagesContainer.appendChild(messageElement);
    }
    
    // Update the content
    const textElement = messageElement.querySelector('.message-content');
    
    // Add thinking indicator if needed
    if (isThinking) {
        textElement.innerHTML = `<em>${content}</em>`;
        messageElement.classList.add('thinking');
    } else {
        textElement.textContent = content;
        messageElement.classList.remove('thinking');
    }
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageElement;
}

// Convert streaming message to permanent one
function finalizeStreamingMessage(content) {
    const messageElement = document.querySelector('.bot-message.streaming');
    if (messageElement) {
        messageElement.classList.remove('streaming', 'thinking');
        const textElement = messageElement.querySelector('.message-content');
        textElement.textContent = content;
        
        // Force scroll to bottom to ensure the final message is visible
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Save chat history once the message is finalized
        saveChatHistory();
        
        console.log('Message finalized with content:', content);
    } else {
        console.warn('No streaming message element found to finalize');
    }
}

async function handleSendMessage() {
    const message = messageInput.value.trim();
    if (!message && !currentFile) return;

    showLoading(true);
    
    // Add user message with timestamp
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    addMessage(message, 'user', timestamp);
    
    messageInput.value = '';
    messageInput.focus();
    
    let fileId = null;
    if (currentFile) {
        try {
            fileId = await uploadFile(currentFile);
            if (!fileId) {
                showStatus('File upload failed. Sending message without file.', 'warning');
            }
        } catch (error) {
            console.error('File upload error:', error);
            showStatus('File upload failed. Sending message without file.', 'warning');
        }
        removeFile();
    }
    
    // For tracking whether we had a successful response
    let hadSuccessfulResponse = false;
    
    try {
        showTypingIndicator(true);
        console.log('Sending message to Dify API:', message, fileId ? 'with file' : 'without file');
        
        // Create initial streaming message with typing indicator
        // This will be updated by the streaming response handler
        createOrUpdateStreamingMessage('Thinking...', true);
        
        // Call sendMessageToDify to handle streaming response
        const response = await sendMessageToDify(message, fileId);
        console.log('Final response from Dify API:', response);
        
        // Mark that we received a response object
        hadSuccessfulResponse = true;
        
        // Check if there's a valid answer - this check happens AFTER streaming is complete
        // and is mainly a safety check since sendMessageToDify should already validate
        if (!response || !response.answer || response.answer.trim() === '') {
            console.warn('Invalid response object:', response);
            showStatus('No valid response received. Please try again.', 'warning');
            
            // Rather than throwing an error, we'll handle this as a success case
            // with a default message, since the streaming may have partially worked
            createOrUpdateStreamingMessage("I'm sorry, I couldn't generate a complete response. Please try again.", false);
            finalizeStreamingMessage("I'm sorry, I couldn't generate a complete response. Please try again.");
        } else {
            // The streaming UI should already be updated, but ensure it's finalized
            finalizeStreamingMessage(response.answer);
            console.log('Successfully finalized message with content:', response.answer);
        }
    } catch (error) {
        console.error('API Error:', error);
        showStatus(`Failed to send message: ${error.message}`, 'error');
        
        // Clean up UI elements based on error state
        const streamingMessage = document.querySelector('.bot-message.streaming');
        
        if (streamingMessage) {
            // If streaming started but failed partway through
            streamingMessage.remove();
        } else if (!hadSuccessfulResponse) {
            // If the API call failed completely before streaming started
            // Remove the last message (user message) since no response was received
            const lastMessage = messagesContainer.lastElementChild;
            if (lastMessage && lastMessage.classList.contains('user-message')) {
                lastMessage.remove();
            }
        }
        
        saveChatHistory();
    } finally {
        // Always ensure we clean up loading states
        showTypingIndicator(false);
        showLoading(false);
    }
}

async function sendMessageToDify(message, fileId) {
    const endpoint = `${API_BASE_URL}/chat-messages`;  // Remove v1 since it's in base URL
    const payload = {
        inputs: {},
        query: message,
        user: "user",
        response_mode: "streaming",  // Changed from "blocking" to "streaming"
        stream: true  // Changed from false to true
    };
    
    // Add conversation ID if exists (for conversation continuity)
    if (conversationId) {
        payload.conversation_id = conversationId;
    }

    if (fileId) {
        payload.files = [fileId];
    }
    
    // Create a controller for the fetch request to allow timeout
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Set up timeout
    const timeout = setTimeout(() => {
        controller.abort();
    }, API_TIMEOUT);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIFY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: signal
        });

        // Clear the timeout since the request completed
        clearTimeout(timeout);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error Response:', errorData);
            throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        // Handle streaming response
        const reader = response.body.getReader();
        let fullAnswer = '';
        let receivedConversationId = null;
        let isFirstChunk = true;
        let currentThinking = '';
        
        // Process the streamed response
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }
            
            // Convert the chunk to text
            // Convert the chunk to text
            const chunk = new TextDecoder().decode(value);
            console.log('Received chunk:', chunk);
            console.log('Chunk length:', chunk.length, 'Content type:', typeof chunk);
            
            // Flag to track if we received any real content in this chunk
            let hasContentInChunk = false;
            
            // Process each line in the chunk - use a more robust split method 
            // that handles various line endings
            const lines = chunk.split(/\r?\n/).filter(line => line.trim() !== '');
            
            for (const line of lines) {
                if (line.trim().startsWith('data: ')) {
                    try {
                        // Extract JSON data from the line
                        const jsonStr = line.substring(line.indexOf('data: ') + 6).trim();
                        // Skip empty data lines
                        if (!jsonStr) continue;
                        
                        const data = JSON.parse(jsonStr);
                        console.log('Event type:', data.event);
                        
                        // Extract conversation ID if available
                        if (data.conversation_id && !receivedConversationId) {
                            receivedConversationId = data.conversation_id;
                            console.log('Received conversation ID:', receivedConversationId);
                            // Store the conversation ID for future use
                            conversationId = receivedConversationId;
                            chrome.storage.local.set({ 'conversationId': conversationId });
                        }
                        
                        // Handle different event types
                        if (data.event === 'agent_message') {
                            // Check if we have answer content
                            if (data.answer !== undefined) {
                                console.log('Raw answer content:', JSON.stringify(data.answer));
                                
                                // Add content even if it's empty - it might be important formatting
                                fullAnswer += data.answer;
                                
                                // If we have any visible content, mark the chunk as containing content
                                if (data.answer && data.answer.trim() !== '') {
                                    console.log('Meaningful content received:', JSON.stringify(data.answer));
                                    hasContentInChunk = true;
                                }
                                
                                // Always update UI with current content, even if just whitespace
                                // This ensures proper formatting with newlines etc.
                                createOrUpdateStreamingMessage(fullAnswer, false);
                            }
                        } else if (data.event === 'agent_thought') {
                            // Process thinking content
                            currentThinking = data.thinking || data.thought || 'Thinking...';
                            console.log('Thought received:', currentThinking);
                            
                            // Only show thinking if we don't have an answer yet
                            if (!fullAnswer.trim()) {
                                createOrUpdateStreamingMessage(currentThinking, true);
                            }
                        } else if (data.event === 'agent_action') {
                            // Process action content
                            const actionText = data.action || 'Performing action...';
                            console.log('Action received:', actionText);
                            
                            if (!fullAnswer.trim()) {
                                createOrUpdateStreamingMessage(`${currentThinking}\n\nAction: ${actionText}`, true);
                            }
                        } else if (data.event === 'message_end') {
                            console.log('Message end event received');
                            
                            // Finalize message content
                            if (fullAnswer.trim() === '') {
                                if (currentThinking) {
                                    // If we have no answer but have thinking, use thinking as answer
                                    fullAnswer = currentThinking;
                                    createOrUpdateStreamingMessage(fullAnswer, false);
                                    console.log('Using thought as answer:', fullAnswer);
                                } else {
                                    // Fallback message if no content received
                                    fullAnswer = "I'm sorry, I couldn't generate a response. Please try again.";
                                    createOrUpdateStreamingMessage(fullAnswer, false);
                                    console.log('Using fallback message:', fullAnswer);
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing data line:', e, line);
                    }
                }
            }
            
            // Log chunk processing results
            if (hasContentInChunk) {
                console.log('Content processed in this chunk. Current answer:', fullAnswer);
            } else {
                console.log('No content in this chunk. Current answer length:', fullAnswer.length);
            }
        }
        
        // Log the final answer state
        console.log('Final processing complete');
        console.log('Final answer:', fullAnswer);
        console.log('Answer length:', fullAnswer.length);
        
        // Final check to ensure we have content
        if (!fullAnswer || fullAnswer.trim() === '') {
            console.warn('No valid content received from assistant after all processing');
            fullAnswer = "I'm sorry, I couldn't generate a response. Please try again.";
            
            // Update UI with default message and make it visible
            createOrUpdateStreamingMessage(fullAnswer, false);
            
            // Log this as an error for debugging
            console.error('API returned no usable content after full processing');
        } else {
            console.log('Successfully processed streaming response with content:', fullAnswer);
        }
        
        // Ensure the message is finalized in UI
        finalizeStreamingMessage(fullAnswer);
        return {
            answer: fullAnswer,
            conversation_id: receivedConversationId || conversationId
        };
    } catch (error) {
        console.error('Detailed error:', error);
        throw new Error(`Failed to send message: ${error.message}`);
    }
}

// UI Functions
function addMessage(content, sender, timestamp) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);
    
    const textElement = document.createElement('div');
    textElement.textContent = content;
    messageElement.appendChild(textElement);
    
    if (timestamp) {
        const timeElement = document.createElement('div');
        timeElement.classList.add('message-timestamp');
        timeElement.textContent = timestamp;
        messageElement.appendChild(timeElement);
    }
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Save to chat history
    saveChatHistory();
}

function showLoading(show) {
    loadingIndicator.classList.toggle('hidden', !show);
}

function showTypingIndicator(show) {
    typingIndicator.classList.toggle('hidden', !show);
}

function showStatus(message, type = 'info') {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = 'status';
    }, 3000);
}

// Chat History Management
function saveChatHistory() {
    const messages = Array.from(messagesContainer.children).map(msg => ({
        content: msg.querySelector('div:not(.message-timestamp)') ? 
                msg.querySelector('div:not(.message-timestamp)').textContent : 
                msg.textContent,
        sender: msg.classList.contains('user-message') ? 'user' : 'bot',
        timestamp: msg.querySelector('.message-timestamp')?.textContent
    }));
    
    chrome.storage.local.set({ 'chatHistory': messages });
}

function loadChatHistory() {
    chrome.storage.local.get(['chatHistory'], (result) => {
        if (result.chatHistory) {
            result.chatHistory.forEach(msg => {
                addMessage(msg.content, msg.sender, msg.timestamp);
            });
        } else {
            // Add welcome message if no history
            const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            addMessage("Hello! I'm your IndyChat assistant. How can I help you today?", 'bot', timestamp);
        }
    });
}

function handleRefreshChat() {
    chrome.storage.local.remove(['chatHistory', 'conversationId'], () => {
        conversationId = null;
        messagesContainer.innerHTML = '';
        const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        addMessage("Hello! I'm your IndyChat assistant. How can I help you today?", 'bot', timestamp);
    });
}

// Error Handling
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error: ', msg, url, lineNo, columnNo, error);
    showStatus('An error occurred. Please try again.', 'error');
    return false;
};


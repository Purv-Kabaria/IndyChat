"""
Ollama integration using Langchain with monitoring.

Ye file Ollama LLM server ke sath integration provide karta hai.
Langchain ka use karke Ollama API se connect hota hai aur monitored chat responses generate karta hai.
PDF context ko bhi prompts me incorporate karne ki functionality hai.
LangSmith monitoring se LLM interactions ko track kiya jata hai.
"""
import asyncio
import json
import logging
import os
import uuid
from typing import AsyncIterator, Dict, List, Optional, Any, Callable, Union
import aiohttp

# Langchain imports
from langchain_community.llms.ollama import Ollama
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain.chains import LLMChain
from langchain.chains.conversation.memory import ConversationBufferMemory

# Local imports
from .monitoring import get_callback_manager, ENABLE_TRACING

# Logging setup karna taaki debug aur error messages track kar sake
logger = logging.getLogger(__name__)


class OllamaHandler:
    """
    Handler for Ollama model integration with Langchain monitoring.
    
    Ye class Ollama LLM models ke sath integration handle karti hai.
    Chat completion, PDF context integration, aur streaming responses ki functionality provide karti hai.
    Langchain monitoring ka use karke LLM interactions ko track karta hai.
    """

    def __init__(self, pdf_handler=None):
        """
        Initialize the Ollama handler with configuration from environment variables.
        
        Args:
            pdf_handler: Optional PDFHandler instance for context enhancement
            
        Environment variables se configuration load karta hai aur Ollama handler ko initialize karta hai.
        PDF handler optional hai - agar provided hai to PDF context se responses enhance karta hai.
        Langchain wrappers initialize karta hai monitoring ke liye.
        """
        # Ollama server ka base URL - environment se ya default localhost
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        
        # Konsa model use karna hai - environment se ya default gemma:2b
        self.model_name = os.getenv("MODEL_NAME", "gemma:2b")
        
        # PDF handler reference store karna
        self.pdf_handler = pdf_handler
        
        # Initialize Langchain Ollama LLM without callbacks (added per request)
        self.ollama_llm = None  # Will be initialized with callbacks for each request
        
        # Prompt templates for chat with/without context
        self.standard_prompt = ChatPromptTemplate.from_messages([
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}")
        ])
        
        self.context_prompt = ChatPromptTemplate.from_messages([
            ("system", "Below is reference information from documents that may be helpful for answering questions:\n\n{context}\n\nPlease use this information when relevant to answer the user's questions."),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}")
        ])
        
        # Initialization ka log message
        logger.info(f"Initializing Ollama handler with model {self.model_name} at {self.base_url} with monitoring")

    async def generate_chat_response(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = None,
        use_pdf_context: bool = False,
        pdf_filename: Optional[str] = None
    ) -> AsyncIterator[str]:
        """
        Generate a chat response using the Ollama model.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            temperature: Sampling temperature
            max_tokens: Maximum number of tokens to generate
            use_pdf_context: Whether to include PDF context
            pdf_filename: Optional specific PDF to use for context
            
        Yields:
            Chunks of the generated text response
            
        Ollama model ka use karke chat response generate karta hai.
        Streaming response format me results return karta hai, jisse frontend par real-time updates dikha sake.
        PDF context add karne ka option bhi hai, jisse model ko reference information mil sake.
        Langchain monitoring ke sath interactions ko track karta hai.
        """
        try:
            # Create a unique session ID for tracking
            session_id = str(uuid.uuid4())
            
            # Set up callback manager with monitoring
            callback_manager = get_callback_manager(
                session_id=session_id, 
                context_used=use_pdf_context
            )
            
            # Initialize Ollama LLM with callbacks for this specific request
            self.ollama_llm = Ollama(
                model=self.model_name,
                temperature=temperature,
                callback_manager=callback_manager,
                base_url=self.base_url,
                stop=["</s>"],  # Common stop token for most models
                streaming=True,
                num_predict=max_tokens if max_tokens else 1000
            )
            
            # Convert messages to Langchain format for history
            chat_history = self._convert_to_langchain_messages(messages)
            
            # Extract the latest user message for the prompt
            user_message = ""
            for msg in reversed(messages):
                if msg["role"] == "user":
                    user_message = msg["content"]
                    break
            
            # Use different logic for PDF context vs regular chat
            if use_pdf_context and self.pdf_handler:
                # Get PDF context
                pdf_content = self.pdf_handler.get_pdf_content(pdf_filename)
                
                # Prepare for streaming response with monitoring
                # Unique request ID generate karna response tracking ke liye
                request_id = session_id
                
                # Set up the chain here but execute manually to handle streaming
                if pdf_content:
                    logger.info(f"Using PDF context for session {session_id}")
                    
                    # For streaming, we need to use the raw Ollama API
                    # Format messages with context
                    prompt = self._build_prompt(messages, use_pdf_context, pdf_filename)
                    
                    # Prepare the request payload - Ollama API ke liye request payload tayar karna
                    payload = {
                        "model": self.model_name,       # Konsa model use karna hai
                        "prompt": prompt,               # Formatted prompt string
                        "stream": True,                 # Streaming response enable karna
                        "temperature": temperature,     # Kitni randomness chahiye (0-1)
                    }
                    if max_tokens:
                        payload["num_predict"] = max_tokens  # Maximum kitne tokens generate karne hain
                else:
                    # No PDF content available, use standard prompt
                    prompt = self._build_prompt(messages, False, None)
                    
                    # Prepare the request payload
                    payload = {
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": True,
                        "temperature": temperature,
                    }
                    if max_tokens:
                        payload["num_predict"] = max_tokens
                    
                    logger.warning(f"Requested PDF context but none available for session {session_id}")
            else:
                # Regular chat without PDF context
                # Format regular prompt
                prompt = self._build_prompt(messages, False, None)
                
                # Prepare the request payload
                payload = {
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": True,
                    "temperature": temperature,
                }
                if max_tokens:
                    payload["num_predict"] = max_tokens
                
                # Request ID for tracking
                request_id = session_id
            
            # Log the request with LangSmith trace ID if available
            if ENABLE_TRACING:
                logger.info(f"Chat request with trace ID: {session_id}")
            
            # HTTP session create karke Ollama API ko request bhejta hai
            # We still use direct API for streaming but with monitoring metadata
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=300),  # Long timeout for complex generations
                    headers={"X-LangSmith-Trace-ID": session_id} if ENABLE_TRACING else {}
                ) as response:
                    # Error handling - agar API se 200 status nahi mila
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Ollama API error: {error_text}")
                    
                    # Process the streaming response - Stream me aane wale chunks ko process karna
                    async for line in response.content:
                        if not line:
                            continue
                            
                        try:
                            # Har line ko JSON me parse karna
                            chunk_data = json.loads(line)
                            
                            # Agar error aaya hai to use client ko return karna
                            if "error" in chunk_data:
                                # Log error with trace ID if monitoring is enabled
                                if ENABLE_TRACING:
                                    logger.error(f"Ollama error in session {session_id}: {chunk_data['error']}")
                                
                                yield json.dumps({
                                    "error": chunk_data["error"],
                                    "trace_id": session_id if ENABLE_TRACING else None
                                })
                                break

                            # Format the response chunk - Har chunk ko client ke liye format karna
                            response_text = chunk_data.get("response", "")
                            
                            # Track the chunk in monitoring system
                            if ENABLE_TRACING and response_text:
                                # We're monitoring at the chunk level
                                pass  # The headers already include the trace ID
                            
                            # Frontend ko compatible format me response bhejta hai
                            response_chunk = {
                                "id": request_id,
                                "model": self.model_name,
                                "delta": {
                                    "role": "assistant",
                                    "content": response_text
                                },
                                "finish_reason": "stop" if chunk_data.get("done", False) else None,
                                "trace_id": session_id if ENABLE_TRACING else None
                            }
                            
                            # Formatted chunk ko yield karna
                            yield json.dumps(response_chunk)
                            
                            # Agar response complete ho gaya hai to completion metrics log karna
                            if chunk_data.get("done", False):
                                # Log completion metrics for monitoring
                                if "eval_count" in chunk_data:
                                    logger.info(f"Session {session_id} completed with {chunk_data.get('eval_count', 0)} tokens generated")
                                
                                # Add final monitoring data
                                if ENABLE_TRACING:
                                    # Log final metrics to LangSmith
                                    completion_metrics = {
                                        "total_duration": chunk_data.get("total_duration", 0),
                                        "tokens_generated": chunk_data.get("eval_count", 0),
                                        "context_used": use_pdf_context
                                    }
                                    logger.info(f"Completion metrics for {session_id}: {json.dumps(completion_metrics)}")
                                
                                break

                        except json.JSONDecodeError as e:
                            # JSON parsing error handling - Invalid JSON chunk ko skip karna
                            logger.error(f"Error decoding response chunk in session {session_id}: {e}")
                            continue

        except Exception as e:
            # Global error handling - Koi bhi unexpected error ko log aur client ko notify karna
            error_msg = f"Error generating chat response: {str(e)}"
            logger.error(f"{error_msg} (session: {session_id if 'session_id' in locals() else 'unknown'})")
            
            # Include trace ID in error response if available
            yield json.dumps({
                "error": error_msg,
                "trace_id": session_id if 'session_id' in locals() and ENABLE_TRACING else None
            })
    
    def _convert_to_langchain_messages(self, messages: List[Dict[str, str]]) -> List[Union[SystemMessage, HumanMessage, AIMessage]]:
        """
        Convert standard message format to Langchain message objects.
        
        Args:
            messages: List of dictionaries with 'role' and 'content'
            
        Returns:
            List of Langchain message objects
            
        Standard message format ko Langchain ke message objects me convert karta hai.
        Monitoring aur tracing ke liye message objects ka use hota hai.
        """
        lc_messages = []
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            
            if role == "system":
                lc_messages.append(SystemMessage(content=content))
            elif role == "user":
                lc_messages.append(HumanMessage(content=content))
            elif role == "assistant":
                lc_messages.append(AIMessage(content=content))
                
        return lc_messages

    def _build_prompt(self, 
                messages: List[Dict[str, str]], 
                use_pdf_context: bool = False,
                pdf_filename: Optional[str] = None
            ) -> str:
        """
        Build a prompt from a list of messages, optionally including PDF context.
        
        Args:
            messages: List of message dictionaries
            use_pdf_context: Whether to include PDF context
            pdf_filename: Specific PDF to use as context (None means use all)
            
        Returns:
            A formatted prompt string
            
        Message list se formatted prompt string create karta hai.
        Optionally PDF content ko bhi system message ke roop me prompt me add karta hai.
        Har message ko appropriate tags (<system>, <user>, <assistant>) ke sath format karta hai.
        """
        prompt = ""
        
        # Add PDF context if requested and available - PDF context ko add karna agar requested hai
        if use_pdf_context and self.pdf_handler:
            # PDF handler se content retrieve karna
            pdf_content = self.pdf_handler.get_pdf_content(pdf_filename)
            if pdf_content:
                # PDF content ko system message ke roop me prompt ke shuruat me add karna
                # Ye model ko reference information provide karta hai questions answer karne ke liye
                prompt += f"<system>\nBelow is reference information from documents that may be helpful for answering questions:\n\n{pdf_content}\n\nPlease use this information when relevant to answer the user's questions.\n</system>\n\n"
        
        # Add the regular messages - Regular conversation messages ko add karna
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            
            # Har message ko uske role ke hisaab se format karna
            if role == "system":
                # System message - instructions ya context provide karta hai
                prompt += f"<system>\n{content}\n</system>\n\n"
            elif role == "user":
                # User message - user ke inputs/questions
                prompt += f"<user>\n{content}\n</user>\n\n"
            elif role == "assistant":
                # Assistant message - pehle ke model responses
                prompt += f"<assistant>\n{content}\n</assistant>\n\n"
        
        # Final assistant tag add karna jahan model ka response start hoga
        prompt += "<assistant>\n"
        return prompt



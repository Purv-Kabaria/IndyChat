"""
Monitoring configuration for LLM interactions using Langchain and LangSmith.

Is file mein LLM interactions ko track karne ke liye monitoring setup kiya gaya hai.
LangSmith ka use karke LLM calls, chains, aur prompts ka performance monitoring kiya jata hai.
"""
import os
import logging
from typing import Dict, List, Optional, Any, Union
from langchain_core.callbacks import CallbackManager
from langchain_core.tracers import LangChainTracer
from langsmith import Client
from langchain_core.callbacks.base import BaseCallbackHandler

# Configure logging
logger = logging.getLogger(__name__)

# LangSmith configuration
LANGCHAIN_API_KEY = os.getenv("LANGCHAIN_API_KEY", "")
LANGCHAIN_PROJECT = os.getenv("LANGCHAIN_PROJECT", "indychat-dev")
LANGCHAIN_ENDPOINT = os.getenv("LANGCHAIN_ENDPOINT", "https://api.smith.langchain.com")

# Enable tracing if API key is provided
ENABLE_TRACING = bool(LANGCHAIN_API_KEY)

class ChatMonitoringHandler(BaseCallbackHandler):
    """
    Custom callback handler for monitoring chat interactions.
    
    Chat interactions ko monitor karne ke liye custom callback handler.
    User queries, PDF context usage, aur response generation ko track karta hai.
    """
    
    def __init__(self, session_id: str = "", context_used: bool = False):
        """Initialize the chat monitoring handler."""
        self.session_id = session_id
        self.context_used = context_used
        self.user_message = ""
        self.response = ""
        self.metadata: Dict[str, Any] = {
            "session_id": session_id,
            "context_used": context_used,
        }
    
    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs: Any
    ) -> None:
        """Called when LLM starts processing."""
        logger.debug(f"LLM started with session {self.session_id}")
        if prompts and len(prompts) > 0:
            # Extract user message from prompt if possible
            for line in prompts[0].split("\n"):
                if "<user>" in line:
                    self.user_message = line
                    break
    
    def on_llm_end(
        self, response: Any, **kwargs: Any
    ) -> None:
        """Called when LLM ends processing."""
        if hasattr(response, "generations"):
            self.response = response.generations[0][0].text
        logger.debug(f"LLM ended with session {self.session_id}")
        # Log completion metrics
        if self.context_used:
            logger.info(f"Used PDF context for session {self.session_id}")
    
    def on_chain_start(
        self, serialized: Dict[str, Any], inputs: Dict[str, Any], **kwargs: Any
    ) -> None:
        """Called when a chain starts running."""
        self.metadata["chain_type"] = serialized.get("name", "unknown")
    
    def on_chain_error(
        self, error: Union[Exception, KeyboardInterrupt], **kwargs: Any
    ) -> None:
        """Called when chain errors."""
        logger.error(f"Chain error in session {self.session_id}: {str(error)}")

def get_callback_manager(session_id: str = "", context_used: bool = False) -> CallbackManager:
    """
    Get a callback manager with appropriate tracers and handlers.
    
    Appropriate tracers aur handlers ke sath callback manager return karta hai.
    
    Args:
        session_id: Unique session identifier
        context_used: Whether PDF context was used
        
    Returns:
        Configured callback manager
    """
    callbacks = []
    
    # Add custom monitoring handler
    callbacks.append(ChatMonitoringHandler(session_id=session_id, context_used=context_used))
    
    # Add LangChain tracer if tracing is enabled
    if ENABLE_TRACING:
        try:
            langchain_tracer = LangChainTracer(
                project_name=LANGCHAIN_PROJECT,
                client=Client(
                    api_key=LANGCHAIN_API_KEY,
                    api_url=LANGCHAIN_ENDPOINT,
                ),
            )
            callbacks.append(langchain_tracer)
        except Exception as e:
            logger.warning(f"Failed to initialize LangChain tracer: {str(e)}")
    
    return CallbackManager(callbacks)


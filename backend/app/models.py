"""
Pydantic models for API request/response validation.

Yeh file sabhi Pydantic models ko define karta hai jo API requests aur responses ko validate karne ke liye use hote hain.
Har model specific data structure ko represent karta hai, jaise message format, chat requests, aur PDF processing.
"""
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class Message(BaseModel):
    """
    A chat message model.
    
    Ek chat message ko represent karta hai jisme sender ka role aur message content hota hai.
    Har message system, user, ya assistant ke dwara bheja ja sakta hai.
    """
    role: str = Field(..., description="The role of the message sender (system, user, assistant)")  # Message bhejne wale ka role
    content: str = Field(..., description="The content of the message")  # Message ka actual content

class ChatRequest(BaseModel):
    """
    Request model for chat completions.
    
    Chat completion ke liye request model, jisme conversation history aur generation parameters shamil hain.
    Is model ka use /api/chat endpoint par hota hai.
    """
    messages: List[Message] = Field(..., description="The list of messages in the conversation")  # Conversation me saare messages ki list
    stream: bool = Field(True, description="Whether to stream the response")  # Response ko stream karna hai ya nahi
    model: str = Field("gemma:2b", description="The model to use for chat completion")  # Konsa model use karna hai
    max_tokens: Optional[int] = Field(None, description="Maximum number of tokens to generate")  # Maximum kitne tokens generate karne hain
    temperature: float = Field(0.7, description="Sampling temperature")  # Temperature setting, response ki randomness control karne ke liye

class StreamChunk(BaseModel):
    """
    A chunk of a streaming response.
    
    Streaming response ka ek chunk represent karta hai.
    Jab response stream kiya jata hai, tab ye chunks me aata hai aur incrementally frontend par display hota hai.
    """
    id: str = Field(..., description="The ID of the chat completion")  # Chat completion ka unique ID
    model: str = Field(..., description="The model used for chat completion")  # Jo model use kiya gaya
    delta: Message = Field(..., description="The partial message content")  # Message content ka ek part 
    finish_reason: Optional[str] = Field(None, description="The reason the generation finished")  # Generation finish hone ka reason

class ErrorResponse(BaseModel):
    """
    Standard error response model.
    
    Error responses ke liye standard model.
    Jab koi error aata hai, to is format me client ko response bheja jata hai.
    """
    error: str = Field(..., description="Error message")  # Main error message
    details: Optional[str] = Field(None, description="Additional error details")  # Error ke baare me additional details


class PDFSummary(BaseModel):
    """
    Summary information about a processed PDF.
    
    Process kiye gaye PDF file ke baare me summary information store karta hai.
    Frontend par PDF list dikhane ke liye use hota hai.
    """
    filename: str = Field(..., description="The filename of the PDF")  # PDF file ka naam
    size: int = Field(..., description="The size (in characters) of the extracted text")  # Extract kiye gaye text ka size (characters me)
    preview: str = Field(..., description="A preview of the PDF content")  # PDF content ka preview


class PDFList(BaseModel):
    """
    List of PDF summaries.
    
    Processed PDFs ki list ko represent karta hai.
    /api/pdfs endpoint ka response model hai.
    """
    pdfs: List[PDFSummary] = Field([], description="List of PDF summaries")  # PDFSummary objects ki list


class PDFUploadResponse(BaseModel):
    """
    Response for PDF upload.
    
    PDF upload ke response ko represent karta hai.
    Upload successful hui ya nahi, aur kya filename upload hui, ye information deta hai.
    """
    success: bool = Field(..., description="Whether the upload was successful")  # Upload successful hui ya nahi
    filename: str = Field(..., description="The filename of the uploaded PDF")  # Upload kiye gaye PDF ka filename
    message: str = Field(..., description="Status message about the upload")  # Upload ke baare me status message


class PDFChatRequest(ChatRequest):
    """
    Request model for chat completions with PDF context.
    
    ChatRequest ka extension hai jo PDF context ke sath chat karne ke liye additional fields provide karta hai.
    /api/chat-with-pdf endpoint ke liye request model hai.
    """
    use_pdf_context: bool = Field(True, description="Whether to include PDF context in the chat")  # PDF context include karna hai ya nahi
    pdf_filename: Optional[str] = Field(None, description="Specific PDF to use as context (None means use all)")  # Specific PDF filename jo context ke liye use hogi (None means use all)


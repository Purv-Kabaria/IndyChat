"""
FastAPI application for chat completion with PDF context support.

Yeh file IndyChat ke backend main module hai jisme sabhi API endpoints define kiye gaye hain.
Is application me chat completion aur PDF context support dono ki functionality hai.
PDF files ko process karke unke content ko chat context me use kiya jata hai.
LangSmith monitoring ka use karke application ki performance track ki jati hai.
"""
import logging
import os
import shutil
import uuid
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from .models import ChatRequest, PDFChatRequest, PDFUploadResponse, PDFList, PDFSummary, ErrorResponse
from .ollama_handler import OllamaHandler
from .pdf_handler import PDFHandler
from .monitoring import ENABLE_TRACING

# Configure logging - Logging ko configure karna taaki errors aur info messages ko track kar sake
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app - FastAPI app ko initialize karna with title
app = FastAPI(
    title="Chat API with PDF Context",
    description="Chat API with PDF context and Langchain monitoring"
)

# Configure CORS - Cross-Origin Resource Sharing ko enable karna frontend ke liye
# CORS ka configuration yahan kiya gaya hai taaki frontend se requests accept ho sake
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend URL
    allow_credentials=True,  # Credentials (jaise cookies) ko allow karna
    allow_methods=["*"],     # Sabhi HTTP methods (GET, POST, etc.) ko allow karna
    allow_headers=["*"],     # Sabhi headers ko allow karna
)

# Initialize handlers - PDF aur Ollama ke handlers ko initialize karna
# Ye handlers PDF processing aur chat generation ke liye use hote hain
pdf_handler = PDFHandler()  # PDF files ko handle karne ke liye
ollama_handler = OllamaHandler(pdf_handler=pdf_handler)  # Chat generation ke liye with PDF context

# Process any existing PDFs in the feed directory on startup
# Server startup ke time pe feed directory me mojud sabhi PDFs ko process karna
@app.on_event("startup")
async def startup_event():
    """
    Server start hone par automatically run hota hai.
    Feed directory me pehle se mojud PDFs ko load aur process karta hai.
    LangSmith monitoring ko initialize karta hai.
    """
    try:
        # Log LangSmith configuration status
        if ENABLE_TRACING:
            logger.info("LangSmith monitoring is enabled")
        else:
            logger.info("LangSmith monitoring is disabled (LANGCHAIN_API_KEY not set)")
            
        # Sabhi PDFs ko process karne ki koshish karo
        processed = await pdf_handler.process_all_pdfs()
        if processed:
            # Agar kuch PDFs process hui hain, to unki list log karo
            logger.info(f"Processed existing PDFs: {', '.join(processed)}")
    except Exception as e:
        # Koi error aane par use log karo
        logger.error(f"Error processing existing PDFs: {str(e)}")

@app.post("/api/chat")
async def chat_completion(request: ChatRequest):
    """
    Standard chat completion endpoint that streams responses.
    
    Yeh endpoint normal chat completion ke liye hai, bina PDF context ke.
    Request me messages, temperature, aur max_tokens parameters hote hain.
    Response stream format me return hota hai (SSE - Server-Sent Events).
    Har request ke liye trace ID generate karta hai monitoring ke liye.
    """
    # Generate trace ID for monitoring
    trace_id = str(uuid.uuid4())
    
    try:
        # Log the request with trace ID
        if ENABLE_TRACING:
            logger.info(f"Chat request started with trace ID: {trace_id}")
        
        # Ollama handler se chat response generate karo aur use stream karo
        # List comprehension ka use karke messages ko format kiya ja raha hai
        return EventSourceResponse(
            ollama_handler.generate_chat_response(
                messages=[{"role": msg.role, "content": msg.content} for msg in request.messages],
                temperature=request.temperature,  # Temperature controls randomness of response
                max_tokens=request.max_tokens,    # Maximum tokens to generate
            ),
            media_type="text/event-stream",  # Server-Sent Events ka format
            headers={"X-Trace-ID": trace_id} if ENABLE_TRACING else {}  # Include trace ID in response headers
        )
    except Exception as e:
        # Koi bhi error aane par use log karo aur client ko 500 error return karo
        error_msg = f"Error in chat completion: {str(e)}"
        logger.error(f"{error_msg} (trace_id: {trace_id})")
        
        # Include trace ID in error response if monitoring is enabled
        detail = {"error": str(e)}
        if ENABLE_TRACING:
            detail["trace_id"] = trace_id
            
        raise HTTPException(status_code=500, detail=detail)


@app.post("/api/chat-with-pdf")
async def chat_with_pdf(request: PDFChatRequest):
    """
    Enhanced chat completion endpoint that includes PDF context.
    
    Yeh endpoint PDF context ke sath chat completion provide karta hai.
    PDF ke content ko model ke context me add karke responses generate karta hai.
    Is tarah se model PDF ke baare me sawal ka jawab de sakta hai.
    Har request ke liye trace ID generate karta hai monitoring ke liye.
    """
    # Generate trace ID for monitoring
    trace_id = str(uuid.uuid4())
    
    try:
        # Log the request with trace ID and PDF details
        if ENABLE_TRACING:
            pdf_info = f"with PDF: {request.pdf_filename}" if request.pdf_filename else "with all PDFs" if request.use_pdf_context else "without PDF context"
            logger.info(f"PDF chat request started {pdf_info} (trace ID: {trace_id})")
        
        # PDF context ke sath chat response generate karo
        return EventSourceResponse(
            ollama_handler.generate_chat_response(
                messages=[{"role": msg.role, "content": msg.content} for msg in request.messages],
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                use_pdf_context=request.use_pdf_context,  # PDF context use karna hai ya nahi
                pdf_filename=request.pdf_filename         # Konsi specific PDF use karni hai (if any)
            ),
            media_type="text/event-stream",
            headers={"X-Trace-ID": trace_id} if ENABLE_TRACING else {}  # Include trace ID in response headers
        )
    except Exception as e:
        # Error handling - log and return 500 error with trace ID
        error_msg = f"Error in PDF-enhanced chat completion: {str(e)}"
        logger.error(f"{error_msg} (trace_id: {trace_id})")
        
        # Include trace ID in error response if monitoring is enabled
        detail = {"error": str(e)}
        if ENABLE_TRACING:
            detail["trace_id"] = trace_id
            
        raise HTTPException(status_code=500, detail=detail)

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy"}


@app.post("/api/upload-pdf", response_model=PDFUploadResponse)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Upload a PDF file to the feed directory.
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            return PDFUploadResponse(
                success=False,
                filename=file.filename,
                message="Only PDF files are supported"
            )
        
        # Read uploaded file
        contents = await file.read()
        
        # Save and process PDF
        success = await pdf_handler.save_uploaded_pdf(file.filename, contents)
        
        if success:
            return PDFUploadResponse(
                success=True,
                filename=file.filename,
                message="PDF uploaded and processed successfully"
            )
        else:
            return PDFUploadResponse(
                success=False,
                filename=file.filename,
                message="Failed to process the PDF after upload"
            )
            
    except Exception as e:
        logger.error(f"Error uploading PDF: {str(e)}")
        return PDFUploadResponse(
            success=False,
            filename=file.filename if file else "unknown",
            message=f"Error: {str(e)}"
        )


@app.get("/api/pdfs", response_model=PDFList)
async def list_pdfs():
    """
    Get a list of all processed PDFs.
    """
    try:
        # Process any new PDFs first
        await pdf_handler.process_all_pdfs()
        
        # Return the summaries
        summaries = pdf_handler.get_pdf_summaries()
        return PDFList(pdfs=summaries)
        
    except Exception as e:
        logger.error(f"Error listing PDFs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


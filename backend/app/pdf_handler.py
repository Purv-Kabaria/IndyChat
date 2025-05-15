"""
PDF processing and storage for chat enhancement.

PDF files ko process karne aur store karne ke liye module.
Yeh module PDFs se text extract karta hai aur chat context enhancement ke liye use karta hai.
Feed directory se PDFs ko read karke unka content extract karta hai taaki chat responses me PDF information include ho sake.
"""
import os
import logging
import asyncio
from typing import Dict, List, Optional, Set
from pathlib import Path
import PyPDF2

# Configuration - PDF feed directory ka path set karna
FEED_DIR = Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "feed")))

# Configure logging - Logging setup karna taki errors aur information track ho sake
logger = logging.getLogger(__name__)

class PDFHandler:
    """
    Handler for processing and managing PDF documents.
    
    PDF documents ko process aur manage karne ke liye main handler class.
    PDFs se text extract karna, content ko cache mein store karna, aur chat context ke liye text provide karna.
    Ye class feed directory se PDFs ko read karke unka content extract karti hai.
    """
    
    def __init__(self):
        """
        Initialize the PDF handler.
        
        PDF handler ko initialize karta hai, cache setup karta hai, aur feed directory create karta hai.
        """
        self.pdf_cache: Dict[str, str] = {}  # Filename -> extracted text (filename se extracted text ka mapping)
        self.processed_files: Set[str] = set()  # Keep track of processed files (processed files ka record rakhna)
        logger.info(f"Initializing PDF handler with feed directory: {FEED_DIR}")
        
        # Ensure feed directory exists - Feed directory create karna agar exist nahi karta hai to
        os.makedirs(FEED_DIR, exist_ok=True)
    
    async def process_all_pdfs(self) -> List[str]:
        """
        Process all PDFs in the feed directory.
        
        Returns:
            List of processed PDF filenames
            
        Feed directory mein mojood sabhi PDF files ko process karta hai.
        Sirf unprocessed files ko process karta hai jo pehle process nahi hui hain.
        Successfully processed files ki list return karta hai.
        """
        # Feed directory se sare PDF files ko filter karna
        pdf_files = [f for f in os.listdir(FEED_DIR) if f.lower().endswith('.pdf')]
        processed = []
        
        # Har PDF file ko process karna jo pehle process nahi hui hai
        for pdf_file in pdf_files:
            if pdf_file not in self.processed_files:
                success = await self.process_pdf(pdf_file)
                if success:
                    # Successful processing ke baad list mein add karna
                    processed.append(pdf_file)
                    self.processed_files.add(pdf_file)
        
        return processed
    
    async def process_pdf(self, filename: str) -> bool:
        """
        Process a single PDF file and extract its text.
        
        Args:
            filename: Name of the PDF file in the feed directory
            
        Returns:
            True if processing was successful, False otherwise
            
        Single PDF file ko process karta hai aur uska text extract karta hai.
        Processing non-blocking way mein hoti hai thread pool ke through.
        Success ya failure status return karta hai.
        """
        file_path = FEED_DIR / filename
        
        try:
            # Run the actual PDF processing in a thread pool to avoid blocking
            # PDF processing ko thread pool mein run karna taaki main thread block na ho
            loop = asyncio.get_event_loop()
            text = await loop.run_in_executor(None, self._extract_text_from_pdf, file_path)
            
            if text:
                # Extracted text ko cache mein store karna
                self.pdf_cache[filename] = text
                logger.info(f"Successfully processed PDF: {filename}")
                return True
            else:
                # Agar koi text extract nahi hua to warning log karna
                logger.warning(f"No text extracted from PDF: {filename}")
                return False
                
        except Exception as e:
            # Error handling - koi bhi exception catch karke log karna
            logger.error(f"Error processing PDF {filename}: {str(e)}")
            return False
    
    def _extract_text_from_pdf(self, pdf_path: Path) -> str:
        """
        Extract text from a PDF file.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Extracted text content
            
        PDF file se text extract karta hai using PyPDF2 library.
        Har page ko process karke combined text return karta hai with page markers.
        """
        text = ""
        
        try:
            # PDF file ko binary mode mein open karna
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                num_pages = len(reader.pages)
                
                # Har page se text extract karna
                for page_num in range(num_pages):
                    page = reader.pages[page_num]
                    page_text = page.extract_text()
                    if page_text:
                        # Page number ke sath text add karna for better organization
                        text += f"\n--- Page {page_num + 1} ---\n{page_text}"
            
            # Extra whitespace hatana
            return text.strip()
            
        except Exception as e:
            # Error handling - koi bhi exception catch karke log karna
            logger.error(f"Error extracting text from {pdf_path.name}: {str(e)}")
            return ""
    
    def get_pdf_content(self, filename: Optional[str] = None) -> str:
        """
        Get the content of a specific PDF or all PDFs.
        
        Args:
            filename: Optional specific PDF filename
            
        Returns:
            Text content from the PDF(s)
            
        Specific PDF ya sabhi PDFs ka content retrieve karta hai.
        Agar filename specified hai, to sirf us PDF ka content return karta hai.
        Agar filename specified nahi hai, to sabhi PDFs ka combined content return karta hai.
        """
        # Agar specific filename hai to sirf us file ka content return karna
        if filename:
            return self.pdf_cache.get(filename, "")
        
        # Combine all PDF contents with clear separation
        # Sabhi PDFs ke content ko combine karna with document markers
        all_content = ""
        for name, content in self.pdf_cache.items():
            all_content += f"\n\n=== Document: {name} ===\n{content}"
        
        return all_content.strip()
    
    def get_pdf_summaries(self) -> List[Dict[str, str]]:
        """
        Get summaries of all processed PDFs.
        
        Returns:
            List of dictionaries with PDF information
            
        Sabhi processed PDFs ka summary information provide karta hai.
        Har PDF ke liye filename, size aur content ka preview return karta hai.
        Frontend par PDF list dikhane ke liye use hota hai.
        """
        summaries = []
        
        # Har processed PDF ke liye summary information create karna
        for filename, content in self.pdf_cache.items():
            # Create a brief summary (first 200 chars) - Preview ke liye first 200 characters
            preview = content[:200] + "..." if len(content) > 200 else content
            summaries.append({
                "filename": filename,                 # PDF file ka name
                "size": len(content),                 # Content ka size (characters)
                "preview": preview                    # Content ka preview
            })
        
        return summaries
    
    async def save_uploaded_pdf(self, filename: str, file_content: bytes) -> bool:
        """
        Save an uploaded PDF to the feed directory.
        
        Args:
            filename: Name to save the file as
            file_content: Binary content of the PDF
            
        Returns:
            True if saving was successful, False otherwise
            
        Upload ki gayi PDF file ko feed directory mein save karta hai aur process karta hai.
        File ka binary content disk par write karta hai aur phir usko process karta hai.
        Success ya failure status return karta hai.
        """
        try:
            # Feed directory mein file path create karna
            file_path = FEED_DIR / filename
            
            # PDF file ko binary mode mein write karna
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            logger.info(f"Saved PDF file to {file_path}")
            
            # Saved PDF ko process karna
            success = await self.process_pdf(filename)
            
            # Process hone ke baad status return karna
            return success
            
        except Exception as e:
            # Error handling - koi bhi exception catch karke log karna
            logger.error(f"Error saving uploaded PDF {filename}: {str(e)}")
            return False


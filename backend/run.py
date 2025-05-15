"""
Yeh script FastAPI server ko run karne ke liye hai.

Is file ka main purpose FastAPI application ko launch karna hai aur server 
configuration set karna hai. Yeh humara entry point hai jahan se server start hota hai.
"""
import uvicorn

# ASGI server (uvicorn) ko import kiya hai taaki hum FastAPI app ko run kar sake

if __name__ == "__main__":
    # Agar yeh file directly run ho rahi hai (na ki import hui hai), tab server start karo
    uvicorn.run(
        "app.main:app",  # Humari main application ka path, jahan 'app' variable define hai
        host="0.0.0.0",  # Sabhi network interfaces par listen karne ke liye 0.0.0.0 set kiya hai
        port=8000,       # Server 8000 port par chalega 
        reload=False,    # Disable auto-reload
        log_level="info" # Log level ko 'info' par set kiya hai taaki important messages log ho sake
    )


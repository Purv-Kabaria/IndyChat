
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <nav className="py-4 px-8 bg-white w-full border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-[#243b5f] flex items-center gap-2">
          <img src="/indianapolis.png" alt="IndyChat Logo" className="h-[50px] w-[50px]" />
          <span>IndyChat</span>
        </Link>
        
        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-10">
          <a href="#home" className="text-[#333] font-medium hover:text-primary">Home</a>
          <a href="#features" className="text-[#333] font-medium hover:text-primary">Features</a>
          <a href="#how-it-works" className="text-[#333] font-medium hover:text-primary">How It Works</a>
          <a href="#testimonials" className="text-[#333] font-medium hover:text-primary">Testimonials</a>
          <Link to="/about" className="text-[#333] font-medium hover:text-primary">About Us</Link>
          <Link to="/contact" className="text-[#333] font-medium hover:text-primary">Contact</Link>
        </div>
        
        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center space-x-4">
          <Link 
            to="/login" 
            className="px-8 py-3 border border-[#243b5f] rounded-md text-[#243b5f] hover:bg-gray-50"
          >
            Login
          </Link>
          <Link 
            to="/signup" 
            className="px-8 py-3 bg-[#243b5f] text-white rounded-md hover:bg-[#1a2c42]"
          >
            Sign Up
          </Link>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden text-[#243b5f] text-2xl"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>
      
      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="pt-4 px-8 flex justify-between items-center border-b border-gray-100 pb-4">
            <Link to="/" className="text-2xl font-bold text-[#243b5f] flex items-center gap-2">
              <img src="/indianapolis.png" alt="IndyChat Logo" className="h-[50px] w-[50px]" />
              <span>IndyChat</span>
            </Link>
            <button 
              className="text-[#243b5f] text-2xl"
              onClick={toggleMenu}
            >
              <X size={28} />
            </button>
          </div>
          
          <div className="px-8 py-6 flex flex-col space-y-8">
            <a href="#home" className="text-[#333] text-xl font-medium" onClick={() => setIsMenuOpen(false)}>Home</a>
            <a href="#features" className="text-[#333] text-xl font-medium" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-[#333] text-xl font-medium" onClick={() => setIsMenuOpen(false)}>How It Works</a>
            <a href="#testimonials" className="text-[#333] text-xl font-medium" onClick={() => setIsMenuOpen(false)}>Testimonials</a>
            <Link to="/about" className="text-[#333] text-xl font-medium" onClick={() => setIsMenuOpen(false)}>About Us</Link>
            <Link to="/contact" className="text-[#333] text-xl font-medium" onClick={() => setIsMenuOpen(false)}>Contact</Link>
            
            <div className="mt-6 space-y-4 pt-6 border-t border-gray-100">
              <Link 
                to="/login" 
                className="block w-full py-3 px-4 border border-[#243b5f] rounded-md text-[#243b5f] text-center font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="block w-full py-3 px-4 bg-[#243b5f] text-white rounded-md text-center font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

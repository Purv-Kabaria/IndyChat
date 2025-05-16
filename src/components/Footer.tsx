
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-20 px-8 pt-20 pb-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div className="mb-8">
          <h3 className="text-xl mb-6 text-accent relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-highlight">
            IndyChat
          </h3>
          <div>
            <p className="text-[#bbb] mb-6 leading-7">
              Your 24/7 digital assistant for navigating life in Indianapolis. We're here to help you discover and connect with your city.
            </p>
            <div className="flex gap-4 mt-6">
              <a href="#" aria-label="Facebook" className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-full text-white transition-all duration-300 hover:bg-highlight hover:translate-y-[-3px]">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" aria-label="Twitter" className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-full text-white transition-all duration-300 hover:bg-highlight hover:translate-y-[-3px]">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" aria-label="Instagram" className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-full text-white transition-all duration-300 hover:bg-highlight hover:translate-y-[-3px]">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" aria-label="LinkedIn" className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-full text-white transition-all duration-300 hover:bg-highlight hover:translate-y-[-3px]">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xl mb-6 text-accent relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-highlight">
            Quick Links
          </h3>
          <ul className="list-none">
            <li className="mb-3">
              <a href="#home" className="text-[#ddd] no-underline transition-all duration-300 inline-block hover:text-accent hover:translate-x-[5px]">
                Home
              </a>
            </li>
            <li className="mb-3">
              <a href="#features" className="text-[#ddd] no-underline transition-all duration-300 inline-block hover:text-accent hover:translate-x-[5px]">
                Features
              </a>
            </li>
            <li className="mb-3">
              <a href="#how-it-works" className="text-[#ddd] no-underline transition-all duration-300 inline-block hover:text-accent hover:translate-x-[5px]">
                How It Works
              </a>
            </li>
            <li className="mb-3">
              <a href="#testimonials" className="text-[#ddd] no-underline transition-all duration-300 inline-block hover:text-accent hover:translate-x-[5px]">
                Testimonials
              </a>
            </li>
            <li className="mb-3">
              <Link to="/about" className="text-[#ddd] no-underline transition-all duration-300 inline-block hover:text-accent hover:translate-x-[5px]">
                About Us
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/contact" className="text-[#ddd] no-underline transition-all duration-300 inline-block hover:text-accent hover:translate-x-[5px]">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xl mb-6 text-accent relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-highlight">
            Resources
          </h3>
          <ul className="list-none">
            <li className="mb-3">
              <Link to="/faq" className="text-[#ddd] no-underline transition-all duration-300 inline-block hover:text-accent hover:translate-x-[5px]">
                FAQ
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/privacy" className="text-[#ddd] no-underline transition-all duration-300 inline-block hover:text-accent hover:translate-x-[5px]">
                Privacy Policy
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/terms" className="text-[#ddd] no-underline transition-all duration-300 inline-block hover:text-accent hover:translate-x-[5px]">
                Terms of Service
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/accessibility" className="text-[#ddd] no-underline transition-all duration-300 inline-block hover:text-accent hover:translate-x-[5px]">
                Accessibility
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/support" className="text-[#ddd] no-underline transition-all duration-300 inline-block hover:text-accent hover:translate-x-[5px]">
                Support
              </Link>
            </li>
            <li className="mb-3">
              <Link to="/blog" className="text-[#ddd] no-underline transition-all duration-300 inline-block hover:text-accent hover:translate-x-[5px]">
                Blog
              </Link>
            </li>
          </ul>
        </div>
        
        <div className="mb-8">
          <h3 className="text-xl mb-6 text-accent relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-highlight">
            Newsletter
          </h3>
          <p className="mb-6">Subscribe to get updates on new features and local Indianapolis tips</p>
          <form className="flex flex-col gap-4">
            <input 
              type="email" 
              className="py-3.5 px-4 rounded-lg border-none bg-white/10 text-white outline-none font-['Poppins',_sans-serif] placeholder:text-[#ccc]" 
              placeholder="Your email address" 
              required 
            />
            <button 
              type="submit" 
              className="py-3.5 px-4 rounded-lg bg-highlight text-white border-none cursor-pointer font-semibold transition-all duration-300 font-['Poppins',_sans-serif] hover:bg-[#e69100]"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <div className="text-center pt-12 mt-12 border-t border-white/10 text-[#aaa] text-sm">
        <p>&copy; 2023 IndyChat. All rights reserved. Proudly serving the Indianapolis community.</p>
      </div>
    </footer>
  );
};

export default Footer;

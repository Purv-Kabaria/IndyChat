"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

const AnimatedLink = ({ href, children, external = false, isScrollLink = false }: { 
  href: string; 
  children: React.ReactNode; 
  external?: boolean;
  isScrollLink?: boolean;
}) => {
  const Component = external ? 'a' : Link;
  
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isScrollLink) return;
    
    e.preventDefault();
    const targetId = href.substring(1); // Remove the # from the href
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <motion.li className="mb-3">
      <Component 
        href={href} 
        className="text-[#ddd] no-underline inline-block hover:text-accent"
        onClick={isScrollLink ? handleSmoothScroll : undefined}
      >
        <motion.span
          className="inline-block"
          whileHover={{ x: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {children}
        </motion.span>
      </Component>
    </motion.li>
  );
};

const SocialIcon = ({ href, ariaLabel }: { href: string; ariaLabel: string }) => {
  return (
    <motion.a
      href={href}
      aria-label={ariaLabel}
      className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-full text-white"
      whileHover={{ 
        backgroundColor: "#ff5e15", 
        y: -3,
        scale: 1.1
      }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <i className={`fab fa-${ariaLabel.toLowerCase()}`}></i>
    </motion.a>
  );
};

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-20 px-8 pt-20 pb-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl mb-6 text-accent relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-highlight">
            IndyChat
          </h3>
          <div>
            <p className="text-[#bbb] mb-6 leading-7">
              Your 24/7 digital assistant for navigating life in Indianapolis. We&apos;re here to help you discover and connect with your city.
            </p>
            <motion.div 
              className="flex gap-4 mt-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <SocialIcon href="#" ariaLabel="Facebook" />
              <SocialIcon href="#" ariaLabel="Twitter" />
              <SocialIcon href="#" ariaLabel="Instagram" />
              <SocialIcon href="#" ariaLabel="LinkedIn" />
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl mb-6 text-accent relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-highlight">
            Quick Links
          </h3>
          <ul className="list-none">
            <AnimatedLink href="#home" external isScrollLink>Home</AnimatedLink>
            <AnimatedLink href="#features" external isScrollLink>Features</AnimatedLink>
            <AnimatedLink href="#how-it-works" external isScrollLink>How It Works</AnimatedLink>
            <AnimatedLink href="#testimonials" external isScrollLink>Testimonials</AnimatedLink>
            <AnimatedLink href="/about">About Us</AnimatedLink>
            <AnimatedLink href="/contact">Contact</AnimatedLink>
          </ul>
        </motion.div>
        
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl mb-6 text-accent relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-highlight">
            Resources
          </h3>
          <ul className="list-none">
            <AnimatedLink href="/faq">FAQ</AnimatedLink>
            <AnimatedLink href="/privacy">Privacy Policy</AnimatedLink>
            <AnimatedLink href="/terms">Terms of Service</AnimatedLink>
            <AnimatedLink href="/accessibility">Accessibility</AnimatedLink>
            <AnimatedLink href="/support">Support</AnimatedLink>
            <AnimatedLink href="/blog">Blog</AnimatedLink>
          </ul>
        </motion.div>
        
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <h3 className="text-xl mb-6 text-accent relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-highlight">
            Newsletter
          </h3>
          <p className="mb-6">Subscribe to get updates on new features and local Indianapolis tips</p>
          <motion.form 
            className="flex flex-col gap-4"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.input 
              type="email" 
              className="py-3.5 px-4 rounded-lg border-none bg-white/10 text-white outline-none font-['Poppins',_sans-serif] placeholder:text-[#ccc]" 
              placeholder="Your email address"
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              required 
            />
            <motion.button 
              type="submit" 
              className="py-3.5 px-4 rounded-lg bg-highlight text-white border-none cursor-pointer font-semibold transition-all duration-300 font-['Poppins',_sans-serif] hover:bg-[#e69100]"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              Subscribe
            </motion.button>
          </motion.form>
        </motion.div>
      </div>
      <motion.div 
        className="text-center pt-12 mt-12 border-t border-white/10 text-[#aaa] text-sm"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        viewport={{ once: true }}
      >
        <p>&copy; 2023 IndyChat. All rights reserved. Proudly serving the Indianapolis community&apos;s needs.</p>
      </motion.div>
    </footer>
  );
};

export default Footer;

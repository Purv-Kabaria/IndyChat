"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const AnimatedLink = ({
  href,
  children,
  external = false,
  isScrollLink = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  isScrollLink?: boolean;
}) => {
  const Component = external ? "a" : Link;

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isScrollLink) return;

    e.preventDefault();
    const targetId = href.substring(1); // Remove the # from the href
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop,
        behavior: "smooth",
      });
    }
  };

  return (
    <motion.li className="mb-3">
      <Component
        href={href}
        className="text-[#ddd] no-underline inline-block hover:text-white/50"
        onClick={isScrollLink ? handleSmoothScroll : undefined}>
        <motion.span
          className="inline-block"
          whileHover={{ x: 5 }}
          transition={{ type: "spring", stiffness: 400 }}>
          {children}
        </motion.span>
      </Component>
    </motion.li>
  );
};

const SocialIcon = ({
  href,
  ariaLabel,
}: {
  href: string;
  ariaLabel: string;
}) => {
  // SVG paths for different social media icons
  const getIconPath = (social: string) => {
    switch (social.toLowerCase()) {
      case "facebook":
        return (
          <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
        );
      case "twitter":
        return (
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        );
      case "instagram":
        return (
          <>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </>
        );
      case "linkedin":
        return (
          <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
        );
      default:
        return (
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        );
    }
  };

  return (
    <motion.a
      href={href}
      aria-label={ariaLabel}
      className="flex items-center justify-center w-10 h-10 bg-white/30 rounded-full text-white hover:text-white"
      whileHover={{
        backgroundColor: "#ff5e15",
        y: -3,
        scale: 1.1,
      }}
      transition={{ type: "spring", stiffness: 400 }}>
      <svg
        className="w-5 h-5 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg">
        {getIconPath(ariaLabel)}
      </svg>
    </motion.a>
  );
};

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-20 px-8 pt-20 pb-8">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}>
          <h3 className="text-xl mb-6 text-white relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-highlight">
            IndyChat
          </h3>
          <div>
            <p className="text-[#bbb] mb-6 leading-7">
              Your 24/7 digital assistant for navigating life in Indianapolis.
              We&apos;re here to help you discover and connect with your city.
            </p>
            <motion.div
              className="flex gap-4 mt-6"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}>
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
          viewport={{ once: true }}>
          <h3 className="text-xl mb-6 text-white relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-highlight">
            Quick Links
          </h3>
          <ul className="list-none">
            <AnimatedLink href="#home" isScrollLink>
              Home
            </AnimatedLink>
            <AnimatedLink href="/chat">Chat</AnimatedLink>
            <AnimatedLink href="/news">News</AnimatedLink>
            <AnimatedLink href="/about">About Us</AnimatedLink>
            <AnimatedLink href="/contact">Contact</AnimatedLink>
          </ul>
        </motion.div>

        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}>
          <h3 className="text-xl mb-6 text-white relative pb-2 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-10 after:h-0.5 after:bg-highlight">
            Newsletter
          </h3>
          <p className="mb-6">
            Subscribe to get updates on new features and local Indianapolis tips
          </p>
          <motion.form
            className="flex flex-col gap-4"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}>
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
              transition={{ type: "spring", stiffness: 400 }}>
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
        viewport={{ once: true }}>
        <p>
          &copy; 2025 IndyChat. All rights reserved. Proudly serving the
          Indianapolis community&apos;s needs.
        </p>
      </motion.div>
    </footer>
  );
};

export default Footer;

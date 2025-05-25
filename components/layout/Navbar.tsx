"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAdminCheck } from "@/hooks/useAdminCheck";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { isAdminUser, loading: isAdminLoading, error: adminError } = useAdminCheck();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdminLoading) {
      setIsAdmin(isAdminUser);
      if (adminError) {
        console.error("Error checking admin status in Navbar:", adminError);
      }
    }
  }, [isAdminUser, isAdminLoading, adminError]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: string
  ) => {
    e.preventDefault();
    setIsMenuOpen(false);

    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop,
        behavior: "smooth",
      });
    }
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
  };

  const menuItemVariants = {
    closed: { opacity: 0, y: 20 },
    open: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
      },
    }),
  };

  const linkHoverTapProps = {
    whileHover: { y: -2, color: "#5E60EA" },
    whileTap: { scale: 0.95 },
  };

  const buttonHoverTapProps = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  };

  const authButtonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
  };

  return (
    <nav className="py-4 px-8 bg-white w-full border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold text-[#243b5f] flex items-center gap-2">
          <Image
            src="/images/indianapolis.png"
            alt="IndyChat Logo"
            width={50}
            height={50}
            className="object-contain"
          />
          <span>IndyChat</span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-10">
          <motion.div {...linkHoverTapProps}>
            <Link
              href="/"
              className="text-[#333] font-medium hover:text-secondary"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleSmoothScroll(e, "home")}>
              Home
            </Link>
          </motion.div>
          <motion.div {...linkHoverTapProps}>
            <Link
              href="/chat"
              className="text-[#333] font-medium hover:text-secondary">
              Chat
            </Link>
          </motion.div>
          <motion.div {...linkHoverTapProps}>
            <Link
              href="/news"
              className="text-[#333] font-medium hover:text-secondary">
              News
            </Link>
          </motion.div>
          {isLoggedIn && isAdmin && (
            <motion.div {...linkHoverTapProps}>
              <Link
                href="/admin/users"
                className="text-[#333] font-medium hover:text-secondary">
                Admin
              </Link>
            </motion.div>
          )}
          <motion.div {...linkHoverTapProps}>
            <Link
              href="/about"
              className="text-[#333] font-medium hover:text-secondary">
              About Us
            </Link>
          </motion.div>
          <motion.div {...linkHoverTapProps}>
            <Link
              href="/contact"
              className="text-[#333] font-medium hover:text-secondary">
              Contact
            </Link>
          </motion.div>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center space-x-4">
          <AnimatePresence mode="wait">
            {isLoggedIn ? (
              <motion.div
                key="loggedInButtons"
                className="flex items-center space-x-4"
                variants={authButtonVariants}
                initial="hidden"
                animate="visible"
                exit="exit">
                <motion.div {...buttonHoverTapProps}>
                  <Link
                    href="/profile"
                    className="px-8 py-3 border border-accent rounded-md text-accent hover:bg-accent/10">
                    Profile
                  </Link>
                </motion.div>
                <motion.button
                  onClick={handleSignOut}
                  className="px-8 py-3 bg-accent text-white rounded-md hover:bg-accent/80"
                  {...buttonHoverTapProps}>
                  Sign Out
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="loggedOutButtons"
                className="flex items-center space-x-4"
                variants={authButtonVariants}
                initial="hidden"
                animate="visible"
                exit="exit">
                <motion.div {...buttonHoverTapProps}>
                  <Link
                    href="/login"
                    className="px-8 py-3 border border-accent rounded-md text-accent hover:bg-accent/10">
                    Login
                  </Link>
                </motion.div>
                <motion.div {...buttonHoverTapProps}>
                  <Link
                    href="/signup"
                    className="px-8 py-3 bg-accent text-white rounded-md hover:bg-accent/80">
                    Sign Up
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          className="lg:hidden text-accent text-2xl"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          title="Toggle Menu"
          whileTap={{ scale: 0.9 }}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </motion.button>
      </div>

      {/* Mobile Menu Drawer with AnimatePresence */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-white overflow-hidden"
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}>
            <div className="pt-4 px-8 flex justify-between items-center border-b border-gray-100 pb-4">
              <Link
                href="/"
                className="text-2xl font-bold text-[#243b5f] flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}>
                <Image
                  src="/images/indianapolis.png"
                  alt="IndyChat Logo"
                  width={50}
                  height={50}
                  className="object-contain"
                />
                <span>IndyChat</span>
              </Link>
              <motion.button
                className="text-[#243b5f] text-2xl"
                onClick={toggleMenu}
                title="Close Menu"
                whileTap={{ scale: 0.9 }}>
                <X size={28} />
              </motion.button>
            </div>

            <div className="px-8 py-6 flex flex-col space-y-8">
              <motion.a
                href="#home"
                className="text-[#333] text-xl font-medium"
                onClick={(e) => handleSmoothScroll(e, "home")}
                custom={0}
                variants={menuItemVariants}
                {...linkHoverTapProps}>
                Home
              </motion.a>
              <motion.div custom={1} variants={menuItemVariants} {...linkHoverTapProps}>
                <Link
                  href="/chat"
                  className="text-[#333] text-xl font-medium"
                  onClick={() => setIsMenuOpen(false)}>
                  Chat
                </Link>
              </motion.div>
              <motion.div custom={2} variants={menuItemVariants} {...linkHoverTapProps}>
                <Link
                  href="/news"
                  className="text-[#333] text-xl font-medium"
                  onClick={() => setIsMenuOpen(false)}>
                  News
                </Link>
              </motion.div>
              {isLoggedIn && isAdmin && (
                <motion.div custom={3} variants={menuItemVariants} {...linkHoverTapProps}>
                  <Link
                    href="/admin"
                    className="text-[#333] text-xl font-medium"
                    onClick={() => setIsMenuOpen(false)}>
                    Admin
                  </Link>
                </motion.div>
              )}
              <motion.div custom={isLoggedIn && isAdmin ? 4 : 3} variants={menuItemVariants} {...linkHoverTapProps}>
                <Link
                  href="/about"
                  className="text-[#333] text-xl font-medium"
                  onClick={() => setIsMenuOpen(false)}>
                  About Us
                </Link>
              </motion.div>
              <motion.div custom={isLoggedIn && isAdmin ? 5 : 4} variants={menuItemVariants} {...linkHoverTapProps}>
                <Link
                  href="/contact"
                  className="text-[#333] text-xl font-medium"
                  onClick={() => setIsMenuOpen(false)}>
                  Contact
                </Link>
              </motion.div>

              <motion.div
                className="mt-6 space-y-4 pt-6 border-t border-gray-100"
                custom={isLoggedIn && isAdmin ? 6 : 5}
                variants={menuItemVariants}>
                <AnimatePresence mode="wait">
                  {isLoggedIn ? (
                    <motion.div
                      key="mobileLoggedInButtons"
                      className="flex flex-col space-y-4"
                      variants={authButtonVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit">
                      <motion.div {...buttonHoverTapProps}>
                        <Link
                          href="/profile"
                          className="block w-full py-3 px-4 border border-[#243b5f] rounded-md text-[#243b5f] text-center font-medium"
                          onClick={() => setIsMenuOpen(false)}>
                          Profile
                        </Link>
                      </motion.div>
                      <motion.button
                        onClick={() => {
                          handleSignOut();
                        }}
                        className="block w-full py-3 px-4 bg-[#243b5f] text-white rounded-md text-center font-medium"
                        {...buttonHoverTapProps}>
                        Sign Out
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="mobileLoggedOutButtons"
                      className="flex flex-col space-y-4"
                      variants={authButtonVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit">
                      <motion.div {...buttonHoverTapProps}>
                        <Link
                          href="/login"
                          className="block w-full py-3 px-4 border border-[#243b5f] rounded-md text-[#243b5f] text-center font-medium"
                          onClick={() => setIsMenuOpen(false)}>
                          Login
                        </Link>
                      </motion.div>
                      <motion.div {...buttonHoverTapProps}>
                        <Link
                          href="/signup"
                          className="block w-full py-3 px-4 bg-[#243b5f] text-white rounded-md text-center font-medium"
                          onClick={() => setIsMenuOpen(false)}>
                          Sign Up
                        </Link>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

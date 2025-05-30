"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const Hero = () => {
  return (
    <div
      className="w-full py-40 lg:py-60 px-8 flex flex-col items-center justify-center text-center text-white relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      id="home">
      <div className="absolute inset-0 bg-black opacity-50 z-0"></div>

      <div className="max-w-[900px] mx-auto relative z-10">
        <motion.h1
          className="text-3xl lg:text-5xl font-bold mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}>
          Your Personal Indianapolis Guide
        </motion.h1>
        <motion.p
          className="text-xl mb-10 text-white opacity-90"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}>
          Get instant answers about everything Indianapolis - from events and
          dining to city services and neighborhood insights
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}>
          <Link
            href="/chat"
            className="inline-flex items-center justify-center py-4 px-8 text-lg font-medium bg-[#ed1c24] hover:bg-[#d01920] text-white rounded-md transition-all duration-300 hover:shadow-2xl transform hover:scale-105">
            <motion.span
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}>
              Start Chatting Now →
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;

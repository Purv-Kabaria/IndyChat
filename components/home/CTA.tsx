"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

const CTA = () => {
  return (
    <div className="py-24 px-8 bg-[#14284b] text-white text-center">
      <div className="max-w-[800px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.1 }}
        >
          <motion.h2 
            className="text-4xl mb-6"
            initial={{ scale: 0.95 }}
            whileInView={{ scale: 1 }}
            transition={{ 
              duration: 0.5, 
              ease: "easeOut",
              delay: 0.2
            }}
            viewport={{ once: true }}
          >
            Ready to Explore Indianapolis?
          </motion.h2>
          <motion.p 
            className="text-lg mb-10 text-white opacity-90"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.9 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Join thousands of residents and visitors who use IndyChat to navigate the Circle City with confidence.
          </motion.p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Link 
              href="/signup" 
              className="inline-flex items-center justify-center py-4 px-10 text-lg font-medium bg-[#ed1c24] hover:bg-[#d01920] text-white rounded-md transition-all duration-300 hover:shadow-lg"
            >
              Get Started For Free
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CTA;

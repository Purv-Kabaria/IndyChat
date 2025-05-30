"use client";

import { motion } from 'framer-motion';

type StepProps = {
  number: number;
  title: string;
  description: string;
  index: number;
};

const Step = ({ number, title, description, index }: StepProps) => {
  return (
    <motion.div 
      className="step flex flex-col items-center text-center mb-12 md:mb-0 md:w-1/3 md:px-4 relative"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.7, 
        delay: index * 0.2,
        ease: "easeOut"
      }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <motion.div 
        className="w-20 h-20 bg-accent text-white rounded-full flex items-center justify-center text-3xl font-bold mb-8 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
        whileHover={{ scale: 1.1, rotate: 3 }}
        transition={{ type: "spring", stiffness: 300, damping: 10 }}
      >
        {number}
      </motion.div>
      <div className="max-w-md px-2 md:px-0">
        <motion.h3 
          className="text-xl lg:text-2xl font-semibold text-accent mb-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
          viewport={{ once: true }}
        >
          {title}
        </motion.h3>
        <motion.p 
          className="text-gray-600 leading-relaxed text-sm lg:text-base"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.2 + 0.4 }}
          viewport={{ once: true }}
        >
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
};

const HowItWorks = () => {
  const steps = [
    { 
      number: 1, 
      title: "Start a Conversation",
      description: "Click the chat link in the header to begin. No downloads or installations needed."
    },
    { 
      number: 2, 
      title: "Ask Your Question",
      description: 'Type or speak your question about Indianapolis - anything from "When is trash pickup?" to "Best pizza downtown?"'
    },
    { 
      number: 3, 
      title: "Get Instant Answers",
      description: "Receive accurate, up-to-date information tailored to your specific query, with links to more details when needed."
    },
  ];
  
  return (
    <div className="py-24 px-4 sm:px-6 bg-gradient-to-b from-gray-light via-white to-white" id="how-it-works">
      <motion.div 
        className="text-center mb-20 sm:mb-24"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut"}}
        viewport={{ once: true, amount: 0.1 }}
      >
        <h2 className="text-4xl lg:text-5xl font-cal font-bold text-accent mb-5">How It Works</h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">Getting answers about Indianapolis has never been easier.</p>
      </motion.div>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-between md:space-x-8 lg:space-x-12">
        {steps.map((step, index) => (
          <Step 
            key={index}
            number={step.number} 
            title={step.title} 
            description={step.description}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
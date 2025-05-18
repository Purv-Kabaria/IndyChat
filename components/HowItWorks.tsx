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
      className="step flex flex-col items-center text-center mb-16 relative"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.2,
        ease: "easeOut"
      }}
      viewport={{ once: true, amount: 0.1 }}
    >
      <motion.div 
        className="w-16 h-16 bg-[#14284b] text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {number}
      </motion.div>
      <div className="max-w-md">
        <h3 className="text-2xl font-semibold text-[#14284b] mb-4">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
      {number < 3 && (
        <motion.div 
          className="absolute left-1/2 bottom-[-40px] w-0.5 h-8 bg-[#94d2bd] transform -translate-x-1/2"
          initial={{ height: 0 }}
          whileInView={{ height: 32 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        />
      )}
    </motion.div>
  );
};

const HowItWorks = () => {
  const steps = [
    { 
      number: 1, 
      title: "Start a Conversation",
      description: "Click the chat icon in the corner of any page to begin. No downloads or installations needed."
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
    }
  ];
  
  return (
    <div className="py-24 px-8 bg-white" id="how-it-works">
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, amount: 0.1 }}
      >
        <h2 className="text-3xl font-bold text-[#14284b] mb-4">How It Works</h2>
        <p className="text-gray-600">Getting answers about Indianapolis has never been easier</p>
      </motion.div>
      <div className="max-w-4xl mx-auto">
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
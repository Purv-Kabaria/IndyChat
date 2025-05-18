"use client";

import { useEffect, useRef } from 'react';

type StepProps = {
  number: number;
  title: string;
  description: string;
  delay: string;
};

const Step = ({ number, title, description, delay }: StepProps) => {
  const stepRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const currentStepRef = stepRef.current;
    if (!currentStepRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100');
            entry.target.classList.remove('opacity-0');
            entry.target.classList.add('translate-y-0');
            entry.target.classList.remove('translate-y-5');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    observer.observe(currentStepRef);
    
    return () => {
      observer.unobserve(currentStepRef);
    };
  }, []);
  
  return (
    <div 
      ref={stepRef} 
      className={`step opacity-0 transform translate-y-5 transition-all duration-500 ${delay} flex flex-col items-center text-center mb-16 relative`}
    >
      <div className="w-16 h-16 bg-[#14284b] text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6">
        {number}
      </div>
      <div className="max-w-md">
        <h3 className="text-2xl font-semibold text-[#14284b] mb-4">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
      {number < 3 && (
        <div className="absolute left-1/2 bottom-[-40px] w-0.5 h-8 bg-[#94d2bd] transform -translate-x-1/2" />
      )}
    </div>
  );
};

const HowItWorks = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const currentSectionRef = sectionRef.current;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const header = entry.target.querySelector('.section-header');
            if (header) {
              header.classList.add('opacity-100');
              header.classList.remove('opacity-0');
            }
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (currentSectionRef) {
      observer.observe(currentSectionRef);
    }
    
    return () => {
      if (currentSectionRef) {
        observer.unobserve(currentSectionRef);
      }
    };
  }, []);
  
  return (
    <div ref={sectionRef} className="py-24 px-8 bg-white" id="how-it-works">
      <div className="section-header opacity-0 transition-all duration-500 text-center mb-16">
        <h2 className="text-3xl font-bold text-[#14284b] mb-4">How It Works</h2>
        <p className="text-gray-600">Getting answers about Indianapolis has never been easier</p>
      </div>
      <div className="max-w-4xl mx-auto">
        <Step 
          number={1} 
          title="Start a Conversation" 
          description="Click the chat icon in the corner of any page to begin. No downloads or installations needed."
          delay="delay-100"
        />
        <Step 
          number={2} 
          title="Ask Your Question" 
          description={'Type or speak your question about Indianapolis - anything from "When is trash pickup?" to "Best pizza downtown?"'}
          delay="delay-200"
        />
        <Step 
          number={3} 
          title="Get Instant Answers" 
          description="Receive accurate, up-to-date information tailored to your specific query, with links to more details when needed."
          delay="delay-300"
        />
      </div>
    </div>
  );
};

export default HowItWorks;
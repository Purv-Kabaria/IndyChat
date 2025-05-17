import { useEffect, useRef } from 'react';

type StepProps = {
  number: number;
  title: string;
  description: string;
  delay: string;
  isOdd: boolean;
};

const Step = ({ number, title, description, delay, isOdd }: StepProps) => {
  const stepRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
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
    
    if (stepRef.current) {
      observer.observe(stepRef.current);
    }
    
    return () => {
      if (stepRef.current) {
        observer.unobserve(stepRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      ref={stepRef} 
      className={`step opacity-0 transform translate-y-5 transition-all duration-500 ${delay} ${
        isOdd && typeof window !== 'undefined' && !window.matchMedia("(max-width: 992px)").matches ? 'mr-[50%] text-right flex-row-reverse' : ''
      }`}
    >
      <div className="w-[60px] h-[60px] bg-[#243b5f] text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-[0_5px_15px_rgba(0,95,115,0.3)] hover:bg-[#ed1c24] cursor-pointer">
        {number}
      </div>
      <div className="step-content">
        <h3 className="text-2xl text-highlight mb-4">{title}</h3>
        <p className="text-black leading-7">{description}</p>
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
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
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  
  return (
    <div ref={sectionRef} className="py-24 px-8 bg-white" id="how-it-works">
      <div className="section-header opacity-0 transition-all duration-500">
        <h2>How It Works</h2>
        <p>Getting answers about Indianapolis has never been easier</p>
      </div>
      <div className="max-w-[1000px] mx-auto relative">
        <div className="absolute h-full w-1 bg-accent left-[50%] transform -translate-x-1/2 z-[1] md:left-[30px] md:translate-x-0"></div>
        <div className="flex flex-col gap-16 relative z-[2]">
          <Step 
            number={1} 
            title="Start a Conversation" 
            description="Click the chat icon in the corner of any page to begin. No downloads or installations needed."
            delay="delay-1"
            isOdd={true}
          />
          <Step 
            number={2} 
            title="Ask Your Question" 
            description={"Type or speak your question about Indianapolis - anything from \"When is trash pickup?\" to \"Best pizza downtown?\""}
            delay="delay-2"
            isOdd={false}
          />
          <Step 
            number={3} 
            title="Get Instant Answers" 
            description="Receive accurate, up-to-date information tailored to your specific query, with links to more details when needed."
            delay="delay-3"
            isOdd={true}
          />
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;

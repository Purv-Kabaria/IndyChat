"use client";

import { useEffect, useRef } from 'react';
import { Calendar, Building2, MapPin, Utensils, Bus, BatteryPlus as EmergencyPlus } from 'lucide-react';

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: string;
};

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const currentCardRef = cardRef.current;
    
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
    
    if (currentCardRef) {
      observer.observe(currentCardRef);
    }
    
    return () => {
      if (currentCardRef) {
        observer.unobserve(currentCardRef);
      }
    };
  }, []);
  
  return (
    <div 
      ref={cardRef} 
      className={`feature-card opacity-0 transform translate-y-5 transition-all duration-300 ease-out ${delay} bg-white rounded-lg shadow-lg p-8 text-center`}
    >
      <div className="mb-6 flex justify-center">
        <div className="w-16 h-16 bg-[#14284b] rounded-full flex items-center justify-center text-white">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-4 text-[#14284b]">{title}</h3>
      <p className="text-gray-600 text-base leading-relaxed">{description}</p>
    </div>
  );
};

const Features = () => {
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
    <section ref={sectionRef} className="py-24 px-8 bg-gray-50" id="features">
      <div className="section-header opacity-0 transition-all duration-500 text-center mb-16">
        <h2 className="text-3xl font-bold text-[#14284b] mb-4">How IndyChat Helps You</h2>
        <p className="text-gray-600">Discover all the ways our chatbot can assist you in navigating Indianapolis</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <FeatureCard 
          icon={<Calendar className="w-8 h-8" />}
          title="Local Events"
          description="Find concerts, festivals, and community happenings throughout Indianapolis. Get dates, locations, and ticket information."
          delay="delay-100"
        />
        <FeatureCard 
          icon={<Building2 className="w-8 h-8" />}
          title="City Services"
          description="Get info on trash collection, permits, parking regulations, and other municipal services. Never miss a pickup day again."
          delay="delay-200"
        />
        <FeatureCard 
          icon={<MapPin className="w-8 h-8" />}
          title="Neighborhood Guide"
          description="Explore different areas and what makes each Indianapolis neighborhood unique. Find the perfect place to live or visit."
          delay="delay-300"
        />
        <FeatureCard 
          icon={<Utensils className="w-8 h-8" />}
          title="Dining & More"
          description="Get personalized recommendations for restaurants, bars, and attractions based on your preferences and location."
          delay="delay-400"
        />
        <FeatureCard 
          icon={<Bus className="w-8 h-8" />}
          title="Transportation"
          description="Real-time updates on INDYGO bus routes, road closures, bike share locations, and parking options downtown."
          delay="delay-500"
        />
        <FeatureCard 
          icon={<EmergencyPlus className="w-8 h-8" />}
          title="Emergency Resources"
          description="Quick access to emergency contacts, hospital locations, and important safety information for Marion County."
          delay="delay-600"
        />
      </div>
    </section>
  );
};

export default Features;
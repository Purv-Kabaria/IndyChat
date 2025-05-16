
import { useEffect, useRef } from 'react';

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
  delay: string;
};

const FeatureCard = ({ icon, title, description, delay }: FeatureCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
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
    
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);
  
  return (
    <div 
      ref={cardRef} 
      className={`feature-card opacity-0 transform translate-y-5 transition-all duration-300 ease-out ${delay}`}
    >
      <div className="feature-icon bg-highlight">
        <i className={`fas ${icon}`}></i>
      </div>
      <h3 className="text-xl font-semibold mb-4 text-primary">{title}</h3>
      <p className="text-black text-base leading-7">{description}</p>
    </div>
  );
};

const Features = () => {
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
    <section ref={sectionRef} className="py-24 px-8 bg-white" id="features">
      <div className="section-header opacity-0 transition-all duration-500">
        <h2>How IndyChat Helps You</h2>
        <p>Discover all the ways our chatbot can assist you in navigating Indianapolis</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-[1200px] mx-auto">
        <FeatureCard 
          icon="fa-calendar-alt"
          title="Local Events"
          description="Find concerts, festivals, and community happenings throughout Indianapolis. Get dates, locations, and ticket information."
          delay="delay-1"
        />
        <FeatureCard 
          icon="fa-city"
          title="City Services"
          description="Get info on trash collection, permits, parking regulations, and other municipal services. Never miss a pickup day again."
          delay="delay-2"
        />
        <FeatureCard 
          icon="fa-map-marked-alt"
          title="Neighborhood Guide"
          description="Explore different areas and what makes each Indianapolis neighborhood unique. Find the perfect place to live or visit."
          delay="delay-3"
        />
        <FeatureCard 
          icon="fa-utensils"
          title="Dining & More"
          description="Get personalized recommendations for restaurants, bars, and attractions based on your preferences and location."
          delay="delay-4"
        />
        <FeatureCard 
          icon="fa-bus"
          title="Transportation"
          description="Real-time updates on INDYGO bus routes, road closures, bike share locations, and parking options downtown."
          delay="delay-5"
        />
        <FeatureCard 
          icon="fa-first-aid"
          title="Emergency Resources"
          description="Quick access to emergency contacts, hospital locations, and important safety information for Marion County."
          delay="delay-6"
        />
      </div>
    </section>
  );
};

export default Features;

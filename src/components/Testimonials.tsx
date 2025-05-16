
import { useEffect, useRef } from 'react';

type TestimonialCardProps = {
  text: string;
  name: string;
  role: string;
  image: string;
  delay: string;
};

const TestimonialCard = ({ text, name, role, image, delay }: TestimonialCardProps) => {
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
      className={`testimonial-card opacity-0 transform translate-y-5 transition-all duration-500 ${delay}`}
    >
      <p className="italic mb-8 text-black text-base leading-7 relative z-[1]">{text}</p>
      <div className="flex items-center">
        <img 
          src={image} 
          alt={name} 
          className="w-[60px] h-[60px] rounded-full mr-5 object-cover border-3 border-accent"
        />
        <div>
          <h4 className="font-semibold text-primary mb-1">{name}</h4>
          <p className="text-sm text-black">{role}</p>
        </div>
      </div>
    </div>
  );
};

const Testimonials = () => {
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
    <div ref={sectionRef} className="py-24 px-8 bg-gray-light" id="testimonials">
      <div className="section-header opacity-0 transition-all duration-500">
        <h2>What Our Users Say</h2>
        <p>Hear from Indianapolis residents who use IndyChat daily</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-[1200px] mx-auto">
        <TestimonialCard 
          text={"\"IndyChat helped me find the perfect restaurant for my anniversary dinner. It knew all the best spots in Mass Ave and even suggested making reservations through OpenTable!\""}
          name="Sarah J."
          role="Downtown Resident"
          image="https://randomuser.me/api/portraits/women/45.jpg"
          delay=""
        />
        <TestimonialCard 
          text={"\"As a new resident, IndyChat has been invaluable for learning about trash pickup days and local services. It saved me hours of searching through city websites.\""}
          name="Michael T."
          role="Broad Ripple"
          image="https://randomuser.me/api/portraits/men/32.jpg"
          delay="delay-1"
        />
        <TestimonialCard 
          text={"\"I use IndyChat every weekend to find family-friendly events. It's like having a personal concierge for the city! The kids love asking it what's happening this weekend.\""}
          name="Lisa M."
          role="Fountain Square"
          image="https://randomuser.me/api/portraits/women/68.jpg"
          delay="delay-2"
        />
      </div>
    </div>
  );
};

export default Testimonials;


import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const CTA = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const content = entry.target.querySelector('.cta-content');
            if (content) {
              content.classList.add('opacity-100');
              content.classList.remove('opacity-0');
              content.classList.add('translate-y-0');
              content.classList.remove('translate-y-5');
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
    <div ref={sectionRef} className="py-24 px-8 bg-[#14284b] text-white text-center">
      <div className="max-w-[800px] mx-auto">
        <div className="cta-content opacity-0 transform translate-y-5 transition-all duration-500">
          <h2 className="text-4xl mb-6">Ready to Explore Indianapolis?</h2>
          <p className="text-lg mb-10 text-white opacity-90">Join thousands of residents and visitors who use IndyChat to navigate the Circle City with confidence.</p>
          <Link to="/signup" className="btn-cta">Get Started For Free</Link>
        </div>
      </div>
    </div>
  );
};

export default CTA;

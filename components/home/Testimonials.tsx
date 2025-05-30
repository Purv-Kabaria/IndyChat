'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

type TestimonialCardProps = {
  text: string;
  name: string;
  role: string;
  image: string;
  index: number;
};

const TestimonialCard = ({ text, name, role, image, index }: TestimonialCardProps) => {
  return (
    <motion.div 
      className="testimonial-card bg-white p-8 rounded-2xl shadow-xl flex flex-col"
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.7,
        delay: index * 0.2,
        ease: "easeOut" 
      }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ 
        y: -12,
        boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.3)"
      }}
    >
      <motion.p 
        className="italic mb-6 text-gray-700 text-base leading-relaxed relative z-[1] flex-grow"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
        viewport={{ once: true }}
      >
        {text}
      </motion.p>
      <motion.div 
        className="flex items-center mt-auto pt-4 border-t border-gray-200"
        initial={{ x: -30, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: index * 0.2 + 0.4 }}
        viewport={{ once: true }}
      >
        <div className="relative w-16 h-16 mr-4 flex-shrink-0">
          <Image 
            src={image} 
            alt={name}
            fill
            className="rounded-full object-cover border-4 border-accent"
          />
        </div>
        <div>
          <h4 className="font-semibold text-accent text-lg mb-0.5">{name}</h4>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Testimonials = () => {
  const testimonials = [
    {
      text: "IndyChat helped me find the perfect restaurant for my anniversary dinner. It knew all the best spots in Mass Ave and even suggested making reservations through OpenTable!",
      name: "Sarah J.",
      role: "Downtown Resident",
      image: "https://images.pexels.com/photos/4342352/pexels-photo-4342352.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
      text: "As a new resident, IndyChat has been invaluable for learning about trash pickup days and local services. It saved me hours of searching through city websites.",
      name: "Michael T.",
      role: "Broad Ripple",
      image: "https://images.pexels.com/photos/5920775/pexels-photo-5920775.jpeg?auto=compress&cs=tinysrgb&w=600"
    },
    {
      text: "I use IndyChat every weekend to find family-friendly events. It's like having a personal concierge for the city! The kids love asking it what's happening this weekend.",
      name: "Lisa M.",
      role: "Fountain Square",
      image: "https://images.pexels.com/photos/5876695/pexels-photo-5876695.jpeg?auto=compress&cs=tinysrgb&w=600"
    }
  ];
  
  return (
    <div className="py-24 px-6 sm:px-8 bg-gradient-to-b from-white via-gray-light to-accent" id="testimonials">
      <motion.div 
        className="text-center mb-20 sm:mb-24"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut"}}
        viewport={{ once: true, amount: 0.1 }}
      >
        <h2 className="text-4xl lg:text-5xl font-cal font-bold text-accent mb-5">What Our Users Say</h2>
        <p className="text-lg text-gray-700 md:text-xl max-w-xl mx-auto">
          Hear from Indianapolis residents who use IndyChat daily
        </p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard 
            key={index}
            text={testimonial.text}
            name={testimonial.name}
            role={testimonial.role}
            image={testimonial.image}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default Testimonials;

export { Testimonials }
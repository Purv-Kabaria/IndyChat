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
      className="testimonial-card bg-white p-8 rounded-2xl shadow-lg"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.2,
        ease: "easeOut" 
      }}
      viewport={{ once: true, amount: 0.1 }}
      whileHover={{ 
        y: -10,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
    >
      <motion.p 
        className="italic mb-8 text-black text-base leading-7 relative z-[1]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
        viewport={{ once: true }}
      >
        {text}
      </motion.p>
      <motion.div 
        className="flex items-center"
        initial={{ x: -20, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: index * 0.2 + 0.5 }}
        viewport={{ once: true }}
      >
        <div className="relative w-[60px] h-[60px] mr-5">
          <Image 
            src={image} 
            alt={name}
            fill
            className="rounded-full object-cover border-2 border-indigo-600"
          />
        </div>
        <div>
          <h4 className="font-semibold text-indigo-600 mb-1">{name}</h4>
          <p className="text-sm text-black">{role}</p>
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
      image: "https://randomuser.me/api/portraits/women/45.jpg"
    },
    {
      text: "As a new resident, IndyChat has been invaluable for learning about trash pickup days and local services. It saved me hours of searching through city websites.",
      name: "Michael T.",
      role: "Broad Ripple",
      image: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      text: "I use IndyChat every weekend to find family-friendly events. It's like having a personal concierge for the city! The kids love asking it what's happening this weekend.",
      name: "Lisa M.",
      role: "Fountain Square",
      image: "https://randomuser.me/api/portraits/women/68.jpg"
    }
  ];
  
  return (
    <div className="py-24 px-8 bg-gray-50" id="testimonials">
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, amount: 0.1 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
        <p className="text-lg text-gray-600">Hear from Indianapolis residents who use IndyChat daily</p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-[1200px] mx-auto">
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
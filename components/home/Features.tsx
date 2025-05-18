"use client";

import { Calendar, Building2, MapPin, Utensils, Bus, BatteryPlus as EmergencyPlus } from 'lucide-react';
import { motion } from 'framer-motion';

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
};

const FeatureCard = ({ icon, title, description, index }: FeatureCardProps) => {
  return (
    <motion.div 
      className="feature-card bg-white rounded-lg shadow-lg p-8 text-center"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      viewport={{ once: true, amount: 0.1 }}
    >
      <motion.div 
        className="mb-6 flex justify-center"
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <div className="w-16 h-16 bg-[#14284b] rounded-full flex items-center justify-center text-white">
          {icon}
        </div>
      </motion.div>
      <h3 className="text-xl font-semibold mb-4 text-[#14284b]">{title}</h3>
      <p className="text-gray-600 text-base leading-relaxed">{description}</p>
    </motion.div>
  );
};

const Features = () => {
  const features = [
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Local Events",
      description: "Find concerts, festivals, and community happenings throughout Indianapolis. Get dates, locations, and ticket information."
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      title: "City Services",
      description: "Get info on trash collection, permits, parking regulations, and other municipal services. Never miss a pickup day again."
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Neighborhood Guide",
      description: "Explore different areas and what makes each Indianapolis neighborhood unique. Find the perfect place to live or visit."
    },
    {
      icon: <Utensils className="w-8 h-8" />,
      title: "Dining & More",
      description: "Get personalized recommendations for restaurants, bars, and attractions based on your preferences and location."
    },
    {
      icon: <Bus className="w-8 h-8" />,
      title: "Transportation",
      description: "Real-time updates on INDYGO bus routes, road closures, bike share locations, and parking options downtown."
    },
    {
      icon: <EmergencyPlus className="w-8 h-8" />,
      title: "Emergency Resources",
      description: "Quick access to emergency contacts, hospital locations, and important safety information for Marion County."
    }
  ];
  
  return (
    <section className="py-24 px-8 bg-gray-50" id="features">
      <motion.div 
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true, amount: 0.1 }}
      >
        <h2 className="text-3xl font-bold text-[#14284b] mb-4">How IndyChat Helps You</h2>
        <p className="text-gray-600">Discover all the ways our chatbot can assist you in navigating Indianapolis</p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            index={index}
          />
        ))}
      </div>
    </section>
  );
};

export default Features;
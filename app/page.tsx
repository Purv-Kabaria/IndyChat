"use client";

import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import HowItWorks from '@/components/home/HowItWorks';
import Testimonials from '@/components/home/Testimonials';
import CTA from '@/components/home/CTA';
import Footer from '@/components/layout/Footer';
import BackToTop from '@/components/home/BackToTop';
import { useEffect } from 'react';

const Index = () => {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      
      if (element) {
        setTimeout(() => {
          window.scrollTo({
            top: element.offsetTop,
            behavior: 'smooth'
          });
        }, 300);
      }
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <CTA />
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Index;

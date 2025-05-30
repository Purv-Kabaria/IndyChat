"use client";

import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import CTA from "@/components/home/CTA";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/home/BackToTop";
import { useEffect, useState } from "react";
import PageLoader from "@/components/layout/PageLoader";

const CRITICAL_IMAGE_URLS = [
  '/images/hero.jpg',
];

const Index = () => {
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  useEffect(() => {
    let active = true;
    let loadedImagesCount = 0;
    const totalCriticalImages = CRITICAL_IMAGE_URLS.length;

    if (totalCriticalImages === 0) {
      const noImagesTimer = setTimeout(() => {
        if (active) {
          setIsLoadingPage(false);
        }
      }, 1000);
      return () => {
        active = false;
        clearTimeout(noImagesTimer);
      };
    }

    let hideOnLoadTimeoutId: NodeJS.Timeout | null = null;

    CRITICAL_IMAGE_URLS.forEach((url) => {
      const img = new window.Image();
      img.src = url;
      const handleLoadOrError = () => {
        if (!active) return;
        loadedImagesCount++;
        if (loadedImagesCount === totalCriticalImages) {
          if (hideOnLoadTimeoutId) clearTimeout(hideOnLoadTimeoutId);
          hideOnLoadTimeoutId = setTimeout(() => {
            if (active) {
              setIsLoadingPage(false);
            }
          }, 1000);
        }
      };
      img.onload = handleLoadOrError;
      img.onerror = handleLoadOrError;
    });

    const safetyTimeout = setTimeout(() => {
      if (active && isLoadingPage) {
        console.warn(
          "Page loader safety timeout reached. Some critical assets might not have loaded."
        );
        setIsLoadingPage(false);
      }
    }, 7000);

    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          if (active) {
            window.scrollTo({
              top: element.offsetTop,
              behavior: "smooth",
            });
          }
        }, 300);
      }
    }

    return () => {
      active = false;
      clearTimeout(safetyTimeout);
      if (hideOnLoadTimeoutId) {
        clearTimeout(hideOnLoadTimeoutId);
      }
    };
  }, [isLoadingPage]);

  if (isLoadingPage) {
    return <PageLoader />;
  }

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

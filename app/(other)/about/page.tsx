"use client";
import Head from "next/head";
import Image from "next/image";
import {
  Building2Icon,
  UsersIcon,
  ComputerIcon,
  BellIcon,
  MessageSquareText,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeInOut" },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardHover = {
  hover: {
    scale: 1.03,
    boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

export default function AboutPage() {
  const chatbotFeatures = [
    {
      title: "24/7 Instant Access",
      description:
        "Get answers and access city services information anytime, from any device.",
      icon: <ComputerIcon className="h-10 w-10 text-accent" />,
    },
    {
      title: "Comprehensive Knowledge",
      description:
        "IndyChat is connected to all major city departments for up-to-date information.",
      icon: <Building2Icon className="h-10 w-10 text-accent" />,
    },
    {
      title: "Direct Citizen Feedback",
      description:
        "A direct line to voice concerns, make service requests, and share ideas.",
      icon: <MessageSquareText className="h-10 w-10 text-accent" />,
    },
    {
      title: "Critical & Emergency Alerts",
      description:
        "Stay informed with real-time updates on important city news and emergencies.",
      icon: <BellIcon className="h-10 w-10 text-accent" />,
    },
  ];

  const howItWorksSteps = [
    {
      step: 1,
      title: "Ask Your Question",
      description:
        "Simply type your query or select a common topic. IndyChat understands natural language.",
      icon: <UsersIcon className="h-8 w-8 text-white" />,
    },
    {
      step: 2,
      title: "AI-Powered Understanding",
      description:
        "Our advanced AI processes your request, identifying key information and intent.",
      icon: <Lightbulb className="h-8 w-8 text-white" />,
    },
    {
      step: 3,
      title: "Information & Action",
      description:
        "Receive accurate information, links to resources, or guidance on completing city services.",
      icon: <ArrowRight className="h-8 w-8 text-white" />,
    },
  ];

  return (
    <>
      <Head>
        <title>About IndyChat | Indianapolis Official Chatbot</title>
        <meta
          name="description"
          content="Discover IndyChat, Indianapolis' official AI-powered platform for civic engagement, city services, and citizen feedback."
        />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gray-50 text-gray-800">
        {/* Introduction Section */}
        <motion.section className="py-16 md:py-40 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              variants={fadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="text-3xl md:text-6xl font-bold font-cal text-accent mb-6">
              Welcome to a Smarter Indianapolis
            </motion.h2>
            <motion.p
              variants={fadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="text-lg text-gray-700 leading-relaxed">
              IndyChat is more than just a chatbot; it's a commitment from the
              City of Indianapolis to enhance how you connect with your local
              government. We believe in transparent communication, easy access
              to resources, and empowering our citizens through technology.
              IndyChat is your reliable partner for navigating city services,
              finding information, and making your voice heard.
            </motion.p>
          </div>
        </motion.section>

        {/* How IndyChat Works Section */}
        <motion.section className="py-16 md:py-24 px-4 bg-accent text-white">
          <div className="max-w-5xl mx-auto">
            <motion.h2
              variants={fadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold font-cal mb-16 text-center">
              How IndyChat Works for You
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}>
              {howItWorksSteps.map((item) => (
                <motion.div
                  key={item.step}
                  className="flex flex-col items-center text-center p-6 bg-primary text-accent rounded-xl shadow-lg"
                  variants={fadeIn}>
                  <div className="bg-accent p-4 rounded-full mb-5 ring-4 ring-accent/30">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-accent/80 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Chatbot Features Section */}
        <motion.section className="py-16 md:py-24 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <motion.h2
              variants={fadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold font-cal text-accent mb-16 text-center">
              IndyChat Capabilities
            </motion.h2>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}>
              {chatbotFeatures.map((feature) => (
                <motion.div
                  key={feature.title}
                  className="bg-accent rounded-xl p-8 flex items-start space-x-6 shadow-lg hover:shadow-xl transition-shadow duration-300 group"
                  variants={{ ...fadeIn, ...cardHover }}
                  initial="initial"
                  whileInView="animate"
                  whileHover="hover"
                  viewport={{ once: true }}>
                  <div className="flex-shrink-0 p-3 bg-white rounded-full duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-white leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Mission Statement */}
        <motion.section className="bg-accent text-white py-20 md:py-28 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              variants={fadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold font-cal mb-8">
              Our Mission & Commitment
            </motion.h2>
            <motion.div
              variants={fadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="prose prose-lg text-white/90 max-w-none leading-relaxed">
              <p>
                IndyChat embodies the City of Indianapolis' dedication to
                leveraging technology for enhanced civic engagement. Our mission
                is to provide a seamless, intuitive, and transparent bridge
                between citizens and municipal services. We are committed to
                ensuring that every resident has efficient access to city
                resources and a clear channel for communication.
              </p>
              <p className="mt-6">
                Officially endorsed by the Indianapolis City-County Council,
                IndyChat adheres to the highest standards of data privacy and
                security, ensuring your interactions are safe and confidential
                while delivering unparalleled access to the information and
                services you need.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Get Involved Section */}
        <motion.section className="py-16 md:py-24 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              variants={fadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold font-cal text-accent mb-6">
              Be Part of a Smarter City
            </motion.h2>
            <motion.p
              variants={fadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="text-lg text-gray-700 leading-relaxed mb-10">
              Your participation is key to making Indianapolis an even better
              place to live. Use IndyChat, share your feedback, and help us
              improve our services.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row justify-center items-center gap-6"
              variants={fadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}>
              <motion.a
                whileHover={{ scale: 1.05 }}
                href="/chat"
                className="bg-accent text-white px-8 py-3.5 rounded-lg text-md font-semibold hover:bg-accent/90 transition-colors duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                Try IndyChat Now
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                href="mailto:feedback@indychat.gov?subject=IndyChat Feedback"
                className="bg-gray-200 text-accent px-8 py-3.5 rounded-lg text-md font-semibold hover:bg-gray-300 transition-colors duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                Provide Feedback
              </motion.a>
            </motion.div>
          </div>
        </motion.section>
      </main>

      <Footer />
    </>
  );
}

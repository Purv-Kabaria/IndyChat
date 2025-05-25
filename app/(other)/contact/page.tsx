"use client";
import Head from "next/head";
import { MapPin, Phone, Mail } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeInOut" },
};

const staggerContainer = {
  initial: {},
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

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Contact IndyChat - Indianapolis Community Support</title>
        <meta
          name="description"
          content="Get in touch with IndyChat for support, questions, or feedback about Indianapolis services"
        />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <motion.section
          className="bg-accent text-primary py-20 px-4"
          initial="initial"
          animate="animate"
          variants={staggerContainer}>
          <div className="max-w-6xl mx-auto text-center">
            <motion.h1
              className="text-4xl md:text-6xl font-cal mb-6 text-white"
              variants={fadeIn}>
              Connect With Our Team
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-white/90"
              variants={fadeIn}>
              We're here to help you navigate Indianapolis better
            </motion.p>
          </div>
        </motion.section>

        {/* Contact Cards */}
        <motion.section
          className="py-16 px-4"
          initial="initial"
          whileInView="animate"
          variants={staggerContainer}
          viewport={{ once: true }}>
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <MapPin className="h-6 w-6 text-accent" />,
                title: "Visit Us",
                lines: ["200 E Washington St", "Indianapolis, IN 46204"],
              },
              {
                icon: <Phone className="h-6 w-6 text-accent" />,
                title: "Call Us",
                lines: [
                  "General Inquiries:",
                  <a
                    href="tel:+13172316131"
                    className="text-accent hover:underline"
                    key="phone-link">
                    (317) 231-6131
                  </a>,
                ],
              },
              {
                icon: <Mail className="h-6 w-6 text-accent" />,
                title: "Email Us",
                lines: [
                  <a
                    href="mailto:support@indychat.gov"
                    className="text-accent hover:underline"
                    key="email-link">
                    support@indychat.gov
                  </a>,
                ],
              },
            ].map((card, index) => (
              <motion.div
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center"
                variants={{ ...fadeIn, ...cardHover }}
                whileHover="hover">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-5 ring-4 ring-accent/20">
                  {card.icon}
                </div>
                <h3 className="text-xl font-semibold text-accent mb-3">
                  {card.title}
                </h3>
                <div className="text-gray-700">
                  {card.lines.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Contact Form & Map */}
        <motion.section
          className="py-16 px-4 bg-white"
          initial="initial"
          whileInView="animate"
          variants={staggerContainer}
          viewport={{ once: true }}>
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <motion.div className="space-y-6" variants={fadeIn}>
              <h2 className="text-3xl font-cal text-accent mb-8">
                Send Us a Message
              </h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-700 mb-2 font-medium">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-gray-800"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-gray-700 mb-2 font-medium">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-gray-800"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-gray-700 mb-2 font-medium">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-gray-800"
                    placeholder="Reason for contacting"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-700 mb-2 font-medium">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-gray-800 resize-none"
                    placeholder="Your message..."></textarea>
                </div>

                <motion.button
                  type="submit"
                  className="w-full bg-accent text-white py-3.5 rounded-lg hover:bg-accent/90 transition-colors font-semibold text-md shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}>
                  Send Message
                </motion.button>
              </form>
            </motion.div>

            {/* Map */}
            <motion.div
              className="h-full w-full rounded-xl overflow-hidden shadow-lg min-h-[400px] lg:min-h-full"
              variants={fadeIn}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d196281.1292116491!2d-86.35279984780237!3d39.77946142414255!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x886b50ffbb779ae3%3A0x2df908e72b4f125b!2sIndianapolis%2C%20IN!5e0!3m2!1sen!2sus!4v1689720306767!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="min-h-[400px] lg:h-full"></iframe>
            </motion.div>
          </div>
        </motion.section>
      </main>

      <Footer />
    </>
  );
}

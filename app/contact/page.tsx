// app/contact/page.tsx

import Head from 'next/head';
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Contact IndyChat - Indianapolis Community Support</title>
        <meta name="description" content="Get in touch with IndyChat for support, questions, or feedback about Indianapolis services" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-accent text-primary py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-cal mb-6 text-clip text-blue-950">
              Connect With Our Team
            </h1>
            <p className="text-xl md:text-2xl text-primary/90 text-blue-950">
              We're here to help you navigate Indianapolis better
            </p>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <MapPinIcon className="h-6 w-6 text-red-700" />
              </div>
              <h3 className="text-xl font-bold text-accent mb-2 text-black">Visit Us</h3>
              <p className="text-blue-800">
                200 E Washington St<br />
                Indianapolis, IN 46204
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <PhoneIcon className="h-6 w-6 text-red-700" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Call Us</h3>
              <p className="text-blue-800">
                General Inquiries: <br />
                <a href="tel:+13172316131" className="text-primary hover:underline">(317) 231-6131</a>
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <EnvelopeIcon className="h-6 w-6 text-red-700" />
              </div>
              <h3 className="text-xl font-bold text-black mb-2">Email Us</h3>
              <p className="text-blue-800">
                <a href="mailto:support@indychat.gov" className="text-primary hover:underline">
                  support@indychat.gov
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Contact Form & Map */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="space-y-6">
              <h2 className="text-3xl font-cal text-accent mb-8 text-blue-950">
                Send Us a Message
              </h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Name</label>
                    <input 
  type="text" 
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-black"
/>

                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Subject</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-black"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Message</label>
                  <textarea 
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-black"
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-red-700 text-white py-3 rounded-lg hover:bg-accent/90 transition-colors font-semibold"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Map */}
            <div className="h-full w-full rounded-xl overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d196281.1292116491!2d-86.35279984780237!3d39.77946142414255!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x886b50ffbb779ae3%3A0x2df908e72b4f125b!2sIndianapolis%2C%20IN!5e0!3m2!1sen!2sus!4v1689720306767!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="min-h-[400px]"
              ></iframe>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
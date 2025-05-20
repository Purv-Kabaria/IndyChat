// app/about/page.tsx

import Head from 'next/head';
import Image from 'next/image';
import { BuildingOffice2Icon, UserGroupIcon, CpuChipIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const cityOfficials = [
    {
      name: 'Mayor Joe Hogsett',
      role: 'Mayor of Indianapolis',
      description: 'Leading city initiatives for digital transformation and citizen engagement',
      image: '/images/officials/mayor.jpeg'
    },
    {
      name: 'Dan Parker',
      role: 'Director of Public Works',
      description: 'Oversees city infrastructure and public services',
      image: '/images/officials/public-works.jpeg'
    },
    {
      name: 'Dr. Virginia Caine',
      role: 'Marion County Public Health Director',
      description: 'Manages public health initiatives and emergency response',
      image: '/images/officials/health-director.jpeg'
    }
  ];

  const chatbotFeatures = [
    {
      title: '24/7 Availability',
      description: 'Instant access to city services information anytime, anywhere',
      icon: <CpuChipIcon className="h-8 w-8 text-accent" />
    },
    {
      title: 'Multi-Department Integration',
      description: 'Connected to all major city departments and services',
      icon: <BuildingOffice2Icon className="h-8 w-8 text-accent" />
    },
    {
      title: 'Citizen Feedback System',
      description: 'Direct line to city officials and service requests',
      icon: <UserGroupIcon className="h-8 w-8 text-accent" />
    },
    {
      title: 'Emergency Alerts',
      description: 'Real-time updates on critical city situations',
      icon: <InformationCircleIcon className="h-8 w-8 text-accent" />
    }
  ];

  return (
    <>
      <Head>
        <title>About IndyChat - Indianapolis Official Chatbot</title>
        <meta name="description" content="Learn about IndyChat - Indianapolis' official AI-powered civic engagement platform" />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-blue-950 text-primary py-20 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-cal mb-6">
              Connecting Indianapolis Citizens & City Services
            </h1>
            <p className="text-xl md:text-2xl text-primary/90 mb-8">
              Your 24/7 Digital Gateway to Civic Engagement
            </p>
          </div>
        </section>

        {/* City Officials Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-cal text-accent mb-12 text-center text-blue-950">
              Meet Your City Leadership
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {cityOfficials.map((official, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-lg shadow-md hover:shadow-2xl transition-shadow duration-300 text-blue-800"

                >
                  <div className="relative h-64 w-full">
                    <Image
                      src={official.image}
                      alt={official.name}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-t-lg"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-accent mt-4 mb-2">{official.name}</h3>
                  <p className="text-secondary font-medium mb-2">{official.role}</p>
                  <p className="text-gray-600">{official.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chatbot Features Section */}
        <section className="bg-white py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-cal text-accent mb-12 text-center  text-blue-950">
              Our Chatbot Capabilities
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {chatbotFeatures.map((feature, index) => (
                <div 
                  key={index} 
className="bg-gray-50 rounded-lg p-6 flex items-start space-x-6 shadow-md hover:shadow-2xl transition-shadow duration-300 text-blue-800"
                >
                  <div className="flex-shrink-0 p-3 bg-accent/10 rounded-lg">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-accent mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="bg-blue-950 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-cal mb-8">
              Our Mission
            </h2>
            <div className="prose-lg text-white/90">
              <p>
                IndyChat was created through a partnership between the City of Indianapolis 
                and local technology leaders to revolutionize civic engagement. Our AI-powered 
                platform serves as a bridge between citizens and municipal services, ensuring 
                transparent communication and efficient access to city resources.
              </p>
              <p className="mt-6">
                Officially endorsed by the Indianapolis City-County Council, IndyChat 
                maintains strict adherence to data privacy standards while providing 
                unparalleled access to city services.
              </p>
            </div>
            <a
              href="/chat"
              className="mt-8 inline-block bg-red-700 text-white px-8 py-3 rounded-lg hover:bg-secondary/90 transition-colors duration-300"
            >
              Try IndyChat Now
            </a>
          </div>
        </section>

        {/* Partnerships Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-cal text-accent mb-8 text-blue-800">
              Official City Partners
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-12">
              <div className="relative h-24 w-48">
                <Image
                  src="/images/partners/city-seal.png"
                  alt="Indianapolis City Seal"
                  layout="fill"
                  objectFit="contain"
className="opacity-80 hover:opacity-100 transition-opacity duration-300 ease-in-out"
                />
              </div>
              <div className="relative h-20 w-48">
                <Image
                  src="/images/partners/downtown-indy.jpeg"
                  alt="Downtown Indy Inc."
                  layout="fill"
                  objectFit="contain"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
              <div className="relative h-20 w-48">
                <Image
                  src="/images/partners/indianapolis-public-library.png"
                  alt="Indianapolis Public Library"
                  layout="fill"
                  objectFit="contain"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
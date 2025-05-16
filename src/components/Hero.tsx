
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="w-full bg-[#243b5f] py-40 px-8 flex flex-col items-center justify-center text-center text-white" id="home">
      <div className="max-w-[900px] mx-auto">
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          Your Personal Indianapolis Guide
        </h1>
        <p className="text-xl mb-10 text-white opacity-90">
          Get instant answers about everything Indianapolis - from events and dining to city services and neighborhood insights
        </p>
        <Link 
          to="/chatbot" 
          className="inline-flex items-center justify-center py-4 px-8 text-lg font-medium bg-[#ed1c24] hover:bg-[#d01920] text-white rounded-md transition-all duration-300 hover:shadow-lg"
        >
          Start Chatting Now →
        </Link>
      </div>
    </div>
  );
};

export default Hero;

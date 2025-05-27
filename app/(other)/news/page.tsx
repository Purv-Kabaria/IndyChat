"use client";
import Head from "next/head";
import { useEffect, useState } from "react";
import { CalendarDaysIcon, NewspaperIcon, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { getAllArticles, Article } from "@/functions/articleUtils";

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
    boxShadow: "0px 10px 20px rgba(0,0,0,0.08)",
    transition: { duration: 0.3, ease: "easeInOut" },
  },
};

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const fetchedArticles = await getAllArticles();
        setArticles(fetchedArticles);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch articles:", err);
        setError("Could not load articles. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  return (
    <>
      <Head>
        <title>City News & Updates | Indianapolis Official Chatbot</title>
        <meta
          name="description"
          content="Stay informed with the latest news, announcements, and updates from the City of Indianapolis."
        />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-gray-50 text-gray-800">
        {/* Page Header Section */}
        <motion.section
          className="py-20 md:py-32 px-4 bg-accent text-white text-center"
          variants={fadeIn}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}>
          <div className="max-w-3xl mx-auto">
            <NewspaperIcon className="h-16 w-16 mx-auto mb-6 text-white/80" />
            <motion.h1
              variants={fadeIn}
              className="text-4xl md:text-6xl font-bold font-cal mb-6">
              City News & Updates
            </motion.h1>
            <motion.p
              variants={fadeIn}
              className="text-lg md:text-xl text-white/90 leading-relaxed">
              Stay informed with the latest announcements, developments, and
              stories from across Indianapolis.
            </motion.p>
          </div>
        </motion.section>

        {/* News Articles Section */}
        <motion.section
          className="py-16 md:py-24 px-4"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}>
          <div className="max-w-5xl mx-auto">
            <motion.h2
              variants={fadeIn}
              className="text-3xl md:text-4xl font-bold font-cal text-accent mb-16 text-center">
              Latest Articles
            </motion.h2>

            {loading && (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-accent" />
                <p className="ml-4 text-lg text-gray-600">
                  Loading articles...
                </p>
              </div>
            )}

            {!loading && error && (
              <div className="text-center py-10">
                <p className="text-red-500 text-lg">{error}</p>
              </div>
            )}

            {!loading && !error && articles.length === 0 && (
              <div className="text-center py-10">
                <NewspaperIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl text-gray-500">
                  No news articles found at the moment.
                </p>
                <p className="text-gray-400 mt-2">
                  Please check back later for updates.
                </p>
              </div>
            )}

            {!loading && !error && articles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article) => (
                  <motion.div
                    key={article.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col group"
                    variants={{ ...fadeIn, ...cardHover }}
                    whileHover="hover">
                    {/* Optional Image */}
                    {article.imageUrl && (
                      <div className="w-full h-48 overflow-hidden">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-grow">
                      <span className="text-xs font-semibold text-accent mb-1 tracking-wider uppercase">
                        {article.category || "General News"}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                        {article.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <CalendarDaysIcon className="h-4 w-4 mr-1.5" />
                        <span>
                          {article.createdAt
                            ? new Date(article.createdAt).toLocaleDateString()
                            : "Date not available"}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-4 flex-grow">
                        {article.content.substring(0, 150)}
                        {article.content.length > 150 ? "..." : ""}
                      </p>
                      <a
                        href={`/news/${article.id}`}
                        className="inline-block mt-auto text-sm font-medium text-accent hover:text-accent/80 transition-colors duration-200 self-start">
                        Read More &rarr;
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      </main>

      <Footer />
    </>
  );
}

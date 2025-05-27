"use client";
import Head from "next/head";
import { useEffect, useState, useMemo } from "react";
import {
  CalendarDaysIcon,
  NewspaperIcon,
  Loader2,
  Search,
  ListFilter,
  ArrowDownUp,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import {
  getAllArticles,
  Article,
  ARTICLE_CATEGORIES,
  ArticleCategory,
} from "@/functions/articleUtils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    ArticleCategory | "all"
  >("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");

  const availableCategories = useMemo(() => {
    return ARTICLE_CATEGORIES;
  }, []);

  const filteredAndSortedArticles = useMemo(() => {
    let processedArticles = [...articles];

    if (searchTerm) {
      processedArticles = processedArticles.filter((article) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      processedArticles = processedArticles.filter(
        (article) => article.category === selectedCategory
      );
    }

    switch (sortBy) {
      case "date_asc":
        processedArticles.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "date_desc":
        processedArticles.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "title_asc":
        processedArticles.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title_desc":
        processedArticles.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        processedArticles.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return processedArticles;
  }, [articles, searchTerm, selectedCategory, sortBy]);

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
              className="text-3xl md:text-4xl font-bold font-cal text-accent mb-12 text-center">
              Latest Articles
            </motion.h2>

            {/* Controls Section */}
            <motion.div
              variants={fadeIn}
              className="mb-12 p-6 bg-white rounded-lg shadow-md ">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* Search Input */}
                <div className="md:col-span-1">
                  <label
                    htmlFor="search-articles"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    <Search className="inline h-4 w-4 mr-1 opacity-70" /> Search
                    Titles
                  </label>
                  <Input
                    id="search-articles"
                    type="text"
                    placeholder="Enter keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label
                    htmlFor="category-filter"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    <ListFilter className="inline h-4 w-4 mr-1 opacity-70" />{" "}
                    Filter by Category
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value: ArticleCategory | "all") =>
                      setSelectedCategory(value)
                    }>
                    <SelectTrigger
                      id="category-filter"
                      className="w-full bg-white border-gray-300 hover:border-accent focus:border-accent">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-md">
                      <SelectItem
                        value="all"
                        className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-800 cursor-pointer">
                        All Categories
                      </SelectItem>
                      {availableCategories.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-800 cursor-pointer">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <label
                    htmlFor="sort-by"
                    className="block text-sm font-medium text-gray-700 mb-1">
                    <ArrowDownUp className="inline h-4 w-4 mr-1 opacity-70" />{" "}
                    Sort By
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger
                      id="sort-by"
                      className="w-full bg-white border-gray-300 hover:border-accent focus:border-accent">
                      <SelectValue placeholder="Sort articles" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-md">
                      <SelectItem
                        value="date_desc"
                        className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-800 cursor-pointer">
                        Date (Newest First)
                      </SelectItem>
                      <SelectItem
                        value="date_asc"
                        className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-800 cursor-pointer">
                        Date (Oldest First)
                      </SelectItem>
                      <SelectItem
                        value="title_asc"
                        className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-800 cursor-pointer">
                        Title (A-Z)
                      </SelectItem>
                      <SelectItem
                        value="title_desc"
                        className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-800 cursor-pointer">
                        Title (Z-A)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

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

            {!loading && !error && filteredAndSortedArticles.length === 0 && (
              <div className="text-center py-10">
                <NewspaperIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl text-gray-500">
                  No articles match your criteria.
                </p>
                <p className="text-gray-400 mt-2">
                  Try adjusting your search or filters.
                </p>
              </div>
            )}

            {!loading && !error && filteredAndSortedArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredAndSortedArticles.map((article) => (
                  <motion.div
                    key={article.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col group"
                    variants={{ ...fadeIn, ...cardHover }}
                    whileHover="hover">
                    {/* Enhanced Image Handling */}
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                      {article.image_url ? (
                        <Image
                          src={article.image_url}
                          alt={article.title || "Article image"}
                          layout="fill"
                          objectFit="cover"
                          className="transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <NewspaperIcon className="h-16 w-16 text-gray-400" />
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <span className="text-xs font-semibold text-accent mb-2 tracking-wider uppercase">
                        {article.category || "General News"}
                      </span>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3 leading-tight group-hover:text-accent transition-colors duration-200">
                        {article.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500 mb-4">
                        <CalendarDaysIcon className="h-4 w-4 mr-1.5" />
                        <span>
                          {article.created_at
                            ? new Date(article.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )
                            : "Date not available"}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-5 flex-grow">
                        {article.content.substring(0, 120)}
                        {article.content.length > 120 ? "..." : ""}
                      </p>
                      <a
                        href={`/news/${article.id}`}
                        className="inline-block mt-auto text-sm font-medium text-accent hover:text-accent/80 transition-colors duration-200 self-start group-hover:underline">
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

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getArticleById, Article } from "@/functions/articleUtils";
import { Timestamp } from "firebase/firestore";
import {
  Loader2,
  ArrowLeft,
  CalendarDays,
  UserCircle,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : undefined;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchArticle = async () => {
        setLoading(true);
        setError(null);
        try {
          const fetchedArticle = await getArticleById(id);
          if (fetchedArticle) {
            setArticle(fetchedArticle);
          } else {
            setError("Article not found.");
          }
        } catch (e) {
          console.error("Error fetching article:", e);
          setError("Failed to load article. Please try again later.");
        }
        setLoading(false);
      };
      fetchArticle();
    } else {
      setError("Invalid article ID.");
      setLoading(false);
    }
  }, [id]);

  const formatDate = (
    dateInput: Timestamp | string | Date | null | undefined
  ) => {
    if (!dateInput) return "Date not available";

    let date: Date;

    if (dateInput instanceof Timestamp) {
      date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === "string") {
      date = new Date(dateInput);
    } else {
      return "Invalid date format";
    }

    if (isNaN(date.getTime())) {
      try {
        const potentialObject = JSON.parse(String(dateInput));
        if (
          potentialObject &&
          typeof potentialObject.seconds === "number" &&
          typeof potentialObject.nanoseconds === "number"
        ) {
          date = new Timestamp(
            potentialObject.seconds,
            potentialObject.nanoseconds
          ).toDate();
        }
        if (isNaN(date.getTime()))
          return "Date not available (after re-parse attempt)";
      } catch {
        return "Date not available (invalid string)";
      }
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--navbar-height,80px))] bg-gray-50 text-gray-700 p-4">
          <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
          <p className="text-lg">Loading article...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--navbar-height,80px))] bg-gray-50 text-red-600 p-4">
          <p className="text-xl mb-4">{error}</p>
          <Button onClick={() => router.push("/news")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to News
          </Button>
        </div>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--navbar-height,80px))] bg-gray-50 text-gray-700 p-4">
          <p className="text-xl">Article not found.</p>
          <Button onClick={() => router.push("/news")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to News
          </Button>
        </div>
      </>
    );
  }

  const contentParagraphs =
    article.content?.split("\n").filter((p) => p.trim() !== "") || [];

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen">
        {article.image_url && (
          <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh]">
            <Image
              src={article.image_url}
              alt={article.title || "Article image"}
              layout="fill"
              objectFit="cover"
              priority
              className="z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>

            <div className="absolute inset-0 z-20 flex flex-col justify-end items-center text-center p-6 md:p-12 text-white">
              <div className="max-w-3xl">
                {article.category && (
                  <Badge
                    variant="outline"
                    className="mb-3 text-sm bg-white/20 border-white/50 text-white backdrop-blur-sm">
                    {article.category}
                  </Badge>
                )}
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-cal mb-4 leading-tight shadow-sm">
                  {article.title}
                </h1>
                <div className="flex flex-wrap justify-center items-center text-sm opacity-90 space-x-4">
                  {article.author_name && (
                    <div className="flex items-center">
                      <UserCircle className="h-4 w-4 mr-1.5" />
                      <span>By {article.author_name}</span>
                    </div>
                  )}
                  {article.created_at && (
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-1.5" />
                      <span>{formatDate(article.created_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-8 text-accent border-accent hover:bg-accent/10 hover:text-accent-dark">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          {!article.image_url && (
            <header className="mb-6 pb-4 border-b border-gray-200">
              {article.category && (
                <Badge
                  variant="outline"
                  className="mb-2 text-sm text-accent border-accent">
                  {article.category}
                </Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-cal">
                {article.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center text-sm text-gray-500 space-x-4">
                {article.author_name && (
                  <div className="flex items-center">
                    <UserCircle className="h-4 w-4 mr-1.5 text-gray-400" />
                    <span>By {article.author_name}</span>
                  </div>
                )}
                {article.created_at && (
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-1.5 text-gray-400" />
                    <span>{formatDate(article.created_at)}</span>
                  </div>
                )}
              </div>
            </header>
          )}

          <article
            className={`bg-white shadow-xl rounded-lg overflow-hidden ${
              article.image_url ? "" : ""
            }`}>
            <div
              className={`p-6 md:p-8 lg:p-10 ${
                !article.image_url ? "pt-0" : ""
              }`}>
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                {contentParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                {contentParagraphs.length === 0 && <p>{article.content}</p>}
              </div>

              {article.tags && article.tags.length > 0 && (
                <footer className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
                    <Tag className="h-4 w-4 mr-2 text-gray-400" /> Tags:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </footer>
              )}
            </div>
          </article>
        </div>
      </div>
      <Footer />
    </>
  );
}

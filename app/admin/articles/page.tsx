"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  addArticle,
  getAllArticles,
  deleteArticleFirestore,
  deleteImageFromCloudinary,
  Article,
  ARTICLE_CATEGORIES,
  ArticleCategory,
} from "@/functions/articleUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  Loader2,
  PlusCircle,
  UploadCloud,
  Edit,
  Trash2,
  Newspaper,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditArticleDialog } from "@/components/admin/EditArticleDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminArticlesPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<ArticleCategory | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [imageInputKey, setImageInputKey] = useState<string>(Date.now().toString());

  useEffect(() => {
    const fetchArticles = async () => {
      setLoadingArticles(true);
      try {
        const fetchedArticles = await getAllArticles();
        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Error fetching articles:", error);
        toast({
          title: "Failed to load articles",
          description: (error as Error).message || "Could not fetch articles.",
          variant: "destructive",
        });
      }
      setLoadingArticles(false);
    };
    fetchArticles();
  }, []);

  const refreshArticlesList = async () => {
    setLoadingArticles(true);
    try {
      const fetchedArticles = await getAllArticles();
      setArticles(fetchedArticles);
    } catch (error) {
      console.error("Error refetching articles:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not reload articles.",
        variant: "destructive",
      });
    }
    setLoadingArticles(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please provide a title and content for the article.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    let uploadedImageUrl: string | undefined = undefined;
    let uploadedImagePublicId: string | undefined = undefined;

    try {
      if (imageFile) {
        const cloudName = "dtb5nuv3m";
        const uploadPreset = "indychat";
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", "articles");
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await response.json();
        if (data.secure_url && data.public_id) {
          uploadedImageUrl = data.secure_url;
          uploadedImagePublicId = data.public_id;
        } else {
          console.warn("Cloudinary upload failed:", data);
          toast({
            title: "Image Upload Failed",
            description: data.error?.message || "Proceeding without image.",
            variant: "default",
          });
        }
      }
      const articleData = {
        title,
        content,
        category: category || undefined,
        image_url: uploadedImageUrl,
        image_public_id: uploadedImagePublicId,
      };
      const newArticle = await addArticle(articleData as any);
      await refreshArticlesList();
      toast({ title: "Article Created", description: `"${title}" published.` });
      setTitle("");
      setContent("");
      setCategory("");
      setImageFile(null);
      setImageInputKey(Date.now().toString());
    } catch (error) {
      toast({
        title: "Failed to create article",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete || !articleToDelete.id) return;
    setLoading(true);
    try {
      if (articleToDelete.image_public_id) {
        await deleteImageFromCloudinary(articleToDelete.image_public_id);
      } else if (articleToDelete.image_url) {
        console.warn(
          "Attempting to delete image using URL, but public_id is preferred. Update deleteImageFromCloudinary if it relies on public_id only."
        );
      }
      await deleteArticleFirestore(articleToDelete.id);
      await refreshArticlesList();
      toast({
        title: "Article Deleted",
        description: `"${articleToDelete.title}" removed.`,
      });
      setArticleToDelete(null);
    } catch (error) {
      toast({
        title: "Failed to delete article",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <div className="flex-col items-center gap-2">
          <h1 className="text-3xl font-bold font-cal text-accent">
            Manage News Articles
          </h1>
          <h5 className="text-sm text-gray-500">
            Create, edit, and delete news articles.
          </h5>
        </div>
      </div>

      <section className="mb-12 bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold font-cal text-accent mb-6">
          Create New Article
        </h2>
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title"
              required
              className="border-gray-300 focus:border-accent focus:ring-accent"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="content"
              className="text-sm font-medium text-gray-700">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article content..."
              rows={10}
              required
              className="border-gray-300 focus:border-accent focus:ring-accent resize-y"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="category"
              className="text-sm font-medium text-gray-700">
              Category
            </Label>
            <Select
              value={category}
              onValueChange={(value) =>
                setCategory(value as ArticleCategory | "")
              }>
              <SelectTrigger className="w-full bg-white border-gray-300 hover:border-accent focus:border-accent focus:ring-accent">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-md">
                {ARTICLE_CATEGORIES.map((cat) => (
                  <SelectItem
                    key={cat}
                    value={cat}
                    className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-800 cursor-pointer">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="imageUpload"
              className="text-sm font-medium text-gray-700">
              Cover Image
            </Label>
            <Input
              id="imageUpload"
              key={imageInputKey}
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImageFile(e.target.files ? e.target.files[0] : null)
              }
              className="border-gray-300 focus:border-accent focus:ring-accent file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
            />
            {imageFile && (
              <div className="mt-1 text-xs text-gray-500">
                Selected: {imageFile.name}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent hover:bg-accent/90 text-white min-w-[150px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Publish Article
                </>
              )}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-semibold font-cal text-accent mb-6">
          Existing Articles
        </h2>
        {loadingArticles ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="ml-3 text-gray-600">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-10 bg-white p-8 rounded-lg shadow-md">
            <Newspaper className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl text-gray-500">No articles found.</p>
            <p className="text-sm text-gray-400 mt-1">
              Create your first article using the form above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-accent">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Category: {article.category || "N/A"} | Created:{" "}
                    {article.created_at
                      ? new Date(article.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:border-accent hover:text-white"
                    onClick={() => {
                      setEditingArticle(article);
                      setIsEditDialogOpen(true);
                    }}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setArticleToDelete(article)}
                        className="text-red-600 border-red-500 hover:bg-red-50 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white shadow-lg border-0">
                      <AlertDialogHeader className="border-b">
                        <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" /> Are you absolutely
                          sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                          This action cannot be undone. This will permanently
                          delete the article "{articleToDelete?.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="border-t pt-4 mt-4 gap-3">
                        <AlertDialogCancel
                          onClick={() => setArticleToDelete(null)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteArticle}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 text-white">
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Delete Article"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editingArticle && (
        <EditArticleDialog
          article={editingArticle}
          isOpen={isEditDialogOpen}
          onOpenChange={(isOpen) => {
            setIsEditDialogOpen(isOpen);
            if (!isOpen) setEditingArticle(null);
          }}
          onArticleUpdated={() => {
            refreshArticlesList();
          }}
        />
      )}
    </div>
  );
}

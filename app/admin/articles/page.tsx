"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  PlusCircle,
  Loader2,
  Trash2,
  Edit3,
  Search,
  AlertCircle,
  ImagePlus,
  XCircle,
} from "lucide-react";
import {
  addArticle,
  getAllArticles,
  deleteArticleFirestore,
  Article,
  deleteImageFromCloudinary,
  ARTICLE_CATEGORIES,
  ArticleCategory,
} from "@/functions/articleUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { EditArticleDialog } from "@/components/admin/EditArticleDialog";

export default function ArticlesAdminPage() {
  const { profile, loading: profileLoading } = useUserProfile();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<ArticleCategory | "">("");
  const [tags, setTags] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageInputKey, setImageInputKey] = useState<string>(
    Date.now().toString()
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedArticles = await getAllArticles();
      setArticles(
        fetchedArticles.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (e: unknown) {
      console.error("Error fetching articles:", e);
      const errorMessage =
        e instanceof Error ? e.message : "Could not load articles.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    if (profile?.id) {
      fetchArticles();
    }
  }, [profile?.id, fetchArticles]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageInputKey(Date.now().toString());
  };

  const handleImageUpload = async (
    file: File
  ): Promise<{ url: string; publicId: string } | null> => {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default_preset"
    );

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      setUploading(false);
      if (data.secure_url && data.public_id) {
        return { url: data.secure_url, publicId: data.public_id };
      }
      setError(
        data.error?.message ||
          "Image upload failed. Response from Cloudinary was not as expected."
      );
      return null;
    } catch (uploadError: unknown) {
      console.error("Upload error:", uploadError);
      const errorMessage =
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed. Please try again.";
      setError(errorMessage);
      setUploading(false);
      return null;
    }
  };

  const handleAddArticle = async () => {
    if (!title || !content || !category) {
      setError("Title, content, and category are required.");
      return;
    }
    if (!profile?.id) {
      setError("User profile not loaded. Cannot publish article.");
      toast({
        title: "Error",
        description: "User profile not available.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    setError(null);
    let imageUrl = "";
    let imagePublicId = "";

    if (imageFile) {
      const uploadResult = await handleImageUpload(imageFile);
      if (uploadResult) {
        imageUrl = uploadResult.url;
        imagePublicId = uploadResult.publicId;
      } else {
        setIsPublishing(false);
        return;
      }
    }

    try {
      await addArticle({
        title,
        content,
        category: category as ArticleCategory,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag !== ""),
        image_url: imageUrl,
        image_public_id: imagePublicId,
      });
      setTitle("");
      setContent("");
      setCategory("");
      setTags("");
      clearImageSelection();
      toast({
        title: "Success!",
        description: "New article has been published.",
      });
      fetchArticles();
    } catch (e: unknown) {
      console.error("Error adding article:", e);
      const errorMessage =
        e instanceof Error ? e.message : "Failed to publish article.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsPublishing(false);
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete || !articleToDelete.id) return;

    setIsDeleting(true);
    try {
      if (articleToDelete.image_public_id) {
        console.log(
          `Attempting to delete image from Cloudinary: ${articleToDelete.image_public_id}`
        );
        await deleteImageFromCloudinary(articleToDelete.image_public_id);
      }

      await deleteArticleFirestore(articleToDelete.id);
      setArticles(articles.filter((art) => art.id !== articleToDelete.id));
      toast({
        title: "Article Deleted",
        description: `\"${articleToDelete.title}\" has been deleted.`,
      });
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
    } catch (e: unknown) {
      console.error("Error deleting article:", e);
      const errorMessage =
        e instanceof Error ? e.message : "Could not delete the article.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsDeleting(false);
  };

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.category &&
        article.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (article.tags &&
        article.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
  );

  const openEditDialog = (article: Article) => {
    setEditingArticle(article);
    setEditDialogOpen(true);
  };

  const handleArticleUpdated = () => {
    fetchArticles();
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="ml-2">Loading user profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-600 text-center max-w-md">
          You must be logged in and have a user profile to manage articles. If
          you believe this is an error, please contact support.
        </p>
      </div>
    );
  }

  if (
    !profile.role ||
    (profile.role !== "admin" && profile.role !== "editor")
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-600 text-center mb-6">
          You do not have the necessary permissions to view this page.
        </p>
        <Button onClick={() => (window.location.href = "/")}>
          Go to Homepage
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-gray-100 mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <PlusCircle className="h-6 w-6 mr-3 text-accent" /> Create New Article
        </h2>

        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-6"
            role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddArticle();
          }}
          className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter article title"
              className="w-full bg-gray-50 border-gray-300 focus:ring-accent focus:border-accent"
              required
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-1">
              Content (Markdown supported)
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article content here..."
              rows={10}
              className="w-full bg-gray-50 border-gray-300 focus:ring-accent focus:border-accent"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select
                value={category}
                onValueChange={(value) =>
                  setCategory(value as ArticleCategory | "")
                }
                required>
                <SelectTrigger className="w-full bg-white border-gray-300 hover:border-accent focus:border-accent text-gray-700">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-md">
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
            <div>
              <label
                htmlFor="tags"
                className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <Input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., technology, community, events"
                className="w-full bg-gray-50 border-gray-300 focus:ring-accent focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="imageFile"
              className="block text-sm font-medium text-gray-700 mb-1">
              Featured Image
            </label>
            <div className="mt-1 flex items-center gap-4 p-3 border-2 border-dashed border-gray-300 rounded-md hover:border-accent transition-colors">
              <label
                htmlFor="imageFile-input"
                className="relative cursor-pointer bg-white rounded-md font-medium text-accent hover:text-accent-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-accent">
                <div className="flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm rounded-md bg-accent text-white hover:bg-accent/90">
                  <ImagePlus className="h-5 w-5 mr-2" />
                  <span>{imageFile ? "Change image" : "Upload an image"}</span>
                </div>
                <input
                  id="imageFile-input"
                  name="imageFile-input"
                  type="file"
                  className="sr-only"
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  onChange={handleImageFileChange}
                  key={imageInputKey}
                />
              </label>
              {imagePreview && (
                <div className="flex items-center gap-2">
                  <div className="relative h-12 w-20 rounded">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      layout="fill"
                      objectFit="contain"
                      className="rounded"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={clearImageSelection}
                    className="p-1 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                    aria-label="Remove image">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              )}
              {!imageFile && (
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF, WEBP up to 5MB.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isPublishing || uploading || !profile?.id}
              className="bg-accent hover:bg-accent/90 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50 disabled:opacity-60">
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Publishing...
                </>
              ) : uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading
                  Image...
                </>
              ) : (
                "Publish Article"
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
          <Search className="h-6 w-6 mr-3 text-accent" /> Manage Articles
        </h2>
        <Input
          type="text"
          placeholder="Search articles by title, content, category, or tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-6 bg-gray-50 border-gray-300 focus:ring-accent focus:border-accent"
        />

        {isLoading && articles.length === 0 ? (
          <div className="text-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-3" />
            <p className="text-gray-500">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            No articles found matching your search, or no articles have been
            published yet.
          </p>
        ) : (
          <div className="space-y-6">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="p-5 bg-gray-50 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-accent mb-1">
                      {article.title}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 mb-2 space-x-3">
                      <span>
                        Category:{" "}
                        <Badge variant="outline" className="font-normal">
                          {article.category}
                        </Badge>
                      </span>
                      <span>
                        By:{" "}
                        <span className="font-medium">
                          {article.author_name || "N/A"}
                        </span>
                      </span>
                      <span>
                        Published:{" "}
                        <span className="font-medium">
                          {new Date(article.created_at).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="mb-2">
                        {article.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="mr-1 mb-1 text-xs font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {article.content}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex sm:flex-col gap-2 mt-2 sm:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(article)}
                      className="w-full sm:w-auto text-accent border-accent hover:bg-accent/10">
                      <Edit3 className="h-4 w-4 mr-1.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setArticleToDelete(article);
                        setDeleteDialogOpen(true);
                      }}
                      className="w-full sm:w-auto text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500">
                      <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                    </Button>
                  </div>
                </div>
                {article.image_url && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="relative max-h-32 h-32 w-full rounded shadow-sm">
                      <Image
                        src={article.image_url}
                        alt={`Image for ${article.title}`}
                        layout="fill"
                        objectFit="contain"
                        className="rounded shadow-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editingArticle && (
        <EditArticleDialog
          article={editingArticle}
          isOpen={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onArticleUpdated={handleArticleUpdated}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Delete Article
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              &quot;{articleToDelete?.title}&quot; article and remove its data
              from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArticle}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Article"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

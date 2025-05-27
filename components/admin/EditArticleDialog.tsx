"use client";

import { useState, useEffect } from "react";
import {
  Article,
  updateArticle,
  deleteImageFromCloudinary,
  ARTICLE_CATEGORIES,
  ArticleCategory,
} from "@/functions/articleUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Loader2, XCircle, UploadCloud } from "lucide-react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditArticleDialogProps {
  article: Article | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onArticleUpdated: () => void;
}

export function EditArticleDialog({
  article,
  isOpen,
  onOpenChange,
  onArticleUpdated,
}: EditArticleDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<ArticleCategory | "">("");
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(
    undefined
  );
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (article) {
      setTitle(article.title || "");
      setContent(article.content || "");
      setCategory(article.category || "");
      setCurrentImageUrl(article.imageUrl || undefined);
      setNewImageFile(null);
      setRemoveCurrentImage(false);
    } else {
      setTitle("");
      setContent("");
      setCategory("");
      setCurrentImageUrl(undefined);
      setNewImageFile(null);
      setRemoveCurrentImage(false);
    }
  }, [article, isOpen]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewImageFile(e.target.files[0]);
      setRemoveCurrentImage(false);
      setCurrentImageUrl(URL.createObjectURL(e.target.files[0]));
    } else {
      setNewImageFile(null);

      setCurrentImageUrl(article?.imageUrl || undefined);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article || !article.id) return;

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Fields",
        description: "Title and Content are required.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    let finalImageUrl: string | undefined | null = article.imageUrl;
    const oldImageUrl = article.imageUrl;

    try {
      if (newImageFile) {
        const cloudName = "dtb5nuv3m";
        const uploadPreset = "indychat";
        const formData = new FormData();
        formData.append("file", newImageFile);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", "articles");

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await response.json();

        if (data.secure_url) {
          finalImageUrl = data.secure_url;

          if (oldImageUrl && oldImageUrl !== finalImageUrl) {
            await deleteImageFromCloudinary(oldImageUrl);
          }
        } else {
          toast({
            title: "New Image Upload Failed",
            description: data.error?.message || "Could not upload new image.",
            variant: "default",
          });

          setIsUpdating(false);
          return;
        }
      } else if (removeCurrentImage && oldImageUrl) {
        await deleteImageFromCloudinary(oldImageUrl);
        finalImageUrl = null;
      }

      const articleUpdateData: Partial<Omit<Article, "id" | "createdAt">> = {
        title,
        content,
        category: category || undefined,
        imageUrl: finalImageUrl === null ? undefined : finalImageUrl,
      };

      await updateArticle(article.id, articleUpdateData);
      toast({
        title: "Article Updated",
        description: `"${title}" has been successfully updated.`,
      });
      onArticleUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating article:", error);
      toast({
        title: "Update Failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-0 shadow-lg sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4 mb-4">
          <DialogTitle className="text-xl font-bold text-accent">
            Edit Article: <span className="font-normal">{article.title}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Make changes to the article details below. For image changes, upload
            a new file or mark the current one for removal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-5 py-2">
          <div className="space-y-1">
            <Label
              htmlFor="edit-title"
              className="text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="border-gray-300 focus:border-accent focus:ring-accent"
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="edit-content"
              className="text-sm font-medium text-gray-700">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              required
              className="border-gray-300 focus:border-accent focus:ring-accent resize-y"
            />
          </div>
          <div className="space-y-1">
            <Label
              htmlFor="edit-category"
              className="text-sm font-medium text-gray-700">
              Category
            </Label>
            <Select value={category} onValueChange={(value) => setCategory(value as ArticleCategory | "")} >
              <SelectTrigger className="w-full bg-white border-gray-300 hover:border-accent focus:border-accent focus:ring-accent">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-md">
                {ARTICLE_CATEGORIES.map((cat) => (
                  <SelectItem
                    key={cat}
                    value={cat}
                    className="text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-800 cursor-pointer"
                  >
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <Label
              htmlFor="edit-imageUpload"
              className="text-sm font-medium text-gray-700">
              Cover Image
            </Label>
            {currentImageUrl && !newImageFile && !removeCurrentImage && (
              <div className="my-2 relative w-full h-48 border rounded-md overflow-hidden">
                <Image
                  src={currentImageUrl}
                  alt="Current cover image"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            )}
            {newImageFile && (
              <div className="my-2 relative w-full h-48 border rounded-md overflow-hidden">
                <Image
                  src={URL.createObjectURL(newImageFile)}
                  alt="New image preview"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            )}
            <Input
              id="edit-imageUpload"
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="border-gray-300 focus:border-accent focus:ring-accent file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
            />
            {currentImageUrl && !newImageFile && (
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="removeCurrentImage"
                  checked={removeCurrentImage}
                  onCheckedChange={(checked) => {
                    setRemoveCurrentImage(Boolean(checked));
                    if (Boolean(checked)) setNewImageFile(null);
                  }}
                />
                <Label
                  htmlFor="removeCurrentImage"
                  className="text-sm font-normal cursor-pointer">
                  Remove current image
                </Label>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 mt-4 gap-3">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-accent hover:bg-accent/90 text-white min-w-[120px]">
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

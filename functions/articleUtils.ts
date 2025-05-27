import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

export const ARTICLE_CATEGORIES = [
  "Emergency",
  "Business",
  "Entertainment",
  "City",
  "Government",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export interface Article {
  id?: string;
  title: string;
  content: string;
  author_id: string;
  author_name?: string;
  image_url?: string;
  image_public_id?: string;
  category?: ArticleCategory | "";
  created_at?: any;
  updated_at?: any;
  slug?: string;
  tags?: string[];
  is_published?: boolean;
  views?: number;
}

export async function addArticle(
  articleData: Omit<
    Article,
    | "id"
    | "created_at"
    | "updated_at"
    | "author_id"
    | "author_name"
    | "views"
    | "is_published"
  > &
    Partial<Pick<Article, "is_published" | "image_url" | "image_public_id">>
): Promise<Article> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated to add article.");
    }

    const dataToSave: any = {
      ...articleData,
      author_id: user.uid,
      author_name: user.displayName || user.email?.split("@")[0] || "Anonymous",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      is_published:
        articleData.is_published !== undefined
          ? articleData.is_published
          : false,
      views: 0,
    };

    Object.keys(dataToSave).forEach(
      (key) => dataToSave[key] === undefined && delete dataToSave[key]
    );

    const docRef = await addDoc(collection(db, "articles"), dataToSave);
    const newArticle = await getArticleById(docRef.id);
    if (!newArticle) {
      throw new Error("Failed to retrieve newly created article.");
    }
    return newArticle;
  } catch (error) {
    console.error("Error adding article: ", error);
    throw error;
  }
}

export async function getAllArticles(): Promise<Article[]> {
  try {
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);

    const articles: Article[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      articles.push({
        id: doc.id,
        title: data.title,
        content: data.content,
        category: data.category,
        image_url: data.image_url,
        image_public_id: data.image_public_id,
        created_at: data.created_at
          ? (data.created_at as Timestamp).toDate().toISOString()
          : undefined,
        updated_at: data.updated_at
          ? (data.updated_at as Timestamp).toDate().toISOString()
          : undefined,
      } as Article);
    });
    return articles;
  } catch (error) {
    console.error("Error fetching articles from Firestore:", error);
    throw new Error("Failed to fetch articles.");
  }
}

export async function getArticleById(id: string): Promise<Article | null> {
  try {
    const articleRef = doc(db, "articles", id);
    const docSnap = await getDoc(articleRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title,
        content: data.content,
        category: data.category,
        image_url: data.image_url,
        image_public_id: data.image_public_id,
        created_at: data.created_at
          ? (data.created_at as Timestamp).toDate().toISOString()
          : undefined,
        updated_at: data.updated_at
          ? (data.updated_at as Timestamp).toDate().toISOString()
          : undefined,
      } as Article;
    } else {
      console.log("No such article found!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching article by ID:", error);
    throw new Error("Failed to fetch article.");
  }
}

export async function updateArticle(
  articleId: string,
  articleData: Partial<Omit<Article, "id" | "author_id" | "created_at">>
): Promise<Article> {
  try {
    const articleRef = doc(db, "articles", articleId);

    const dataToUpdate: any = {
      ...articleData,
      updated_at: serverTimestamp(),
    };

    Object.keys(dataToUpdate).forEach(
      (key) => dataToUpdate[key] === undefined && delete dataToUpdate[key]
    );

    await updateDoc(articleRef, dataToUpdate);
    const updatedDoc = await getDoc(articleRef);
    if (!updatedDoc.exists()) {
      throw new Error(
        "Failed to fetch updated article or article does not exist."
      );
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as Article;
  } catch (error) {
    console.error("Error updating article: ", error);
    throw error;
  }
}

export async function deleteArticleFirestore(articleId: string): Promise<void> {
  try {
    const articleRef = doc(db, "articles", articleId);
    await deleteDoc(articleRef);
  } catch (error) {
    console.error("Error deleting article from Firestore: ", error);
    throw error;
  }
}

export async function deleteImageFromCloudinary(
  publicId: string | undefined
): Promise<void> {
  if (!publicId) {
    console.log("No public_id provided, skipping Cloudinary deletion call.");
    return;
  }

  try {
    const response = await fetch("/api/delete-cloudinary-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(
        "Backend failed to delete Cloudinary image:",
        responseData.message || response.statusText
      );
      throw new Error(
        responseData.message ||
          `Failed to delete image from Cloudinary. Status: ${response.status}`
      );
    }

    console.log(
      "Image deletion successfully processed by backend:",
      responseData.message
    );
  } catch (error) {
    console.error("Error calling backend to delete Cloudinary image:", error);
  }
}

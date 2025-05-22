import { ReactNode, useEffect, useState } from "react";
import { AuthProvider as FirebaseAuthProvider } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User, getIdToken } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          await syncUserWithServer(user);
        } else {
          const isAuthRoute =
            !pathname.startsWith("/login") &&
            !pathname.startsWith("/signup") &&
            !pathname.startsWith("/reset-password") &&
            !pathname.startsWith("/verify") &&
            pathname !== "/";

          const response = await fetch("/api/auth/session");
          const data = await response.json();

          if (!data.authenticated && isAuthRoute) {
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("Error syncing auth state:", error);
      } finally {
        setInitializing(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const syncUserWithServer = async (user: User) => {
    try {
      const idToken = await getIdToken(user, true);

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to create server session");
      }
    } catch (error) {
      console.error("Error creating server session:", error);

      await auth.signOut();
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-gray-500">Loading application...</p>
        </div>
      </div>
    );
  }

  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}

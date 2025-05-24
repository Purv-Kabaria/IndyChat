"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/hooks/useAuth";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
} 
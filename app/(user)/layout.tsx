"use client";

import { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";

export default function UserLayout({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
} 
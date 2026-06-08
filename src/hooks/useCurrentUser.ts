import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";
import type { User } from "@/data/users";

// قراءة المستخدم الحالي من الجلسة (client-only لتفادي عدم تطابق الـ SSR)
export function useCurrentUser(): User | null {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    setUser(getSession()?.user ?? null);
  }, []);
  return user;
}

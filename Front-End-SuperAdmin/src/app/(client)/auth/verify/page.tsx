"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      router.push("/auth/sign-in");
      return;
    }
axios
  .get(`http://localhost:5000/api/verify-email/${token}`)
  .then(() => {
    router.push("/auth/sign-in?verified=true");
  })
  .catch(() => {
    router.push("/auth/sign-in?verified=false");
  });
  }, [searchParams, router]);

  return null;
}

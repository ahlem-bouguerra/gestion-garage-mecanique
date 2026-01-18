import Signin from "../../../../components/Auth/SigninForm";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignIn() {
  return (
    <div className="flex items-start justify-center min-h-screen px-4 pt-24 pb-12">
      <div className="w-full max-w-md rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card p-6 sm:p-8 md:p-10">
        <Suspense fallback={<div>Loading...</div>}>
          <Signin />
        </Suspense>
      </div>
    </div>
  );
}
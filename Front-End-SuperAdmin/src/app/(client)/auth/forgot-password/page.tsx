import ForgotPasswordForm from "@/components/Auth/ForgotPassword";import Signin from "../../../../components/Auth/SigninForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignIn() {
  return (
    <>

      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <div className="w-full max-w-md rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card p-6 sm:p-8 md:p-10">
          <ForgotPasswordForm />
        </div>
      </div>
    </>
  );
}
import type { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "@/components/Auth/ResetPassword";


export const metadata: Metadata = {
  title: "Connexion - Garage Pro",
};

export default function ForgotPassword() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900">
      {/* Industrial Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(45deg, transparent 35%, rgba(255,165,0,0.1) 35%, rgba(255,165,0,0.1) 70%, transparent 70%),
              linear-gradient(-45deg, transparent 35%, rgba(255,165,0,0.05) 35%, rgba(255,165,0,0.05) 70%, transparent 70%)
            `,
            backgroundSize: '30px 30px'
          }}
        ></div>
      </div>

      {/* Animated Background Elements */}


      {/* Main Container - Plus grand cadre */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div>
          {/* Cadre principal englobant */}
          <div className="bg-slate-800/30 backdrop-blur-sm border-2 border-orange-500/40 rounded-3xl p-6 shadow-2xl shadow-orange-500/20">
             <Suspense fallback={<div>Chargement...</div>}>
               <ResetPasswordForm/>
             </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
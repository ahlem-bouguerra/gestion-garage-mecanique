
import SigninForm from "@/components/Auth/SigninForm";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Connexion - Garage Pro",
};

export default function SignIn() {
  
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
        <div className="w-full max-w-[95vw] xl:max-w-[1400px]">
          {/* Cadre principal englobant */}
       

              {/* Section Formulaire - Plus grande */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-lg">
                  {/* Cadre du formulaire */}
                  <div className="relative backdrop-blur-xl bg-slate-800/60 border-2 border-orange-500/50 rounded-3xl p-10 lg:p-12 shadow-2xl shadow-orange-500/20">
                    {/* Metal Border Effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-500/30 via-yellow-500/30 to-red-500/30 opacity-40 blur-sm"></div>


                    <div className="relative z-10">
                      <SigninForm />
                    </div>
                  </div>
                </div>
              </div>

         
            </div>
          </div>
        </div>
  
  );
}
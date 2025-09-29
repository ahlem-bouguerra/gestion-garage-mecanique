import SignupForm from "@/components/Auth/Signup";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Connexion - Garage Pro",
};

export default function SignUp() {
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
          <div className="bg-slate-800/30 backdrop-blur-sm border-2 border-orange-500/40 rounded-3xl p-6 shadow-2xl shadow-orange-500/20">
            <div className="grid lg:grid-cols-2 gap-8 items-stretch min-h-[700px]">

              {/* Section Formulaire - Plus grande */}
              <div className="flex items-center justify-center">
                <div className="w-full max-w-lg">
                  {/* Cadre du formulaire */}
                  <div className="relative backdrop-blur-xl bg-slate-800/60 border-2 border-orange-500/50 rounded-3xl p-10 lg:p-12 shadow-2xl shadow-orange-500/20">
                    {/* Metal Border Effect */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-500/30 via-yellow-500/30 to-red-500/30 opacity-40 blur-sm"></div>


                    <div className="relative z-10">
                      
                      <SignupForm />
                      
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Visuelle - Plus grande avec cadre */}
              <div className="flex items-center justify-center">
                <div className="w-full h-full">
                  {/* Cadre de la section visuelle */}
                  <div className="relative h-full min-h-[600px] backdrop-blur-md bg-slate-800/40 border-2 border-orange-500/40 rounded-3xl p-8 shadow-2xl">

                    {/* Floating Tool Cards */}
                    <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-orange-500/60 to-red-500/60 rounded-3xl backdrop-blur-sm border-2 border-orange-500/50 animate-bounce [animation-duration:4s] flex items-center justify-center shadow-lg">
                      <svg className="w-12 h-12 text-orange-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16v-4h-2v4m8-8H5l-1 6h16l-1-6zM7 8l1-4h8l1 4" />
                      </svg>
                    </div>

                    <div className="absolute -top-4 -right-4 w-28 h-28 bg-gradient-to-br from-yellow-500/60 to-orange-500/60 rounded-2xl backdrop-blur-sm border-2 border-yellow-500/50 animate-bounce [animation-duration:5s] [animation-delay:1s] flex items-center justify-center shadow-lg">
                      <svg className="w-10 h-10 text-yellow-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1h11a1 1 0 001-1z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18V5a2 2 0 114 0v13" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 2h6" />
                      </svg>
                    </div>
                    {/* Main Workshop Image Container - Plus grand */}
                    <div className="relative h-full flex flex-col justify-center">
                      <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-orange-500/20 border-2 border-orange-500/30">
                        <Image
                          src="/images/Sign up.gif"
                          alt="Interface de gestion garage"
                          width={600}
                          height={450}
                          className="w-full h-auto object-cover transition-all duration-700 hover:scale-105"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/40 to-transparent"></div>

                        {/* Overlay avec titre */}

                      </div>


                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
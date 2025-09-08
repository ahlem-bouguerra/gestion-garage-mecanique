"use client";
import { useState } from "react";
import React from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Interface pour les props du SuccessPopup
interface SuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  garagenom: string;
  matriculefiscal?: string;
  email: string;
  phone: string;
}

export default function SignupForm() {
  const [isEmailFocused, setEmailFocused] = useState(false);
  const [isPasswordFocused, setPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [isUsernameFocused, setUsernameFocused] = useState(false);
  const [isGaragenomFocused, setGaragenomFocused] = useState(false);
  const [isMatriculefiscalFocused, setMatriculefiscalFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPhoneFocused, setPhoneFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [garagenom, setGaragenom] = useState('');
  const [matriculefiscal, setMatriculefiscal] = useState(''); // New state for matriculefiscal
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [ConfirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const router = useRouter();

  const togglePasswordVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Composant Popup de succès avec Portal
  const SuccessPopup: React.FC<SuccessPopupProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    // Utiliser createPortal pour rendre le popup dans le body
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        {/* Overlay avec blur */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
        
        {/* Popup Container */}
        <div className="relative bg-white rounded-3xl shadow-2xl p-8 mx-4 max-w-md w-full transform transition-all duration-300 scale-100 ">
          

          {/* Titre */}
          <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            🎉 Inscription réussie !
          </h2>

          {/* Message */}
          <p className="text-gray-600 text-center mb-6 text-lg">
            Votre compte a été créé avec succès
          </p>
          <p className="text-gray-600 text-center mb-6 text-lg">
            Visitez votre boîte mail pour vérifier votre compte
          </p>
          
          {/* Bouton de fermeture */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="relative px-8 py-3 font-semibold text-white uppercase transition-all duration-300 bg-gradient-to-r from-orange-500 to-red-500 rounded-full hover:from-orange-600 hover:to-red-600 hover:scale-105 hover:shadow-lg transform"
            >
              Confirmer
            </button>
          </div>

          {/* Bouton de fermeture en haut à droite */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Éléments décoratifs */}
          
        </div>

        <style jsx>{`
          @keyframes bounce-in {
            0% {
              transform: scale(0.3);
              opacity: 0;
            }
            50% {
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes pulse-scale {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }

          .animate-bounce-in {
            animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }

          .animate-pulse-scale {
            animation: pulse-scale 2s infinite;
          }
        `}</style>
      </div>,
      document.body // Rendre dans le body pour couvrir toute la page
    );
  };
    // Fonction pour vérifier les critères du téléphone tunisien
  const getPhoneCriteria = (phone: string) => {
    // Nettoyer le numéro (enlever espaces, tirets, etc.)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    return {
      hasCorrectLength: cleanPhone.length === 8,
      isNumeric: /^[0-9]+$/.test(cleanPhone),
      startsWithValidPrefix: /^[2459]/.test(cleanPhone), // Numéros tunisiens commencent par 2, 4, 5, ou 9
      isMobileFormat: /^[259]/.test(cleanPhone), // Mobile: 2, 5, 
      isValidTunisianFormat: /^[2459]/.test(cleanPhone) // Tous les formats valides
    };
  };
    const isPhoneValid = (phone: string) => {
    const criteria = getPhoneCriteria(phone);
    return criteria.hasCorrectLength && criteria.isNumeric && criteria.isValidTunisianFormat;
  };
    // Fonction pour formater le numéro de téléphone en temps réel
  const formatPhoneNumber = (value: string) => {
    // Enlever tout ce qui n'est pas un chiffre
    const numbers = value.replace(/\D/g, '');
    
    // Limiter à 8 chiffres
    const truncated = numbers.substring(0, 8);
    
    // Formater : XX XX XX XX
    if (truncated.length >= 2) {
      return truncated.replace(/(\d{2})(\d{3})?(\d{3})?/, (match, p1, p2, p3) => {
        let result = p1;
        if (p2) result += ' ' + p2;
        if (p3) result += ' ' + p3;
        return result;
      });
    }
    
    return truncated;
  };

  // Fonction pour vérifier chaque critère individuellement
  const getPasswordCriteria = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumbers: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };

  const isPasswordStrong = (password: string) => {
    const criteria = getPasswordCriteria(password);
    return Object.values(criteria).every(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!username ||!garagenom || !matriculefiscal || !email || !password || !ConfirmPassword || !phone ) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

      if (!isPhoneValid(phone)) {
      setError("Le numéro de téléphone n'est pas valide.");
      return;
    }

    if (password !== ConfirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!isPasswordStrong(password)) {
      setError('Le mot de passe ne respecte pas tous les critères de sécurité.');
      return;
    }

    setPending(true);

    try {
      // Nettoyer le numéro avant envoi
      const cleanPhone = phone.replace(/\s/g, '');

      const response = await axios.post("http://localhost:5000/api/signup", {
        username,
        garagenom,
        matriculefiscal,
        email,
        password,
        phone: cleanPhone
      });
      
      // Afficher le popup de succès
      setShowSuccessPopup(true);

      console.log("✅ Réponse du back :", response.data);
      
      // Optionnel: Réinitialiser le formulaire
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPhone('')
    
    } catch (err: any) {
      console.error("❌ Erreur lors de l'inscription :", err);
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setPending(false);
    }
  };

  // Composant pour afficher les critères de validation
  const PasswordCriteriaIndicator = () => {
    const criteria = getPasswordCriteria(password);
    
    if (!password) return null;

    return (
      <div className="mt-2 space-y-1">
        <div className={`text-xs flex items-center ${criteria.minLength ? 'text-green-400' : 'text-red-400'}`}>
          {criteria.minLength ? '✓' : '✗'} Au moins 8 caractères
        </div>
        <div className={`text-xs flex items-center ${criteria.hasUpperCase ? 'text-green-400' : 'text-red-400'}`}>
          {criteria.hasUpperCase ? '✓' : '✗'} Une lettre majuscule
        </div>
        <div className={`text-xs flex items-center ${criteria.hasLowerCase ? 'text-green-400' : 'text-red-400'}`}>
          {criteria.hasLowerCase ? '✓' : '✗'} Une lettre minuscule
        </div>
        <div className={`text-xs flex items-center ${criteria.hasNumbers ? 'text-green-400' : 'text-red-400'}`}>
          {criteria.hasNumbers ? '✓' : '✗'} Un chiffre
        </div>
        <div className={`text-xs flex items-center ${criteria.hasSpecialChar ? 'text-green-400' : 'text-red-400'}`}>
          {criteria.hasSpecialChar ? '✓' : '✗'} Un caractère spécial (!@#$%^&*...)
        </div>
      </div>
    );
  };
   // Composant pour afficher les critères de validation du téléphone
  const PhoneCriteriaIndicator = () => {
    const criteria = getPhoneCriteria(phone);
    
    if (!phone) return null;

    return (
      <div className="mt-2 space-y-1">
        <div className={`text-xs flex items-center ${criteria.hasCorrectLength ? 'text-green-400' : 'text-red-400'}`}>
          {criteria.hasCorrectLength ? '✓' : '✗'} Exactement 8 chiffres
        </div>
        <div className={`text-xs flex items-center ${criteria.isNumeric ? 'text-green-400' : 'text-red-400'}`}>
          {criteria.isNumeric ? '✓' : '✗'} Uniquement des chiffres
        </div>
        <div className={`text-xs flex items-center ${criteria.isValidTunisianFormat ? 'text-green-400' : 'text-red-400'}`}>
          {criteria.isValidTunisianFormat ? '✓' : '✗'} Format tunisien valide (commence par 2,4,5,9)
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="w-full max-w-lg">
        <h2 className="mb-10 text-2xl font-bold text-center">Inscription</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Champ Nom */}
          <div className="mb-6">
            <input
              type="text"
              placeholder={isUsernameFocused ? '' : 'Nom'}
              className="w-full px-4 py-2 text-white bg-transparent border-b-2 border-white rounded-none focus:outline-none focus:border-orange-500"
              onFocus={() => setUsernameFocused(true)}
              onBlur={() => setUsernameFocused(false)}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
            />
          </div>
          <div className="mb-6">
            <input
              type="text"
              placeholder={isGaragenomFocused ? '' : 'Garage Nom'}
              className="w-full px-4 py-2 text-white bg-transparent border-b-2 border-white rounded-none focus:outline-none focus:border-orange-500"
              onFocus={() => setGaragenomFocused(true)}
              onBlur={() => setGaragenomFocused(false)}
              value={garagenom}
              onChange={(e) => setGaragenom(e.target.value.toLowerCase())}
            />
          </div>
          <div className="mb-6">
            <input
              type="text"
              placeholder={isMatriculefiscalFocused ? '' : 'Matricule Fiscale'}
              className="w-full px-4 py-2 text-white bg-transparent border-b-2 border-white rounded-none focus:outline-none focus:border-orange-500"
              onFocus={() => setMatriculefiscalFocused(true)}
              onBlur={() => setMatriculefiscalFocused(false)}
              value={matriculefiscal}
              onChange={(e) => setMatriculefiscal(e.target.value.toLowerCase())}
            />
          </div>
 {/* Champ Téléphone avec validation */}
          <div className="relative mb-6">
            <div className="relative">
              <input
                type="tel"
                placeholder={isPhoneFocused ? '' : 'Numéro de téléphone (ex: 12 34 56 78)'}
                className="w-full px-4 py-2 text-white bg-transparent border-b-2 border-white rounded-none focus:outline-none focus:border-orange-500"
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                value={phone}
                onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                maxLength={11} // 8 chiffres + 3 espaces
              />
              
              {/* Icône de téléphone */}
              <div className="absolute top-0 right-0 h-full flex items-center px-3 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
            </div>
            
            {/* Indicateurs de critères de téléphone */}
            <PhoneCriteriaIndicator />
          </div>
          {/* Champ Mot de passe avec indicateurs */}
          <div className="mb-6">
            <div className="relative">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder={isPasswordFocused ? '' : 'Mot de passe'}
                className="w-full px-4 py-2 text-white bg-transparent border-b-2 border-white rounded-none focus:outline-none focus:border-orange-500"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-0 right-0 h-full flex items-center px-3 text-white"
                onClick={togglePasswordVisibility}
              >
                {isPasswordVisible ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Indicateurs de critères de mot de passe */}
            <PasswordCriteriaIndicator />
          </div>

          {/* Champ Confirmer mot de passe */}
          <div className="mb-6">
            <div className="relative">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder={isConfirmPasswordFocused ? '' : 'Confirmer le mot de passe'}
                className="w-full px-4 py-2 text-white bg-transparent border-b-2 border-white rounded-none focus:outline-none focus:border-orange-500"
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
                value={ConfirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-0 right-0 h-full flex items-center px-3 text-white"
                onClick={togglePasswordVisibility}
              >
                {isPasswordVisible ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
              </button>
            </div>
            
            {/* Message de correspondance des mots de passe */}
            {ConfirmPassword && (
              <div className="mt-2">
                {password === ConfirmPassword ? (
                  <div className="text-xs text-green-400 flex items-center">
                    ✓ Les mots de passe correspondent
                  </div>
                ) : (
                  <div className="text-xs text-red-400 flex items-center">
                    ✗ Les mots de passe ne correspondent pas
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Champ Email */}
          <div className="relative mb-6">
            <input
              type="email"
              placeholder={isEmailFocused ? '' : 'Adresse e-mail'}
              className="w-full px-4 py-2 text-white bg-transparent border-b-2 border-white rounded-none focus:outline-none focus:border-orange-500"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
            />
          </div>

          {/* Affichage des erreurs */}
          {error && (
            <div className="flex items-center justify-center mb-6">
              <span className="px-6 py-2 text-white bg-orange-500 rounded">{error}</span>
            </div>
          )}

          {/* Bouton de soumission */}
          <div className="flex flex-col items-center mb-6">
            <button 
              id="registerButton" 
              className="relative w-1/2 px-4 py-2 mt-2 font-medium text-white uppercase transition-colors bg-transparent border-2 border-white before:absolute before:left-0 before:top-0 before:-z-10 before:h-full before:w-full before:origin-top-left before:scale-x-0 before:bg-orange-500 before:transition-transform before:duration-300 before:content-[''] hover:text-white before:hover:scale-x-100" 
              type='submit'
              disabled={pending}
            >
              {pending ? "Inscription en cours..." : "S'inscrire"}
            </button>
          </div>
             <div className="text-center pt-4 border-t border-orange-500/20">
     
      
          <Link 
            href="/auth/sign-in"
            className="group font-semibold text-orange-400 hover:text-orange-300 transition-colors duration-200"
          >
            <span className="relative">
              Sign in
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-400 transition-all duration-300 group-hover:w-full"></span>
            </span>
            <span className="inline-block ml-1 transition-transform duration-200 group-hover:translate-x-1 text-orange-300">
              →
            </span>
          </Link>
       
      </div>
        </form>
        
      </div>
         {/* Popup de succès rendu avec Portal */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        username={username}
        matriculefiscal={matriculefiscal}
        garagenom={garagenom}
        email={email}
        phone={phone}
      />

    </>
  );
}
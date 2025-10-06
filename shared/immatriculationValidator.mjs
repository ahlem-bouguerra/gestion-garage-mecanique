// shared/immatriculationValidator.js

export const IMMATRICULATION_RULES = {
  tunisie: {
    name: 'Tunisie',
    patterns: [
      /^[0-9]{1,4}TUN[0-9]{1,4}$/,
      /^TUN[0-9]{3,6}$/,
      /^[0-9]{1,4}-TUN-[0-9]{1,4}$/,
      /^[0-9]{6,8}$/
    ],
    exemple: '123TUN456 ou TUN12345',
    description: 'Format tunisien standard'
  },
  autre: {
    name: 'Autre pays',
    patterns: [
      /^[A-Z0-9\-]{3,15}$/
    ],
    exemple: 'ABC-123-DE',
    description: 'Format international (3-15 caractères)'
  }
};

export const validateImmatriculation = (immat, countryCode = 'tunisie') => {
  if (!immat || !immat.trim()) {
    return { 
      valid: false, 
      message: 'Immatriculation obligatoire',
      formatted: ''
    };
  }

  const cleanImmat = immat.trim().toUpperCase().replace(/\s/g, '');

  // Validation Tunisie
  if (countryCode === 'tunisie') {
    const rules = IMMATRICULATION_RULES.tunisie;
    const isValid = rules.patterns.some(pattern => pattern.test(cleanImmat));
    
    return {
      valid: isValid,
      message: isValid 
        ? '' 
        : `Format invalide. Exemples: ${rules.exemple}`,
      formatted: cleanImmat
    };
  }

  // Validation autre pays
  if (countryCode === 'autre') {
    // Vérifier si c'est pas en fait un format tunisien
    const isTunisian = IMMATRICULATION_RULES.tunisie.patterns.some(p => p.test(cleanImmat));
    if (isTunisian) {
      return {
        valid: true,
        message: '',
        formatted: cleanImmat,
        detectedCountry: 'tunisie'
      };
    }

    // Validation format international
    if (cleanImmat.length < 3) {
      return { 
        valid: false, 
        message: 'Minimum 3 caractères requis',
        formatted: cleanImmat
      };
    }

    if (cleanImmat.length > 15) {
      return { 
        valid: false, 
        message: 'Maximum 15 caractères autorisés',
        formatted: cleanImmat
      };
    }

    if (!/^[A-Z0-9\-]+$/.test(cleanImmat)) {
      return { 
        valid: false, 
        message: 'Seuls A-Z, 0-9 et - sont autorisés',
        formatted: cleanImmat
      };
    }

    return {
      valid: true,
      message: '',
      formatted: cleanImmat
    };
  }

  return { 
    valid: false, 
    message: 'Pays invalide',
    formatted: cleanImmat
  };
};

export const detectCountryFromImmatriculation = (immat) => {
  const cleanImmat = immat.trim().toUpperCase().replace(/\s/g, '');
  const isTunisian = IMMATRICULATION_RULES.tunisie.patterns.some(p => p.test(cleanImmat));
  return isTunisian ? 'tunisie' : 'autre';
};

// Export par défaut pour compatibilité
export default {
  IMMATRICULATION_RULES,
  validateImmatriculation,
  detectCountryFromImmatriculation
};
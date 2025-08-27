// 📌 Fonction de validation pour numéro tunisien (corrigée)
export const validateTunisianPhone = (phoneNumber) => {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return {
      isValid: false,
      message: 'Le numéro de téléphone est requis'
    };
  }

  // Nettoyer le numéro (supprimer espaces, tirets, parenthèses)
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  
  let numberToValidate = '';
  
  // Extraire le numéro selon le format
  if (/^\+216[0-9]{8}$/.test(cleanNumber)) {
    numberToValidate = cleanNumber.substring(4); // Retirer +216
  } else if (/^216[0-9]{8}$/.test(cleanNumber)) {
    numberToValidate = cleanNumber.substring(3); // Retirer 216
  } else if (/^[0-9]{8}$/.test(cleanNumber)) {
    numberToValidate = cleanNumber;
  } else {
    return {
      isValid: false,
      message: 'Format de numéro invalide. Utilisez le format tunisien (8 chiffres, +216xxxxxxxx ou 216xxxxxxxx)'
    };
  }

  // 📌 VALIDATION DES PRÉFIXES TUNISIENS RÉELS
  const validPrefixes = {
    // Numéros mobiles
    mobile: ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29', // Ooredoo
             '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', // Orange
             '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', // Tunisie Telecom Mobile
             '90', '91', '92', '93', '94', '95', '96', '97', '98', '99'], // Autres mobiles
    
    // Numéros fixes (lignes terrestres)
    landline: ['70', '71', '72', '73', '74', '75', '76', '77', '78', '79'] // Numéros fixes
  };

  const prefix = numberToValidate.substring(0, 2);
  
  // Vérifier si le préfixe est valide (mobile ou fixe)
  const isMobile = validPrefixes.mobile.includes(prefix);
  const isLandline = validPrefixes.landline.includes(prefix);
  
  if (!isMobile && !isLandline) {
    return {
      isValid: false,
      message: `Le préfixe "${prefix}" n'est pas un préfixe tunisien valide. Les préfixes valides sont: ${[...validPrefixes.mobile, ...validPrefixes.landline].join(', ')}`
    };
  }

  // 📌 VALIDATION ANTI-PATTERNS SUSPECTS
  // Rejeter les numéros avec des patterns trop évidents/suspects
  if (isSuspiciousPattern(numberToValidate)) {
    return {
      isValid: false,
      message: 'Ce numéro semble suspect (chiffres répétés, séquence, etc.). Veuillez saisir un numéro réel.'
    };
  }

  return {
    isValid: true,
    cleanNumber: numberToValidate,
    type: isMobile ? 'mobile' : 'landline',
    operator: getOperator(prefix),
    message: `Numéro ${isMobile ? 'mobile' : 'fixe'} valide`
  };
};

// 📌 Fonction pour détecter les patterns suspects
const isSuspiciousPattern = (number) => {
  // Vérifier si tous les chiffres sont identiques (22222222, 55555555, etc.)
  if (/^(.)\1{7}$/.test(number)) {
    return true;
  }
  
  // Vérifier les séquences croissantes (12345678, 23456789, etc.)
  let isAscending = true;
  for (let i = 1; i < number.length; i++) {
    if (parseInt(number[i]) !== parseInt(number[i-1]) + 1) {
      isAscending = false;
      break;
    }
  }
  if (isAscending) return true;
  
  // Vérifier les séquences décroissantes (87654321, 98765432, etc.)
  let isDescending = true;
  for (let i = 1; i < number.length; i++) {
    if (parseInt(number[i]) !== parseInt(number[i-1]) - 1) {
      isDescending = false;
      break;
    }
  }
  if (isDescending) return true;
  
  // Vérifier les patterns alternés évidents (12121212, 01010101, etc.)
  if (/^(.{2})\1{3}$/.test(number)) {
    return true;
  }
  
  // Vérifier si c'est que des 0 ou des 1 (patterns trop simples)
  if (/^[01]+$/.test(number)) {
    return true;
  }
  
  return false;
};

// 📌 Fonction helper pour identifier l'opérateur
const getOperator = (prefix) => {
  const prefixNum = parseInt(prefix);
  
  if (prefixNum >= 20 && prefixNum <= 29) return 'Ooredoo';
  if (prefixNum >= 40 && prefixNum <= 49) return 'Orange';
  if (prefixNum >= 50 && prefixNum <= 59) return 'Tunisie Telecom Mobile';
  if (prefixNum >= 90 && prefixNum <= 99) return 'Autres mobiles';
  if (prefixNum >= 70 && prefixNum <= 79) return 'Tunisie Telecom (fixe)';
  
  return 'Inconnu';
};

// 📌 Middleware pour valider avant création/modification
export const validatePhoneMiddleware = (req, res, next) => {
  if (req.body.telephone) {
    const validation = validateTunisianPhone(req.body.telephone);
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.message
      });
    }
    
    // Normaliser le numéro (garder seulement les 8 chiffres)
    req.body.telephone = validation.cleanNumber;
  }
  
  next();
};


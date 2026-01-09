# Corrections Responsive - Page par Page

## 🔧 Corrections à Appliquer

### 1. Dashboard Réservations (`dashboard-reservation/index.tsx`)

#### ✅ Déjà Bon
- Grid responsive: `grid-cols-1 md:grid-cols-4`
- Padding responsive: `px-4 sm:px-6 lg:px-8`
- Grid contenu: `grid-cols-1 lg:grid-cols-2`

#### 🔧 À Corriger

**Bouton flottant:**
```tsx
// AVANT
className="fixed bottom-6 right-6 z-50 ..."

// APRÈS
className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 ..."
```

**Cartes statistiques:**
```tsx
// AVANT
className="bg-white rounded-lg shadow p-6"

// APRÈS
className="bg-white rounded-lg shadow p-4 sm:p-6"
```

**Texte dans cartes:**
```tsx
// AVANT
className="text-2xl font-bold text-gray-900"

// APRÈS
className="text-xl sm:text-2xl font-bold text-gray-900"
```

**Titres de sections:**
```tsx
// AVANT
className="text-xl font-bold text-gray-900"

// APRÈS
className="text-lg sm:text-xl font-bold text-gray-900"
```

---

### 2. Gestion Devis (`devis/index.tsx`)

#### 🔧 À Corriger

**Tableau des devis:**
```tsx
// AVANT
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">

// APRÈS
<div className="overflow-x-auto -mx-4 sm:mx-0">
  <div className="inline-block min-w-full align-middle sm:px-0">
    <table className="min-w-full divide-y divide-gray-200">
```

**En-têtes de colonnes:**
```tsx
// AVANT
className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"

// APRÈS
className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
```

**Cellules du tableau:**
```tsx
// AVANT
className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"

// APRÈS
className="px-3 sm:px-6 py-4 text-sm font-medium text-gray-900"
// Retirer whitespace-nowrap pour permettre le wrap sur mobile
```

**Modale de détails:**
```tsx
// AVANT
className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto"

// APRÈS
className="bg-white rounded-lg shadow-xl w-[95vw] sm:w-full sm:max-w-4xl m-2 sm:m-4 max-h-[95vh] sm:max-h-screen overflow-y-auto"
```

---

### 3. Fiche Client (`FicheCLient/index.tsx`)

#### 🔧 À Corriger

**Grid de recherche et filtres:**
```tsx
// Chercher et remplacer les grids fixes par:
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
```

**Cards client:**
```tsx
// S'assurer que les cards utilisent:
className="bg-white rounded-lg shadow p-4 sm:p-6"
```

**Tableaux d'historique:**
```tsx
// Ajouter wrapper avec overflow:
<div className="overflow-x-auto -mx-4 sm:mx-0">
  <table className="min-w-full ...">
```

---

### 4. Gestion Factures (`gestion-facture/index.tsx`)

#### 🔧 À Corriger

**Stats cards:**
```tsx
// Utiliser grid responsive:
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
```

**Tableau factures:**
```tsx
// Même pattern que devis:
<div className="overflow-x-auto -mx-4 sm:mx-0">
```

---

### 5. Gestion Ordres (`gestion-ordres/index.tsx`)

#### 🔧 À Corriger

**Container principal:**
```tsx
// AVANT
className="min-h-screen p-6"
className="max-w-20xl mx-auto"

// APRÈS
className="min-h-screen p-4 sm:p-6"
className="max-w-7xl mx-auto" // Corriger max-w-20xl qui n'existe pas
```

**Tabs navigation:**
```tsx
// AVANT
className="flex space-x-8 px-6"

// APRÈS
className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto"
```

---

### 6. Gestion Mécaniciens (`gestion-mecanicien/`)

#### 🔧 À Corriger

**Tabs:**
```tsx
// S'assurer que les tabs sont scrollables sur mobile:
className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-2"
```

**Formulaires:**
```tsx
// Grid responsive:
className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
```

---

## 📋 Checklist Générale

Pour chaque page, vérifier:

- [ ] Padding responsive: `px-4 sm:px-6 lg:px-8`
- [ ] Textes responsive: `text-sm sm:text-base lg:text-lg`
- [ ] Grids responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- [ ] Tableaux avec `overflow-x-auto`
- [ ] Modales responsive: `w-[95vw] sm:w-auto sm:max-w-...`
- [ ] Boutons avec tailles adaptatives
- [ ] Espacements: `gap-4 sm:gap-6`
- [ ] Images avec `w-full h-auto`

---

## 🚀 Plan d'Action

1. Corriger Dashboard Réservations (priorité haute)
2. Corriger tableaux dans Devis et Factures
3. Corriger formulaires dans toutes les pages
4. Corriger modales et popups
5. Tester sur différentes tailles d'écran

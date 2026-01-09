import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Classes Tailwind pour responsive
const responsiveClasses = {
  mobile: ['sm:', 'md:', 'lg:', 'xl:', '2xl:'],
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

// Classes problématiques communes
const problematicPatterns = [
  /w-\[.*\]/, // Largeurs fixes
  /h-\[.*\]/, // Hauteurs fixes
  /min-w-\[.*\]/, // Largeurs minimales fixes
  /max-w-\[.*\]/, // Largeurs maximales fixes (sauf si avec responsive)
  /px-\[.*\]/, // Padding fixes
  /py-\[.*\]/, // Padding fixes
  /text-\[.*\]/, // Tailles de texte fixes
];

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const issues = [];
    let hasResponsiveClasses = false;
    let hasMobileFirst = false;
    
    lines.forEach((line, index) => {
      // Vérifier les classes responsive
      if (line.match(/sm:|md:|lg:|xl:|2xl:/)) {
        hasResponsiveClasses = true;
        if (line.match(/sm:/)) hasMobileFirst = true;
      }
      
      // Vérifier les patterns problématiques
      problematicPatterns.forEach(pattern => {
        if (pattern.test(line) && !line.match(/sm:|md:|lg:|xl:|2xl:/)) {
          issues.push({
            line: index + 1,
            content: line.trim(),
            issue: 'Valeur fixe sans responsive'
          });
        }
      });
      
      // Vérifier les largeurs fixes sans responsive
      if (line.match(/w-\d+|w-full|w-screen/) && !line.match(/sm:|md:|lg:|xl:|2xl:/) && line.includes('className')) {
        const hasFlex = line.includes('flex') || content.split('\n').slice(Math.max(0, index-5), index).some(l => l.includes('flex'));
        if (!hasFlex && !line.includes('max-w')) {
          issues.push({
            line: index + 1,
            content: line.trim(),
            issue: 'Largeur fixe sans responsive - considérer md:w-...'
          });
        }
      }
    });
    
    return {
      file: filePath,
      hasResponsiveClasses,
      hasMobileFirst,
      issues,
      lineCount: lines.length
    };
  } catch (error) {
    return {
      file: filePath,
      error: error.message
    };
  }
}

function findPageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      findPageFiles(filePath, fileList);
    } else if (file === 'page.tsx' || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

async function analyzeResponsive() {
  const appDir = path.join(__dirname, '..', 'src', 'app');
  const componentDir = path.join(__dirname, '..', 'src', 'components');
  
  console.log('🔍 Analyse du responsive design');
  console.log('='.repeat(70));
  console.log('\n📁 Recherche des fichiers...\n');
  
  const pageFiles = findPageFiles(appDir);
  const componentFiles = findPageFiles(componentDir);
  
  console.log(`✅ ${pageFiles.length} pages trouvées`);
  console.log(`✅ ${componentFiles.length} composants trouvés\n`);
  
  const results = {
    pages: [],
    components: [],
    summary: {
      total: 0,
      withResponsive: 0,
      withIssues: 0,
      issuesCount: 0
    }
  };
  
  // Analyser les pages
  console.log('📄 Analyse des pages...\n');
  pageFiles.forEach(file => {
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    const analysis = analyzeFile(file);
    results.pages.push(analysis);
    results.summary.total++;
    if (analysis.hasResponsiveClasses) results.summary.withResponsive++;
    if (analysis.issues && analysis.issues.length > 0) {
      results.summary.withIssues++;
      results.summary.issuesCount += analysis.issues.length;
    }
  });
  
  // Analyser les composants principaux
  console.log('🧩 Analyse des composants principaux...\n');
  const importantComponents = [
    'dashboard-reservation',
    'devis',
    'FicheCLient',
    'Fiche-Voiture',
    'gestion-facture',
    'gestion-ordres',
    'gestion-mecanicien'
  ];
  
  importantComponents.forEach(compName => {
    const compFiles = componentFiles.filter(f => f.includes(compName));
    compFiles.forEach(file => {
      const relativePath = path.relative(path.join(__dirname, '..'), file);
      const analysis = analyzeFile(file);
      results.components.push(analysis);
    });
  });
  
  // Afficher les résultats
  console.log('\n' + '='.repeat(70));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(70));
  console.log(`Total de fichiers analysés: ${results.summary.total}`);
  console.log(`Fichiers avec classes responsive: ${results.summary.withResponsive}`);
  console.log(`Fichiers avec problèmes: ${results.summary.withIssues}`);
  console.log(`Total de problèmes trouvés: ${results.summary.issuesCount}`);
  
  // Afficher les pages avec problèmes
  if (results.summary.issuesCount > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('⚠️  PAGES AVEC PROBLÈMES POTENTIELS');
    console.log('='.repeat(70));
    
    results.pages
      .filter(p => p.issues && p.issues.length > 0)
      .forEach(page => {
        const relativePath = path.relative(path.join(__dirname, '..', 'src'), page.file);
        console.log(`\n📄 ${relativePath}`);
        console.log(`   ${page.issues.length} problème(s) trouvé(s)`);
        page.issues.slice(0, 3).forEach(issue => {
          console.log(`   Ligne ${issue.line}: ${issue.issue}`);
          console.log(`   → ${issue.content.substring(0, 80)}...`);
        });
        if (page.issues.length > 3) {
          console.log(`   ... et ${page.issues.length - 3} autre(s)`);
        }
      });
  }
  
  // Afficher les pages sans responsive
  const pagesWithoutResponsive = results.pages.filter(p => !p.hasResponsiveClasses && !p.error);
  if (pagesWithoutResponsive.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('📱 PAGES SANS CLASSES RESPONSIVE DÉTECTÉES');
    console.log('='.repeat(70));
    pagesWithoutResponsive.forEach(page => {
      const relativePath = path.relative(path.join(__dirname, '..', 'src'), page.file);
      console.log(`   - ${relativePath}`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Analyse terminée\n');
}

analyzeResponsive().catch(console.error);

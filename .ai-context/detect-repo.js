/**
 * AI Assistant Repository Detection
 * 
 * This script detects what repository we're in and loads the appropriate context.
 * It's a safeguard to ensure we always load the correct context for the current project.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Function to get the git remote URL
function getGitRemoteUrl() {
  try {
    const remoteUrl = execSync('git config --get remote.origin.url', { cwd: projectRoot }).toString().trim();
    return remoteUrl;
  } catch (error) {
    return null;
  }
}

// Function to get the repository name from package.json
function getRepoNameFromPackage() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    return packageJson.name || null;
  } catch (error) {
    return null;
  }
}

// Function to check for specific files that would identify this repository
function checkForSignatureFiles() {
  const signatures = {
    'tritium-v4': [
      { path: 'src/components/CustomerSkillApplicationsList.tsx', weight: 3 },
      { path: 'src/components/ui/UnifiedTimeline.tsx', weight: 2 },
      { path: 'context.json', weight: 1 }
    ],
    // Add other repositories as needed
  };
  
  const matches = {};
  
  for (const [repo, files] of Object.entries(signatures)) {
    matches[repo] = 0;
    
    for (const file of files) {
      if (fs.existsSync(path.join(projectRoot, file.path))) {
        matches[repo] += file.weight;
      }
    }
  }
  
  // Find the repository with the highest match score
  let bestMatch = null;
  let highestScore = 0;
  
  for (const [repo, score] of Object.entries(matches)) {
    if (score > highestScore) {
      highestScore = score;
      bestMatch = repo;
    }
  }
  
  return bestMatch;
}

// Main detection logic
function detectRepository() {
  // Try multiple methods to identify the repository
  const methods = [
    { name: 'Package.json', fn: getRepoNameFromPackage },
    { name: 'Git Remote', fn: getGitRemoteUrl },
    { name: 'Signature Files', fn: checkForSignatureFiles }
  ];
  
  const results = {};
  
  for (const method of methods) {
    const result = method.fn();
    results[method.name] = result;
    console.log(`${method.name}: ${result || 'Unknown'}`);
  }
  
  // Decision logic
  if (results['Signature Files'] === 'tritium-v4' || 
      (results['Package.json'] === 'skill-customer-management')) {
    return 'tritium-v4';
  }
  
  // Add other repository detection logic as needed
  
  return 'unknown';
}

// Detect and load the appropriate context
const repoName = detectRepository();
console.log(`\nDetected repository: ${repoName}`);

if (repoName === 'tritium-v4') {
  console.log('\n✅ Context for tritium-v4 repository is available.');
  console.log('📚 Run `npm run ai:context` to load it.');
} else {
  console.log('\n⚠️ Unable to confidently identify this repository.');
  console.log('📚 No context is available. Contact the repository owner for assistance.');
}

export default { repoName }; 
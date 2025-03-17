#!/usr/bin/env node

/**
 * AI Assistant Help Script
 * 
 * Displays all available AI assistant tools and commands.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Read package.json to find AI scripts
const packageJsonPath = path.join(projectRoot, 'package.json');
let aiScripts = {};

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Extract scripts that start with "ai:"
  Object.entries(packageJson.scripts || {}).forEach(([name, command]) => {
    if (name.startsWith('ai:')) {
      aiScripts[name] = command;
    }
  });
} catch (error) {
  console.error(chalk.red(`Error reading package.json: ${error.message}`));
}

// Read context directory to find available files
const contextFiles = [];
try {
  const files = fs.readdirSync(__dirname);
  files.forEach(file => {
    if (file.endsWith('.md') && !file.startsWith('.')) {
      const filePath = path.join(__dirname, file);
      const stats = fs.statSync(filePath);
      
      // Read first line to get title
      const content = fs.readFileSync(filePath, 'utf8');
      const firstLine = content.split('\n')[0];
      const title = firstLine.replace(/^#+ /, '').trim();
      
      contextFiles.push({
        name: file,
        size: stats.size,
        title,
        lastModified: stats.mtime
      });
    }
  });
} catch (error) {
  console.error(chalk.red(`Error reading context directory: ${error.message}`));
}

// Display header
console.log(chalk.bgCyan.black('\n🤖  AI ASSISTANT HELP CENTER 🤖\n'));

// Display available scripts
console.log(chalk.yellow('📜 Available Commands:'));
if (Object.keys(aiScripts).length === 0) {
  console.log(chalk.gray('  No AI-related scripts found in package.json'));
} else {
  Object.entries(aiScripts).forEach(([name, command]) => {
    console.log(chalk.green(`  npm run ${name}`));
    console.log(chalk.gray(`    ${command}`));
    
    // Add description based on command name
    switch (name) {
      case 'ai:context':
        console.log(chalk.white('    Loads all context files for the AI assistant'));
        break;
      case 'ai:insight':
        console.log(chalk.white('    Captures development insights interactively'));
        break;
      case 'ai:get-insight':
        console.log(chalk.white('    Retrieves and displays insights (optional search term)'));
        break;
      case 'ai:task':
        console.log(chalk.white('    Displays current active tasks from the task tracking file'));
        break;
      default:
        // No specific description available
        break;
    }
    console.log();
  });
}

// Display available context files
console.log(chalk.yellow('📚 Available Context Files:'));
if (contextFiles.length === 0) {
  console.log(chalk.gray('  No context files found'));
} else {
  contextFiles.sort((a, b) => a.name.localeCompare(b.name));
  
  contextFiles.forEach(file => {
    console.log(chalk.green(`  ${file.name}`));
    console.log(chalk.white(`    ${file.title}`));
    console.log(chalk.gray(`    Last modified: ${file.lastModified.toLocaleDateString()} ${file.lastModified.toLocaleTimeString()}`));
    console.log(chalk.gray(`    Size: ${Math.round(file.size / 1024)}KB`));
    console.log();
  });
}

// Quick Start Guide
console.log(chalk.yellow('🚀 Quick Start:'));
console.log(chalk.white('  1. Run ') + chalk.green('npm run ai:context') + chalk.white(' to load all context files'));
console.log(chalk.white('  2. Check current tasks with ') + chalk.green('npm run ai:task'));
console.log(chalk.white('  3. Capture new insights with ') + chalk.green('npm run ai:insight'));
console.log(chalk.white('  4. Review specific information with ') + chalk.green('npm run ai:get-insight "search term"'));
console.log();

// File path reference
console.log(chalk.yellow('📂 Context Directory:'));
console.log(chalk.gray(`  ${__dirname}`));
console.log();

console.log(chalk.bgGreen.black(' Thanks for using the AI Assistant System! '));
console.log(); 
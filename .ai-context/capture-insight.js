#!/usr/bin/env node

/**
 * Insight Capture Script
 * 
 * This script captures development insights and adds them to the insights file.
 * Usage: node capture-insight.js "Title of insight" "Description of insight" "Component or file where discovered"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import chalk from 'chalk';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const insightsFile = path.join(__dirname, '07_INSIGHTS.md');

// Create an interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get current date
const currentDate = new Date().toISOString().split('T')[0];

// Categories for insights
const categories = [
  '🧠 Architecture Insights',
  '🔧 Technical Insights',
  '🏗️ Implementation Insights',
  '🔍 Debugging Insights',
  '🧪 Testing Insights',
  '📝 Other Insights'
];

// Function to add an insight to the file
async function addInsight(title, description, discoveredIn, category) {
  // Read existing insights
  let content = '';
  try {
    content = fs.readFileSync(insightsFile, 'utf8');
  } catch (error) {
    console.error('Error reading insights file:', error);
    process.exit(1);
  }

  // Format the new insight
  const newInsight = `
### Insight: ${title}

**Date**: ${currentDate}  
**Discovered In**: \`${discoveredIn}\`

**Description**:  
${description}
`;

  // Find the category section to update
  const categoryHeading = `## ${category}`;
  const categoryIndex = content.indexOf(categoryHeading);

  if (categoryIndex === -1) {
    console.error(`Category "${category}" not found in insights file.`);
    process.exit(1);
  }

  // Find the next category heading or end of file
  let nextCategoryIndex = -1;
  for (const cat of categories) {
    const heading = `## ${cat}`;
    const index = content.indexOf(heading, categoryIndex + categoryHeading.length);
    if (index !== -1 && (nextCategoryIndex === -1 || index < nextCategoryIndex)) {
      nextCategoryIndex = index;
    }
  }

  // Insert the new insight
  let updatedContent;
  if (nextCategoryIndex === -1) {
    // Add at the end of the file
    updatedContent = content + newInsight;
  } else {
    // Insert before the next category
    updatedContent = content.slice(0, nextCategoryIndex) + newInsight + content.slice(nextCategoryIndex);
  }

  // Write the updated content back to the file
  fs.writeFileSync(insightsFile, updatedContent, 'utf8');
  console.log(chalk.green(`✅ Insight "${title}" added to ${category} category!`));
}

// Interactive prompts
console.log(chalk.cyan('📝 Insight Capture Tool\n'));

async function promptUser() {
  return new Promise((resolve) => {
    rl.question(chalk.yellow('Title of insight: '), (title) => {
      if (!title) {
        console.log(chalk.red('Title is required.'));
        return promptUser().then(resolve);
      }

      rl.question(chalk.yellow('Component or file where discovered: '), (discoveredIn) => {
        if (!discoveredIn) {
          console.log(chalk.red('Discovery location is required.'));
          return promptUser().then(resolve);
        }

        console.log(chalk.yellow('\nDescription of insight (type "END" on a new line when finished):'));
        let description = '';
        
        // Handle multi-line input
        const descHandler = (line) => {
          if (line.trim() === 'END') {
            rl.removeListener('line', descHandler);
            
            // Prompt for category
            console.log(chalk.yellow('\nSelect category:'));
            categories.forEach((cat, index) => {
              console.log(`${index + 1}. ${cat}`);
            });
            
            rl.question(chalk.yellow('Category number: '), async (catNum) => {
              const categoryIndex = parseInt(catNum) - 1;
              if (isNaN(categoryIndex) || categoryIndex < 0 || categoryIndex >= categories.length) {
                console.log(chalk.red('Invalid category number.'));
                rl.close();
                return promptUser().then(resolve);
              }
              
              const category = categories[categoryIndex];
              await addInsight(title, description, discoveredIn, category);
              
              rl.question(chalk.yellow('\nAdd another insight? (y/n): '), (answer) => {
                if (answer.toLowerCase() === 'y') {
                  promptUser().then(resolve);
                } else {
                  console.log(chalk.green('\nInsights captured successfully!'));
                  rl.close();
                  resolve();
                }
              });
            });
          } else {
            description += line + '\n';
          }
        };
        
        rl.on('line', descHandler);
      });
    });
  });
}

// Command line arguments handling
const args = process.argv.slice(2);
if (args.length >= 3) {
  // Direct input from command line
  const title = args[0];
  const description = args[1];
  const discoveredIn = args[2];
  const category = args[3] || categories[0];
  
  addInsight(title, description, discoveredIn, category).then(() => {
    console.log(chalk.green('Insight added successfully!'));
    process.exit(0);
  });
} else {
  // Interactive mode
  promptUser().then(() => {
    process.exit(0);
  });
}

// Handle clean exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\nInsight capture canceled.'));
  rl.close();
  process.exit(0);
}); 
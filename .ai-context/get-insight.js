#!/usr/bin/env node

/**
 * Insight Retrieval Script
 * 
 * This script retrieves and displays a specific insight by title or lists all insights.
 * Usage: node get-insight.js [search term]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const insightsFile = path.join(__dirname, '07_INSIGHTS.md');

// Get search term from command line args
const searchTerm = process.argv.slice(2).join(' ').toLowerCase();

// Read insights file
let content;
try {
  content = fs.readFileSync(insightsFile, 'utf8');
} catch (error) {
  console.error(chalk.red(`Error reading insights file: ${error.message}`));
  process.exit(1);
}

// Function to extract insights from content
function extractInsights(content) {
  const insights = [];
  
  // Find all insight sections
  const insightRegex = /### Insight: (.+?)(?=\n\n### Insight:|\n\n## |$)/gs;
  let match;
  
  while ((match = insightRegex.exec(content)) !== null) {
    const insightText = match[0];
    const titleMatch = insightText.match(/### Insight: (.+?)(?=\n)/);
    const title = titleMatch ? titleMatch[1] : 'Unknown';
    
    const dateMatch = insightText.match(/\*\*Date\*\*: (.+?)(?=\n|\s\s)/);
    const date = dateMatch ? dateMatch[1] : 'Unknown';
    
    const locationMatch = insightText.match(/\*\*Discovered In\*\*: `(.+?)`/);
    const location = locationMatch ? locationMatch[1] : 'Unknown';
    
    // Extract description (everything after "Description" until the next section)
    const descriptionMatch = insightText.match(/\*\*Description\*\*:\s+(.+?)(?=\n\n\*\*|$)/s);
    const description = descriptionMatch 
      ? descriptionMatch[1].trim() 
      : 'No description available';
    
    // Determine category based on context
    let category = 'Unknown';
    let categoryPosition = content.lastIndexOf('## ', match.index);
    if (categoryPosition !== -1) {
      const categoryText = content.substring(categoryPosition, match.index);
      const categoryMatch = categoryText.match(/## ([^\n]+)/);
      if (categoryMatch) {
        category = categoryMatch[1].trim();
      }
    }
    
    insights.push({
      title,
      date,
      location,
      description,
      category,
      fullText: match[0]
    });
  }
  
  return insights;
}

const insights = extractInsights(content);

// If no search term, list all insights
if (!searchTerm) {
  console.log(chalk.cyan('\n📚 All Insights:\n'));
  
  const categories = {};
  
  // Group insights by category
  insights.forEach(insight => {
    if (!categories[insight.category]) {
      categories[insight.category] = [];
    }
    categories[insight.category].push(insight);
  });
  
  // Print insights by category
  Object.keys(categories).forEach(category => {
    console.log(chalk.yellow(`\n${category}:`));
    categories[category].forEach(insight => {
      console.log(`  • ${chalk.green(insight.title)} ${chalk.gray(`(${insight.date}, ${insight.location})`)}`);
    });
  });
  
  console.log(chalk.cyan(`\nTotal: ${insights.length} insights\n`));
  console.log(chalk.gray('To view a specific insight, provide a search term: node get-insight.js "Timeline Data Flow"'));
} else {
  // Search for insights matching the search term
  const matchingInsights = insights.filter(insight => 
    insight.title.toLowerCase().includes(searchTerm) ||
    insight.description.toLowerCase().includes(searchTerm)
  );
  
  if (matchingInsights.length === 0) {
    console.log(chalk.yellow(`\nNo insights found matching "${searchTerm}".`));
  } else {
    console.log(chalk.cyan(`\n📚 Found ${matchingInsights.length} insight(s) matching "${searchTerm}":\n`));
    
    matchingInsights.forEach((insight, index) => {
      console.log(chalk.green(`${index + 1}. ${insight.title}`));
      console.log(chalk.gray(`   Category: ${insight.category}`));
      console.log(chalk.gray(`   Date: ${insight.date}`));
      console.log(chalk.gray(`   Discovered In: ${insight.location}`));
      console.log(chalk.white(`\n   ${insight.description.replace(/\n/g, '\n   ')}\n`));
    });
  }
} 
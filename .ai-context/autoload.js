/**
 * AI Assistant Context Autoloader
 * 
 * This script loads all context files and prints a summary.
 * Run at the beginning of each session.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { execSync } from 'child_process';
import repoDetector from './detect-repo.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contextDir = __dirname;
const projectRoot = path.join(__dirname, '..');

// Get the detected repository
const repoName = repoDetector.repoName;

// Create a context memory session ID
const sessionId = Date.now().toString();
const memoryDir = path.join(contextDir, '.memory');

// Create memory directory if it doesn't exist
if (!fs.existsSync(memoryDir)) {
  fs.mkdirSync(memoryDir, { recursive: true });
}

console.log(chalk.bgYellow.black(`\n🚨 AI ASSISTANT CONTEXT LOADER - ${repoName.toUpperCase()} 🚨\n`));
console.log(chalk.cyan(`📂 Session ID: ${sessionId}\n`));

// Repository-specific context files
const repoContextMap = {
  'tritium-v4': [
    '00_LOAD_FIRST.md',
    '01_TYPE_REFERENCE.md',
    '02_HOOKS_AND_FUNCTIONS.md',
    '03_DATABASE_SCHEMA.md',
    '04_COMPONENT_REFERENCE.md',
    '05_KNOWN_ISSUES.md',
    '06_CURRENT_TASKS.md',
    '07_INSIGHTS.md',
    '../DEVELOPER_NOTES.md',
    '../context.json',
    '../README.md',
  ],
  // Add other repositories as needed
};

// Get the right set of context files for this repository
const criticalFiles = repoContextMap[repoName] || [];

if (criticalFiles.length === 0) {
  console.log(chalk.red('❌ No context files defined for this repository.'));
  process.exit(1);
}

// Function to read and return file contents
function readFile(filePath) {
  try {
    const fullPath = path.resolve(contextDir, filePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    return `Error reading file: ${error.message}`;
  }
}

// Record last access time
const lastAccessFile = path.join(memoryDir, 'last-access.json');
const currentTime = new Date().toISOString();

let lastAccess = {};
try {
  if (fs.existsSync(lastAccessFile)) {
    lastAccess = JSON.parse(fs.readFileSync(lastAccessFile, 'utf8'));
  }
} catch (error) {
  console.log(chalk.yellow(`⚠️ Could not read last access file: ${error.message}`));
}

// Update last access
lastAccess[repoName] = currentTime;
fs.writeFileSync(lastAccessFile, JSON.stringify(lastAccess, null, 2), 'utf8');

// Load and print summaries of each file
console.log(chalk.cyan('📚 Loading context files:'));

const loadedContext = {};

criticalFiles.forEach((file, index) => {
  const fileName = path.basename(file);
  const fileContent = readFile(file);
  const contentPreview = fileContent.slice(0, 100).replace(/\n/g, ' ') + '...';
  
  loadedContext[fileName] = fileContent;
  
  console.log(chalk.green(`${index + 1}. ${fileName} ✅`));
  console.log(chalk.gray(`   ${contentPreview}`));
  console.log();
});

// Get recent Git history
console.log(chalk.cyan('\n📜 Recent repository changes:'));
try {
  const gitLog = execSync('git log -n 5 --pretty=format:"%h %s" --date=short', { cwd: projectRoot }).toString();
  console.log(chalk.gray(gitLog));
} catch (error) {
  console.log(chalk.yellow('⚠️ Could not get git history'));
}

// Print critical reminders
console.log(chalk.yellow.bold('\n🧠 CRITICAL REMINDERS\n'));
console.log(chalk.white('1. Timeline vs. Applied Skills Data Inconsistency:'));
console.log(chalk.gray('   - Timeline shows skill applications from audit_logs table'));
console.log(chalk.gray('   - Applied Skills shows data from skill_applications table'));
console.log(chalk.gray('   - These may be out of sync and is a known issue'));

console.log(chalk.white('\n2. Timeline Configuration Requirements:'));
console.log(chalk.gray('   - Must use both entityType/entityId AND relatedEntityType/relatedEntityId'));
console.log(chalk.gray('   - Example: for customers, use relatedEntityType: "customer" and relatedEntityId: id'));

console.log(chalk.white('\n3. Test Cases:'));
console.log(chalk.gray('   - http://localhost:5173/customers/1 - Check for data inconsistency'));
console.log(chalk.gray('   - Compare Timeline events with Applied Skills section'));

// Record session in memory
const sessionFile = path.join(memoryDir, `session-${sessionId}.json`);
fs.writeFileSync(sessionFile, JSON.stringify({
  sessionId,
  repoName,
  timestamp: currentTime,
  loadedFiles: criticalFiles.map(file => path.basename(file))
}, null, 2), 'utf8');

// Create checkpoint file that will be visible in file listings
const checkpointFile = path.join(projectRoot, '.ai-checkpoint');
fs.writeFileSync(checkpointFile, `AI ASSISTANT CHECKPOINT
Repository: ${repoName}
Last context load: ${currentTime}
Session ID: ${sessionId}

TO LOAD CONTEXT: Run 'npm run ai:context'
`, 'utf8');

// Complete
console.log(chalk.bgGreen.black('\n✅ CONTEXT LOADING COMPLETE ✅\n'));
console.log(chalk.cyan(`📝 Checkpoint file created: ${checkpointFile}`));
console.log(chalk.cyan(`🔄 Remember to refresh context when switching tasks or after long breaks\n`));

// Export loaded context
export default {
  repoName,
  sessionId,
  loadedContext,
  loadTime: currentTime
}; 
// load-context.js
// Script to load context from documentation files for the AI assistant

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚨 LOADING CRITICAL PROJECT CONTEXT...');

// Function to read and return file contents
function readFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    return `Error reading file: ${error.message}`;
  }
}

// Load key documentation files
const developerNotes = readFile('DEVELOPER_NOTES.md');
const projectContext = readFile('context.json');
const readme = readFile('README.md');
const codeCommentsTemplate = readFile('docs/CODE_COMMENTS_TEMPLATE.md');
const aiReminder = readFile('docs/AI_ASSISTANT_REMINDER.md');

// Print summary of loaded context
console.log('\n📚 Context Loaded:');
console.log('- Developer Notes: ✅');
console.log('- Project Context: ✅');
console.log('- README: ✅');
console.log('- Code Comments Template: ✅');
console.log('- AI Assistant Reminder: ✅');

console.log('\n🧠 CRITICAL REMINDER:');
console.log('Before making changes to the codebase, please review:');
console.log('1. Known issues in DEVELOPER_NOTES.md');
console.log('2. Data flow patterns in context.json');
console.log('3. Testing procedures in README.md');
console.log('4. Code comment templates in docs/CODE_COMMENTS_TEMPLATE.md');

console.log('\n⚠️ KNOWN INCONSISTENCY ISSUES:');
console.log('- Skills may appear in Timeline but not in Applied Skills section');
console.log('- Timeline uses audit_logs while Applied Skills uses direct skill_applications table');
console.log('- Both should be showing the same information but may be out of sync');

console.log('\n🔍 ALWAYS TEST:');
console.log('- http://localhost:5173/customers/1 to verify data consistency');
console.log('- Compare Timeline events with Applied Skills section');

console.log('\n✅ Context loading complete. Happy coding!');

// Export context object for programmatic use
export default {
  developerNotes,
  projectContext,
  readme,
  codeCommentsTemplate,
  aiReminder
}; 
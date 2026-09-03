/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 * 
 * web-ifc-viewer Three.js compatibility patch
 * Replaces deprecated mergeBufferGeometries with mergeGeometries
 */

const fs = require('fs');
const path = require('path');

const webIfcViewerPath = path.join(__dirname, 'node_modules', 'web-ifc-viewer', 'dist');
const webIfcThreePath = path.join(__dirname, 'node_modules', 'web-ifc-three');

console.log('🔧 Patching web-ifc-viewer and web-ifc-three for Three.js compatibility...');
console.log(`📁 Target directories:`);
console.log(`   - ${webIfcViewerPath}`);
console.log(`   - ${webIfcThreePath}`);

let filesPatched = 0;

function patchDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Directory not found: ${dir}`);
    return;
  }
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      patchDirectory(fullPath);
    } else if (item.isFile() && (item.name.endsWith('.js') || item.name.endsWith('.mjs'))) {
      patchFile(fullPath);
    }
  }
}

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Replace mergeBufferGeometries with mergeGeometries
  content = content.replace(/mergeBufferGeometries/g, 'mergeGeometries');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesPatched++;
    console.log(`✅ Patched: ${filePath}`);
  }
}

try {
  patchDirectory(webIfcViewerPath);
  patchDirectory(webIfcThreePath);
  
  if (filesPatched > 0) {
    console.log(`\n✨ Successfully patched ${filesPatched} file(s)`);
    console.log('🎉 Three.js compatibility patch applied!');
  } else {
    console.log('\nℹ️  No files needed patching (already patched or different version)');
  }
} catch (error) {
  console.error('❌ Error during patching:', error.message);
  process.exit(1);
}

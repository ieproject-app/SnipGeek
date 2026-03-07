const fs = require('fs');
const path = require('path');

// Mapping dari old package ke new unified import
const radixMappings = {
  '@radix-ui/react-slot': 'radix-ui/slot',
  '@radix-ui/react-dialog': 'radix-ui/dialog',
  '@radix-ui/react-dropdown-menu': 'radix-ui/dropdown-menu',
  '@radix-ui/react-label': 'radix-ui/label',
  '@radix-ui/react-popover': 'radix-ui/popover',
  '@radix-ui/react-radio-group': 'radix-ui/radio-group',
  '@radix-ui/react-scroll-area': 'radix-ui/scroll-area',
  '@radix-ui/react-select': 'radix-ui/select',
  '@radix-ui/react-separator': 'radix-ui/separator',
  '@radix-ui/react-switch': 'radix-ui/switch',
  '@radix-ui/react-tabs': 'radix-ui/tabs',
  '@radix-ui/react-toast': 'radix-ui/toast',
  '@radix-ui/react-tooltip': 'radix-ui/tooltip',
  '@radix-ui/react-avatar': 'radix-ui/avatar'
};

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const [oldImport, newImport] of Object.entries(radixMappings)) {
    const regex = new RegExp(`from ["']${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `from "${newImport}"`);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
}

function migrateDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      migrateDirectory(filePath);
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      migrateFile(filePath);
    }
  }
}

// Start migration from src directory
const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
  migrateDirectory(srcDir);
  console.log('Radix UI migration completed!');
} else {
  console.log('src directory not found');
}

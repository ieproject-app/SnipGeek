const fs = require('fs');
const path = require('path');

// Mapping dari unified import kembali ke old package
const radixMappings = {
  'radix-ui/slot': '@radix-ui/react-slot',
  'radix-ui/dialog': '@radix-ui/react-dialog',
  'radix-ui/dropdown-menu': '@radix-ui/react-dropdown-menu',
  'radix-ui/label': '@radix-ui/react-label',
  'radix-ui/popover': '@radix-ui/react-popover',
  'radix-ui/radio-group': '@radix-ui/react-radio-group',
  'radix-ui/scroll-area': '@radix-ui/react-scroll-area',
  'radix-ui/select': '@radix-ui/react-select',
  'radix-ui/separator': '@radix-ui/react-separator',
  'radix-ui/switch': '@radix-ui/react-switch',
  'radix-ui/tabs': '@radix-ui/react-tabs',
  'radix-ui/toast': '@radix-ui/react-toast',
  'radix-ui/tooltip': '@radix-ui/react-tooltip',
  'radix-ui/avatar': '@radix-ui/react-avatar'
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
    console.log(`Rolled back: ${filePath}`);
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
  console.log('Radix UI rollback completed!');
} else {
  console.log('src directory not found');
}

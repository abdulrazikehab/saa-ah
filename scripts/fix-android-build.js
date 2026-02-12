import fs from 'fs';

const path = 'node_modules/@capacitor/android/capacitor/build.gradle';
console.log('Checking Android build requirements...');

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf-8');
  let changed = false;
  
  if (content.includes('JavaVersion.VERSION_21')) {
    content = content.replace(/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17');
    changed = true;
  }
  
  if (content.includes('gradle:8.13.0')) {
    content = content.replace(/gradle:8\.13\.0/g, 'gradle:8.2.2');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(path, content);
    console.log('✅ Fixed Capacitor Android build requirements (Java 17 / AGP 8.2.2)');
  } else {
    console.log('Build requirements already fixed or compatible.');
  }
} else {
  console.log('⚠️ Capacitor Android build file not found (skipping fix).');
}

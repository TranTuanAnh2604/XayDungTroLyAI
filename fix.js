
const fs = require('fs');
const files = [
  'd:\\HivicAI\\AIAssistantApp\\src\\components\\auth\\ForgotPasswordModal.tsx',
  'd:\\HivicAI\\AIAssistantApp\\src\\components\\auth\\OTPVerificationModal.tsx',
  'd:\\HivicAI\\AIAssistantApp\\src\\components\\events\\DateSelectorStrip.tsx',
  'd:\\HivicAI\\AIAssistantApp\\src\\components\\events\\TimelineEventItem.tsx',
  'd:\\HivicAI\\AIAssistantApp\\src\\components\\mail\\ComposeFAB.tsx',
  'd:\\HivicAI\\AIAssistantApp\\src\\components\\ui\\UnderlineTextInput.tsx',
  'd:\\HivicAI\\AIAssistantApp\\src\\components\\voice\\WaveformBars.tsx',
  'd:\\HivicAI\\AIAssistantApp\\src\\screens\\auth\\LoginScreen.tsx',
  'd:\\HivicAI\\AIAssistantApp\\src\\screens\\auth\\RegisterScreen.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  let useThemeCount = 0;
  
  let newLines = lines.filter(line => {
    if (line.includes('const { colors: COLORS } = useTheme();')) {
      useThemeCount++;
      if (useThemeCount > 1) return false;
    }
    if (useThemeCount > 1) {
      if (line.includes('const typography = React.useMemo(() => getTypography(COLORS)')) return false;
      if (line.includes('const styles = React.useMemo(() => createStyles(COLORS')) return false;
    }
    return true;
  });
  
  fs.writeFileSync(file, newLines.join('\n'));
});
console.log('Fixed files.');


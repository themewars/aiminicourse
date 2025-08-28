const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel build process...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build the frontend
  console.log('🔨 Building frontend with Vite...');
  execSync('npm run build', { stdio: 'inherit' });

  // Copy server files to dist if needed
  console.log('📁 Copying server files...');
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  // Create a simple server entry point for Vercel
  const serverEntry = `
const express = require('express');
const path = require('path');

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname)));

// API routes (will be handled by Vercel functions)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

module.exports = app;
  `;

  fs.writeFileSync(path.join('dist', 'server.js'), serverEntry);

  console.log('✅ Vercel build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

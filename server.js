const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3005;

// Determine the correct static files path
const isDev = process.env.NODE_ENV === 'development';
const staticPath = isDev ? path.join(__dirname, 'out') : path.join(process.resourcesPath, 'out');

console.log('Server starting...');
console.log('Static path:', staticPath);
console.log('__dirname:', __dirname);
console.log('process.resourcesPath:', process.resourcesPath);

// Check if static path exists
if (fs.existsSync(staticPath)) {
  console.log('Static path exists');
} else {
  console.log('Static path does not exist');
}

// Serve static files with explicit configuration
app.use(express.static(staticPath, {
  maxAge: '1d',
  etag: false
}));

// Simple catch-all route without complex path matching
app.use((req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('File not found');
  }
});

app.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
  
  // Send message to parent process that server is ready
  if (process.send) {
    process.send('server-ready');
  }
}).on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Server shutting down...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
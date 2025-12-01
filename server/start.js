// Production server startup - just start the API server which also serves static files
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set NODE_ENV to production if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

// Import and start the API server
import('./api.js').catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});


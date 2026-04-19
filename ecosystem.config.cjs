const { readFileSync } = require('fs');
const { join } = require('path');

// Load .env into env object
const envVars = {};
try {
  const envFile = join(__dirname, '.env');
  for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) envVars[match[1].trim()] = match[2].trim();
  }
} catch {}

module.exports = {
  apps: [
    {
      name: 'anton-service',
      script: join(__dirname, 'index.js'),
      cwd: __dirname,
      env: {
        ...envVars,
        NODE_ENV: 'production',
      },
      max_restarts: 5,
      restart_delay: 3000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};

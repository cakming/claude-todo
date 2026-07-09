// PM2 process definition for the Vibe Todo backend.
//
// Run from the repo root on the VM:
//   pm2 startOrReload deploy/ecosystem.config.cjs --update-env
//
// Secrets/config are NOT defined here — the backend reads them from
// `backend/.env` (loaded by dotenv). Keep real secrets only in that file.
module.exports = {
  apps: [
    {
      name: 'vibe-todo-backend',
      script: 'src/app.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};

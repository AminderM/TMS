module.exports = {
  apps: [
    {
      name: 'tms-prod',
      script: 'npx',
      args: 'serve -s /var/www/tms-prod/build -l 4000 --no-clipboard',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      cwd: '/var/www/tms-prod',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: '/var/www/tms-prod/logs/pm2-error.log',
      out_file: '/var/www/tms-prod/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};

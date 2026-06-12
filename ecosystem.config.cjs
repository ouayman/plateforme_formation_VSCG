module.exports = {
  apps: [
    {
      name: "vscg",
      cwd: "/opt/vsc-platform",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        NODE_OPTIONS: "--max-old-space-size=512",
      },
      max_memory_restart: "500M",
      exp_backoff_restart_delay: 100,
      autorestart: true,
      watch: false,
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/opt/vsc-platform/logs/pm2-error.log",
      out_file: "/opt/vsc-platform/logs/pm2-out.log",
    },
  ],
};

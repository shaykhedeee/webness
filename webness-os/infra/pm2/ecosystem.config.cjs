// ─────────────────────────────────────────────────────────
// PM2 Ecosystem Configuration
// Manages all Node.js processes on Oracle Cloud VPS
// ─────────────────────────────────────────────────────────

module.exports = {
  apps: [
    {
      name: "webness-api",
      cwd: "/home/webness/webness-os/apps/api",
      script: "dist/index.js",
      instances: 2, // 2 of 4 OCPUs for API
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      // Logging
      log_file: "/home/webness/logs/api-combined.log",
      error_file: "/home/webness/logs/api-error.log",
      out_file: "/home/webness/logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Restart policy
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "500M",
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
    {
      name: "webness-worker",
      cwd: "/home/webness/webness-os/apps/worker",
      script: "dist/index.js",
      instances: 1, // 1 OCPU for worker
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      log_file: "/home/webness/logs/worker-combined.log",
      error_file: "/home/webness/logs/worker-error.log",
      out_file: "/home/webness/logs/worker-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      max_restarts: 10,
      min_uptime: "10s",
      max_memory_restart: "400M",
      kill_timeout: 10000, // Give worker more time to finish jobs
    },
    {
      name: "webness-dashboard",
      cwd: "/home/webness/webness-os/apps/dashboard",
      script: "node_modules/.bin/serve",
      args: "-s dist -l 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      log_file: "/home/webness/logs/dashboard.log",
      max_memory_restart: "200M",
    },
    {
      name: "webness-admin",
      cwd: "/home/webness/webness-os/apps/admin",
      script: "node_modules/.bin/serve",
      args: "-s dist -l 3003",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      log_file: "/home/webness/logs/admin.log",
      max_memory_restart: "200M",
    },
  ],
};

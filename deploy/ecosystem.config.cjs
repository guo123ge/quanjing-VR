module.exports = {
  apps: [
    {
      name: "ai-panorama-renovation",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3002",
      cwd: "/opt/ai-panorama-renovation-app",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "file:../data/panorama.db",
      },
    },
  ],
};

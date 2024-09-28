module.exports = {
    apps: [
      {
        name: "Datacanvas-Backend",
        script: "src/index.js",
        watch: true,
        env: {
          NODE_ENV: "development",
          PORT: 3001,
        },
        env_production: {
          NODE_ENV: "production",
          PORT: 3001,
        },
      },
    ],
  };
module.exports = {
  devServer(devServerConfig) {
    devServerConfig.client = devServerConfig.client || {};
    devServerConfig.client.overlay = {
      errors: true,
      warnings: false,
      runtimeErrors: false,
    };
    devServerConfig.proxy = [
      {
        context: ['/socket.io', '/subscribe', '/unsubscribe'],
        target: 'https://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    ];
    return devServerConfig;
  },
};

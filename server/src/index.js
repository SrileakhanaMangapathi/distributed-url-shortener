const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  connectRedis();
  return app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

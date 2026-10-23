const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'ticking'
    });

    console.log(
      `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
    );
    return connection;
  } catch (error) {
    console.error(
      'MongoDB connection failed:',
      error.message
    );
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDB, disconnectDB };

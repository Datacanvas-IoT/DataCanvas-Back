const { Sequelize } = require('sequelize')
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const useSSL = process.env.DB_USE_SSL === 'true' || false;

const sequelizeOptions = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
};

// Only add SSL configuration if explicitly enabled
if (useSSL) {
  sequelizeOptions.ssl = true;
  sequelizeOptions.dialectOptions = {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    encrypt: true,
  };
}

const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  sequelizeOptions
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();

module.exports = sequelize;

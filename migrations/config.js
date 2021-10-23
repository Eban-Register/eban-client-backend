// const app = require('../src/app');
const env = process.env.NODE_ENV || 'development';
const dialect = 'sqlite'; // Or your dialect name

module.exports = {
  [env]: {
    dialect,
    storage: process.env.DB_PATH
  }
};
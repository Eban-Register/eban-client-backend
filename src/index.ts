import logger from './logger';
require('dotenv').config();
import app from './app';

const port = process.env.PORT;
if(!port)
  throw new Error('no port set in .env');
  
const server = app.listen(port);

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason)
);

server.on('listening', () =>
  logger.info('Feathers application started on http://%s:%d', app.get('host'), port)
);

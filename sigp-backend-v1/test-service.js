const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: '97ae57df-80e8-4758-a3df-be7d5aac1368', email: 'admin@sigp.local', role: 'ADMIN' }, 'sigp_super_secret_key', { expiresIn: '1h' }); // Wait, the secret in nestjs is usually in .env

// Let's just create a test module in NestJS context to invoke ProjectService directly!

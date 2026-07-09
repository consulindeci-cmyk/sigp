const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: '97ae57df-80e8-4758-a3df-be7d5aac1368', email: 'admin@sigp.local', role: 'ADMIN' },
  'sigp-dev-secret-min-32-chars-xxxx',
  { expiresIn: '1h' }
);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/projects',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data));
});
req.on('error', e => console.error(e));
req.end();

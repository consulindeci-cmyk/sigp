const http = require('http');

async function testConnection() {
  console.log('1. Test du proxy Frontend (Vite) -> Backend (NestJS)...');
  
  // On va faire une requête HTTP sur le frontend (5173) 
  // qui doit être proxifiée vers le backend (3000)
  const req = http.request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`\n=> Réponse reçue depuis le frontend (Port 5173) : Statut ${res.statusCode}`);
      const json = JSON.parse(data);
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('✅ CONNEXION RÉUSSIE ! Le Frontend communique parfaitement avec le Backend.');
        console.log(`Le backend a répondu avec succès (Token reçu).`);
      } else if (res.statusCode === 401) {
        // Même une 401 (mot de passe incorrect) prouve que le backend répond !
        console.log('✅ CONNEXION RÉUSSIE ! Le Frontend communique parfaitement avec le Backend.');
        console.log(`Le backend a répondu : "${json.message}"`);
      } else {
        console.log(`⚠️ Réponse inattendue : ${data}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ ÉCHEC DE LA CONNEXION : Le frontend sur le port 5173 ne répond pas. ${e.message}`);
  });

  // Envoi de credentials (même faux) pour déclencher la route auth
  req.write(JSON.stringify({ email: 'admin@demo.com', password: 'password123' }));
  req.end();
}

testConnection();

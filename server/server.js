const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 3000;
const HOST = '192.168.1.110'; // Adresa IP a serverului

// Încarcă cheia și certificatul
const options = {
  key: fs.readFileSync('/var/www/faceit-api/certs/faceit-api.key'),
  cert: fs.readFileSync('/var/www/faceit-api/certs/faceit-api.crt')
};

// Ruta ta existentă
app.get('/api/steamid', async (req, res) => {
  try {
    const { vanityurl } = req.query;

    if (!vanityurl) {
      return res.status(400).json({ error: 'Parametrul vanityurl lipsește.' });
    }

    const steamApiUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=C505984166A193D4D0270DBF571D150C&vanityurl=${vanityurl}`;
    const response = await axios.get(steamApiUrl);

    if (response.data.response.success === 1) {
      res.json({ steamid: response.data.response.steamid });
    } else {
      res.status(404).json({ error: 'Profil Steam nu există' });
    }
  } catch (error) {
    console.error('Eroare la request:', error);
    res.status(500).json({ error: 'Eroare internă a serverului.' });
  }
});

// Pornește serverul HTTPS
https.createServer(options, app).listen(PORT, HOST, () => {
  console.log(`Server rulează pe https://${HOST}:${PORT}`);
});


# 🎮 FACEIT App - Ghid Complet Backend MySQL

## 📋 Ce vei avea nevoie:
- Node.js (descarcă de la nodejs.org)
- MySQL (descarcă de la mysql.com)
- Un editor de text (VS Code recomandat)

## 🚀 Pasul 1: Instalează MySQL

### Pe Windows:
1. Descarcă MySQL Community Server de la mysql.com
2. Instalează cu configurația implicită
3. Setează o parolă pentru root (reține-o!)

### Pe Linux/Ubuntu:
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

## 🗄️ Pasul 2: Creează baza de date

Deschide MySQL Command Line și rulează:

```sql
-- Creează baza de date
CREATE DATABASE faceit_app;

-- Folosește baza de date
USE faceit_app;

-- Creează tabelul pentru prieteni
CREATE TABLE friends (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(255) NOT NULL,
    avatar TEXT,
    level INT DEFAULT 0,
    elo INT DEFAULT 0,
    wins INT DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    hs_rate DECIMAL(5,2) DEFAULT 0.00,
    kd_ratio DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 📁 Pasul 3: Creează backend-ul

Creează un folder nou pentru backend (pe același server):

```bash
mkdir faceit-backend
cd faceit-backend
npm init -y
```

## 📦 Pasul 4: Instalează dependențele

```bash
npm install express mysql2 cors dotenv
npm install -D nodemon
```

## ⚙️ Pasul 5: Creează fișierele backend

### 📄 server.js (fișierul principal)
```javascript
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configurația bazei de date
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'PAROLA_TA_MYSQL', // Înlocuiește cu parola ta
  database: 'faceit_app'
});

// Conectează la baza de date
db.connect((err) => {
  if (err) {
    console.error('Eroare la conectarea la MySQL:', err);
    return;
  }
  console.log('Conectat la MySQL!');
});

// Rute API

// GET - Obține toți prietenii
app.get('/api/friends', (req, res) => {
  const query = 'SELECT * FROM friends ORDER BY elo DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Eroare la obținerea prietenilor:', err);
      res.status(500).json({ error: 'Eroare server' });
      return;
    }
    res.json(results);
  });
});

// POST - Adaugă un prieten nou
app.post('/api/friends', (req, res) => {
  const { player_id, nickname, avatar, level, elo, wins, win_rate, hs_rate, kd_ratio } = req.body;
  
  const query = `
    INSERT INTO friends (player_id, nickname, avatar, level, elo, wins, win_rate, hs_rate, kd_ratio) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
    nickname = VALUES(nickname),
    avatar = VALUES(avatar),
    level = VALUES(level),
    elo = VALUES(elo),
    wins = VALUES(wins),
    win_rate = VALUES(win_rate),
    hs_rate = VALUES(hs_rate),
    kd_ratio = VALUES(kd_ratio)
  `;
  
  db.query(query, [player_id, nickname, avatar, level, elo, wins, win_rate, hs_rate, kd_ratio], (err, result) => {
    if (err) {
      console.error('Eroare la adăugarea prietenului:', err);
      res.status(500).json({ error: 'Eroare server' });
      return;
    }
    res.json({ message: 'Prieten adăugat cu succes', id: result.insertId });
  });
});

// DELETE - Șterge un prieten
app.delete('/api/friends/:playerId', (req, res) => {
  const { playerId } = req.params;
  
  const query = 'DELETE FROM friends WHERE player_id = ?';
  
  db.query(query, [playerId], (err, result) => {
    if (err) {
      console.error('Eroare la ștergerea prietenului:', err);
      res.status(500).json({ error: 'Eroare server' });
      return;
    }
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Prietenul nu a fost găsit' });
      return;
    }
    
    res.json({ message: 'Prieten șters cu succes' });
  });
});

// Pornește serverul
app.listen(PORT, () => {
  console.log(`Serverul backend rulează pe portul ${PORT}`);
  console.log(`API disponibil la: http://localhost:${PORT}/api`);
});
```

### 📄 package.json (actualizează scripturile)
```json
{
  "name": "faceit-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## ▶️ Pasul 6: Pornește backend-ul

```bash
# Pentru dezvoltare (cu auto-restart)
npm run dev

# Pentru producție
npm start
```

## 🌐 Pasul 7: Actualizează URL-ul în frontend

În `src/hooks/useFriends.ts`, schimbă:
```typescript
const API_URL = 'http://localhost:3001/api'; // Pentru dezvoltare locală
```

Pentru producție (pe același server), folosește:
```typescript
const API_URL = '/api'; // Pentru producție pe același server
```

## 🔧 Pasul 8: Configurare pentru producție

### Creează un fișier de configurare Nginx (dacă folosești Nginx):
```nginx
# Adaugă în configurația ta Nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Sau folosește PM2 pentru a rula backend-ul în producție:
```bash
npm install -g pm2
pm2 start server.js --name "faceit-backend"
pm2 startup
pm2 save
```

## 🔍 Testare

1. Pornește backend-ul: `npm run dev`
2. Testează API-ul în browser sau cu Postman:
   - GET http://localhost:3001/api/friends
   - POST http://localhost:3001/api/friends (cu JSON în body)
   - DELETE http://localhost:3001/api/friends/PLAYER_ID

## 🚨 Probleme comune și soluții

### Eroare: "Access denied for user 'root'"
- Verifică parola MySQL în server.js
- Asigură-te că MySQL rulează

### Eroare: "Cannot connect to MySQL"
- Verifică că MySQL server-ul rulează
- Verifică configurația de host/port

### Eroare CORS
- Backend-ul include deja configurația CORS
- Verifică că porturile sunt corecte

### Port-ul 3001 este ocupat
- Schimbă PORT-ul în server.js (ex: 3002)
- Actualizează API_URL în frontend

## 📚 Structura finală

```
faceit-backend/
├── server.js
├── package.json
└── node_modules/

faceit-app/ (frontend)
├── src/
│   ├── hooks/
│   │   ├── useFriends.ts
│   │   └── usePlayerModal.ts
│   ├── types/
│   │   └── Player.ts
│   └── pages/
│       └── Index.tsx
└── BACKEND_SETUP.md
```

## ✅ Ce urmează

1. Pornește backend-ul cu `npm run dev`
2. Actualizează API_URL în frontend
3. Testează adăugarea/ștergerea prietenilor
4. Configurează pentru producție cu PM2 sau ca serviciu


# Discord Activities Setup Guide

## 1. Environment Variables

Creează un fișier `.env.local` în root-ul proiectului și adaugă:

```env
VITE_DISCORD_CLIENT_ID=your_discord_client_id_here
VITE_DISCORD_REDIRECT_URI=https://your-app.lovable.app
VITE_DISCORD_ACTIVITY_URL=https://your-app.lovable.app
```

## 2. Discord Developer Portal Setup

### Pasul 1: Creează o aplicație Discord
1. Accesează [Discord Developer Portal](https://discord.com/developers/applications)
2. Click pe "New Application"
3. Numele: "LaCurte.ro Faceit Tools"
4. Acceptă Terms of Service

### Pasul 2: Configurează Discord Activity
1. În aplicația ta Discord, mergi la "Activities"
2. Click "Add Activity"
3. Completează informațiile:
   - **Name**: LaCurte.ro Faceit Tools
   - **Description**: Monitorizează statistici și meciuri live Faceit pentru comunitatea LaCurte.ro
   - **Tags**: gaming, stats, faceit, esports
   - **Target URL**: https://your-app.lovable.app
   - **Supported Platforms**: Desktop

### Pasul 3: Upload Assets
În secțiunea "Rich Presence Assets":
1. **faceit_logo** (512x512): Logo-ul principal al aplicației
2. **live_icon** (256x256): Icon pentru meciuri live
3. **stats_icon** (256x256): Icon pentru statistici

### Pasul 4: Configurează URL Mapping
1. Mergi la "URL Mappings"
2. Adaugă:
   - **Prefix**: `/`
   - **Target**: `https://your-app.lovable.app`

## 3. Testare locală

Pentru testare în Discord:
1. Instalează Discord Canary sau PTB
2. Activează Developer Mode în Discord
3. Folosește Discord Activity Test Tool

## 4. Rich Presence Integration

Aplicația va actualiza automat statusul Discord cu:
- **State**: Secțiunea curentă (FRIENDS/LEADERBOARD)
- **Details**: Numărul de prieteni și meciuri live
- **Timestamps**: Timpul petrecut în aplicație
- **Assets**: Logo-uri și iconițe relevante

## 5. Submission pentru aprobare

După testare completă:
1. Completează Privacy Policy
2. Completează Terms of Service  
3. Adaugă screenshots ale aplicației
4. Submit pentru review Discord
5. Timpul de review: 2-7 zile lucrătoare

## 6. Features implementate

✅ Discord SDK Integration
✅ Rich Presence Updates
✅ Activity Status Display
✅ User Authentication (optional)
✅ Responsive design pentru iframe Discord
✅ Error handling pentru medii non-Discord

## Următorii pași

1. Setează environment variables
2. Testează în mediul local
3. Configurează Discord Developer Portal
4. Upload assets și configurează URL mappings
5. Testează în Discord
6. Submit pentru aprobare

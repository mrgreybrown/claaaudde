# Planerwerk

Kostenlose Planer zum Ausdrucken: Wochenplaner, Essensplan, Putzplan, Habit-Tracker und To-do-Liste.
Die Seite ist rein statisch (HTML/CSS/JS) und läuft auf GitHub Pages ohne laufende Kosten.

## Einnahmen
Alles wird in `js/config.js` eingestellt. Leere Felder werden auf der Seite ausgeblendet.
- `support`: Link zu deinem Buy-Me-a-Coffee-Profil (Spenden-Button)
- `premium`: Link zum Premium-Paket (Buy Me a Coffee Shop)
- `amazonTag`: deine Amazon-PartnerNet-ID, z. B. `name-21`

## Premium-Paket bauen
```
npx http-server -p 8765 -s .
node scripts/build-premium.js 2027   # -> dist/Planerwerk-Premium-2027.zip
```

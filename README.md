# PokeDefense 🔴⚪

Ein Roguelike-Tower-Defense mit Pokémon als Tower **und** Angreifer.
Gebaut für Smartphones im Querformat, läuft direkt im Browser – kein Build-Step.

**Spielen:** GitHub Pages auf dem `main`-Branch aktivieren (Settings → Pages → Deploy from branch → `main` / root), dann `https://<user>.github.io/PokeDefense/` öffnen.

## Features

- **4 Trainer** (einer geheim!) mit je 6 Tower-Linien und eigenem Spielstil:
  - **Rot** – die Kanto-Klassiker (Glurak, Turtok, Bisaflor, Raichu, Knogga, Dragoran)
  - **Sabrina** – Kontrolle: Teleport, Schlaf, Minen, Frost-Aura, Support
  - **Koga** – Gift & Schwarm: DoT-Stacks, Giftwolken, Schleimpfützen
  - **Giovanni** 🔒 – wird nach dem ersten Sieg freigeschaltet… inklusive Mewtwo
- **20 vorgenerierte Maps** in 5 Biomen, **Bosse auf Map 10 (Garados) & 20 (Mewtwo)** mit eigenen Fähigkeiten (Abtauchen, Wutanfall, Schild-Phasen, Klone, Tower-Blockade)
- **Evolutionen** als Kernmechanik: Gold+Kills, **Stein-Evolutionen** (Items aus dem Draft) und klassische **Tausch-Evolutionen** (zwei Tower tauschen die Plätze → Simsala/Gengar!)
- **Roguelike-Loop**: Nach jeder Map 1-aus-3-Item-Draft (Evolutionssteine, Sonderbonbons, permanente Buffs), 20 Herzen für den ganzen Run
- **Freischalt-Bedingungen** pro Tower-Slot (z.B. „baue 3 Tower", „ein Tower auf Stufe 3")
- **Typen-System** (vereinfachte Gen-1-Tabelle) + Bewegungsarten: fliegend, laufend, schwebend, **grabend**
- **Meta-Progression** im localStorage: Pokédex, beste Maps, geheimer Trainer
- Animierte Gen-5-Sprites (eigener GIF-Decoder), Partikel-Projektile, Kettenblitze, Screenshake, prozedurale WebAudio-SFX

## Technik

- Vanilla JS (ES-Module) + Canvas 2D, keine Abhängigkeiten
- Sprites: [PokeAPI/sprites](https://github.com/PokeAPI/sprites) (im Repo vendored, `tools/fetch_sprites.sh`)
- Nur für den Privatgebrauch – Pokémon © Nintendo/Game Freak/The Pokémon Company

## Entwicklung

```bash
python3 -m http.server 8080   # beliebiger Static-Server
# http://localhost:8080 im Browser (am besten mobile Emulation, Landscape)
node tools/validate.mjs        # Map-/Daten-Validierung
```

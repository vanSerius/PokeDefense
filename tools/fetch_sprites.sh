#!/usr/bin/env bash
# Lädt die benötigten Pokémon-Sprites (Gen-5 Schwarz/Weiß, animiert + statisch)
# sowie Item-Icons aus dem PokeAPI-Sprites-Repo und legt sie unter assets/ ab.
# Einmalig ausführen; die Ergebnisse werden ins Repo committet.
set -u
cd "$(dirname "$0")/.."

BASE="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites"

# Alle im Spiel verwendeten Pokémon (Tower-Linien, Gegner, Bosse)
IDS="1 2 3 4 5 6 7 8 9 10 13 14 15 16 17 19 20 21 25 26 27 29 30 31 32 33 34
41 42 46 48 49 50 51 52 53 54 56 58 59 63 64 65 66 69 72 74 77 81 88 89 90 92
93 94 95 96 97 98 100 101 104 105 109 110 111 112 115 122 124 129 130 131 143
147 148 149 150 169"

ITEMS="fire-stone water-stone thunder-stone leaf-stone moon-stone rare-candy
x-attack x-defense amulet-coin wide-lens lucky-egg soothe-bell metal-coat
potion max-potion exp-share quick-claw"

fail=0
for id in $IDS; do
  [ -f "assets/sprites/animated/$id.gif" ] || \
    curl -sSf -o "assets/sprites/animated/$id.gif" \
      "$BASE/pokemon/versions/generation-v/black-white/animated/$id.gif" \
      || { echo "FEHLT animated $id"; fail=1; }
  [ -f "assets/sprites/static/$id.png" ] || \
    curl -sSf -o "assets/sprites/static/$id.png" \
      "$BASE/pokemon/versions/generation-v/black-white/$id.png" \
      || { echo "FEHLT static $id"; fail=1; }
done

mkdir -p assets/sprites/items
for item in $ITEMS; do
  [ -f "assets/sprites/items/$item.png" ] || \
    curl -sSf -o "assets/sprites/items/$item.png" "$BASE/items/$item.png" \
      || { echo "FEHLT item $item"; fail=1; }
done

echo "Fertig. Fehler: $fail"

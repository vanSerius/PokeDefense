// Globale Spielkonstanten
export const TILE = 64;          // Kachelgröße in Weltpixeln
export const COLS = 20;          // Spielfeld-Spalten
export const ROWS = 9;           // Spielfeld-Zeilen
export const W = COLS * TILE;    // 1280
export const H = ROWS * TILE;    // 576

export const START_HEARTS = 20;
export const BOSS_HEART_DMG = 5;
export const BASE_GOLD = 260;    // Startgold pro Map
export const GOLD_CARRY = 0.5;   // Anteil Restgold, der mitgenommen wird
export const WAVE_BONUS = 42;    // Gold pro geschaffter Welle
export const SELL_REFUND = 0.7;  // Anteil beim Verkaufen

export const MAP_COUNT = 12;
export const SPEEDS = [1, 2, 3];
export const TEAM_CAP = 12;      // max. Pokémon im Team (Feld + Bank)
export const BETWEEN_TIME = 10;  // Sekunden bis zur Auto-Welle
export const EARLY_CALL_RATE = 6; // Bonus-Gold pro gesparter Sekunde beim Früher-Rufen

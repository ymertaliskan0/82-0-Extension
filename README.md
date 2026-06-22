# 82-0 Score Tracker & Calculator

A lightweight, event-driven JavaScript tool designed to run alongside web-based basketball drafting games. It silently calculates custom player valuations, tracks your active roster's total score, and provides a live leaderboard of the best available players.

## Features

* **Live Roster Sum:** Tracks the total combined score of the players currently placed on your court. Instantly updates when players are added or removed.
* **Custom Stat Algorithm:** Calculates a weighted `TOT` score for every player based on their raw stats (PPG, RPG, APG, SPG, BPG).
* **Smart Leaderboards:** Displays a live "Top 3 Available" leaderboard that filters out drafted players.
* **Era Re-roll Tracker:** Automatically fetches historical data to display the Top 5 players from the same franchise across different decades.
* **Multi-Mode Support:** Seamlessly handles switching between Classic, HoopIQ, Team, and Era modes without breaking the UI.
* **JSON Export:** Downloads the current draft pool's stats directly to your machine for offline analysis.

## Installation

This script is built in vanilla JavaScript and can be injected into the browser via:
1. **Userscript Managers:** Create a new script in Tampermonkey or Greasemonkey and paste the code.
2. **Browser Console:** Simply copy the contents of `script.js` and paste it into the Developer Console (F12) while on the game page.
3. **Chrome Extension:** Load the directory as an unpacked extension (requires a basic `manifest.json`).

## Usage

1. **Scan Roster:** Click the injected "Scan Roster" button at the top of the screen to initialize the leaderboards and score tracking.
2. **Drafting:** Click on a player in the list to cache their score, then click an available court slot (PG, SG, SF, PF, C) to add them to your running sum.
3. **Resetting:** The roster sum will automatically drop back to zero when you start a new game via "Play Classic", "Build Another", or clear the board via "SPIN".

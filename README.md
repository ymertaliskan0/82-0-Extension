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
1. **Browser Console:** Simply copy the contents of `script.js` and paste it into the Developer Console (F12) while on the game page.
2. **Chrome Extension:** Load the directory as an unpacked extension (select the `manifest.json`).

## Usage

1. **Classic Mode:** All features are fully automated. If the script ever misses a calculation or the leaderboard fails to update, simply click the **Scan Roster** button at the top of the screen to force a refresh.
2. **HoopIQ Mode:** Player scores are hidden by default. You can manually reveal scores one by one, or click the **Reveal All** button in the bottom left to instantly unlock all the features available in Classic Mode.

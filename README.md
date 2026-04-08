# LifePulse

A simple lifestyle app for tracking habits, tasks, and workouts. All data stays on your device — no accounts, no servers, no tracking.

## Features

- **Habits** — daily habit checklist with streak tracking and heatmap
- **Tasks** — simple to-do list with completion tracking
- **Training** — import workout plans from Excel, log sets/reps/weight per exercise
- **Stats** — habit streaks, completion heatmap, workout volume, personal records
- **Dark mode**
- **PWA** — installable on phone via browser

## How to use

Open the app in a browser. All data is stored in your browser's localStorage.

To install on iPhone: open in Safari → Share → Add to Home Screen.

To install on Android: open in Chrome → tap the three-dot menu → Install app (or Add to Home Screen).

## Training import

Copy your workout data from a spreadsheet and paste it in the Import dialog. Format:

```
Day 1 Chest & Triceps
Bench Press    4    10    60    1-0-3-0    80
French Press   3    12    60    3-0-1-0    20

Day 2 Back & Biceps
Pull-ups       4    8     60    1-0-3-0
Barbell Row    4    10    60    2-0-1-0    60
```

Day headers are detected automatically. Exercise rows: Name | Sets | Reps | Rest | Tempo | Weight | Notes (tab-separated).

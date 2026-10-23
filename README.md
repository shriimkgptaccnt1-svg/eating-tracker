# Eat Out

Daily tracker with three swipeable tabs, all sharing one date (use ‹ › to change the day, and tap the date to jump back to today).

- **Food** (pink): what you ate, with an optional cost, plus your weight. Type a food and press Enter for the next line, then tap ✓ to save.
  The icons open the **food calendar** (meals and weight for each day) and the **weight graph** (with eating-out days marked).
- **Habits** (green): tap a habit to tick it. Weekly habits show their count for the week. **✎ Edit** lets you add, rename, change targets, delete or drag to reorder.
  The stats icon opens the **habit dashboard**, with week strips and the month score.
- **Workout** (blue): Exercise | Sets | kg | Reps. A row with no exercise name counts as more sets of the exercise above.
  Logging a workout ticks the Workout habit. The calendar icon shows which days you worked out.

Everything is stored on the phone (AsyncStorage).

## Run

```bash
npm install
npx expo start        # scan the QR code with Expo Go
```

## Get the APK (no Expo Go, no Expo account)

GitHub builds the APK automatically (`.github/workflows/build-apk.yml`):

1. Push this project to a GitHub repo on the `main` branch.
2. Wait about 10–15 minutes for the **Build APK** job in the repo's **Actions** tab to finish.
3. On your phone, open the repo's **Releases** page, then **latest**, then `eat-out.apk`.
4. Tap the downloaded file, then allow "Install unknown apps" for your browser when Android asks.

Every push to `main` rebuilds it. To update the app on your phone, install the new APK over the old one. Your saved entries are kept.

Another way to get it is through Expo's cloud build service, which needs a free Expo account: `npx eas-cli@latest build -p android --profile apk`.

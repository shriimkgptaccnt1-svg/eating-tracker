# Eat Out

Two-screen tracker for food eaten outside.

- **Log**: opens on today with the cursor ready. Type a food and press Enter for the next line. Cost is optional. Tap ✓ to save.
  Use ‹ › to change the day, and tap the date to jump back to today.
- **Calendar**: a month view showing what you ate each day. Tap a day to view or edit it.

Data is stored on the phone (AsyncStorage).

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

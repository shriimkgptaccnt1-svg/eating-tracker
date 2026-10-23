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

## Build an APK (install directly on Android)

Builds run in Expo's cloud, which is free with an Expo account. No Android Studio is needed.

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile apk
```

When the build finishes (about 10–15 minutes), it prints a download link and a QR code for the `.apk`.
Open the link on your phone, download the file, and allow "Install unknown apps" for your browser when Android asks.

# FormLex mobile app

Android and iPhone app for FormLex clients (formlex.kodataltd.org). Built with Expo SDK 58 and Expo Router.

What it does, in the five site languages (English, Español, Português, Français, العربية):

- **Sign in** with a WhatsApp code (Kodata's `kodata_login_code` template) or email and password; create an account.
- **New**: choose a document (or describe a custom one), the governing country and language, answer the questions, then **Pay & submit**. Pesapal opens in the in-app browser and returns to the app (`formlex://payment`); once the payment is confirmed the document is submitted for drafting and review.
- **Documents**: documents waiting for payment or submission, documents in review, and released documents with PDF/Word download and change requests.
- **Payments**: every transaction, with a PDF invoice for each completed payment.
- **Help**: support tickets and replies.
- **Account**: profile, language, terms and privacy, sign out.

The app uses the same API as the website (`src/lib/config.ts`); nothing is stored on the phone except the sign-in token (secure storage) and the language choice.

## Requirements

Node 22+ (the server's default Node is 20, so use `/opt/node22/bin`):

```bash
export PATH=/opt/node22/bin:$PATH
npm install
```

## Run it on a phone during development

```bash
npx expo start            # scan the QR code with Expo Go (Android) or the Camera app (iPhone)
```

## Checks

```bash
npx tsc --noEmit && npx expo lint && npx expo-doctor
```

## Build for the stores (EAS, in the cloud)

Needs a free Expo account (`npx eas-cli@latest login`), plus a Google Play developer account and an Apple Developer account for publishing.

```bash
npx eas-cli@latest build --profile preview --platform android    # installable APK for testers
npx eas-cli@latest build --profile production --platform android # .aab for Google Play
npx eas-cli@latest build --profile production --platform ios     # for the App Store / TestFlight
npx eas-cli@latest submit --platform android|ios                 # upload to the store
```

App identifiers: `org.kodataltd.formlex` (Android package and iOS bundle ID). After publishing, put the store links in the website under Admin → Brand & footer → Mobile apps.

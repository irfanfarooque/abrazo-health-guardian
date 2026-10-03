# ABRAZO Health Guardian – Environment Setup

This repository hosts the ABRAZO Health Guardian mobile app built with Expo Router, React Native, Supabase, and DeepSeek-powered AI. Follow the steps below to prepare your local environment before moving on to feature development.

## 1. Prerequisites

| Tool | Version | Install / Check |
| ---- | ------- | --------------- |
| Node.js | >= 18.18 (LTS recommended) | `node -v` |
| npm | >= 9.6 | `npm -v` |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI | latest | `npm install -g eas-cli` |
| Supabase CLI | latest | https://supabase.com/docs/guides/cli |

> After installation, run `expo doctor` to ensure the React Native environment is healthy.

## 2. Install Dependencies

```sh
npm install
```

This pulls all Expo, React Native, BLE, Supabase, and AI-related packages defined in `package.json`.

## 3. Configure Environment Variables

1. Duplicate the provided template:
   ```sh
   cp .env.example .env
   ```
2. Fill in your project-specific values:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_DEEPSEEK_API_KEY`
   - `EXPO_PUBLIC_EMERGENCY_NUMBER`

These values are injected into the app through `app.config.js` and read at runtime using Expo’s `extra` config.

## 4. Supabase Project Bootstrap

```sh
supabase login
supabase init
supabase link --project-ref <your-project-ref>
supabase db push
```

- Store SQL migrations inside `supabase/migrations/`.
- Keep secrets in `.env`; the `.gitignore` already excludes it.

## 5. Run the App

```sh
npm run start          # Expo dev server
npm run android        # Launch on Android emulator/device
npm run ios            # Launch on iOS simulator/device (macOS)
npm run web            # Launch on web
```

## 6. Recommended Checks

| Command | Purpose |
| ------- | ------- |
| `expo doctor` | Validates native tooling |
| `npx supabase status` | Ensures local Supabase stack is healthy |
| `npx expo install` | Reconciles native dependencies if versions drift |

## 7. Next Steps

With the environment ready, proceed to task #2 from `docs/context.md` to scaffold the Expo Router structure and begin implementing the dashboard experience.

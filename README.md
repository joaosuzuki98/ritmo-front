# Ritmo App Frontend

## 🚀 Technologies

- **React Native**: Framework for building native mobile apps
- **React Navigation**: Routing and navigation
- **TanStack React Query**: Server state management and data fetching
- **Axios**: HTTP client for API communication
- **React Hook Form**: Form state management with validation resolvers
- **Zod**: Data validation and typed schemas
- **Zustand**: Lightweight client state management
- **NativeWind + Tailwind CSS**: Utility-first styling for React Native
- **TypeScript**: Static typing
- **Metro + Babel**: Bundler and compiler for React Native
- **Jest + React Test Renderer**: Frameworks for writing and running tests
- **ESLint + Prettier**: Linting and code formatting

## 🏗️ Architecture

See more about the architecture [here](./docs/architecture.md)

## 📐 Code conventions

See more about code conventions [here](./docs/code_conventions.md)

## ⚙️ Running the project

> **Prerequisites**: complete the [React Native environment setup](https://reactnative.dev/docs/set-up-your-environment) (Node >= 22.11, JDK + Android Studio for Android, Xcode + CocoaPods for iOS).

1. Install the project dependencies:
```bash
npm install
```

2. Install iOS native dependencies (macOS only, first clone or after updating native deps):
```bash
bundle install
bundle exec pod install
```

3. Start the Metro bundler:
```bash
npm start
```

4. With Metro running, open a new terminal and run the app:

Android (emulator or connected device):
```bash
npm run android
```

iOS (simulator or connected device):
```bash
npm run ios
```

## Android splash screen

The native splash uses `react-native-bootsplash` with the Ritmo logo and the
onboarding background (`#121318`, from `src/styles/colors.ts`). It fades out after
the local session is restored and the first screen receives layout, including
when session restoration fails and the app falls back to onboarding.

To regenerate the assets after changing the logo or background:

```bash
npx react-native-bootsplash generate src/assets/images/ritmo-logo.svg \
  --platforms=android \
  --background=121318 \
  --logo-width=180 \
  --assets-output=src/assets/images/bootsplash
```

Rebuild with `npm run android` after changing native splash resources. To check
the launch screen, fully close the app and open it from its launcher icon;
Fast Refresh does not replay native startup.

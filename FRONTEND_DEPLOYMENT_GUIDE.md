# RupeeRush Frontend Architecture & Deployment Guide

This guide outlines the React Native structure (Expo) to complement the Node.js backend generated.

## 1. Expo Navigation Structure

### Core Stack Navigator
The app requires a dark, premium UI with smooth transitions.

```javascript
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={GoogleLoginScreen} />
        <Stack.Screen name="Home" component={HomeDashboard} />
        <Stack.Screen name="LudoLobby" component={LudoLobby} />
        <Stack.Screen name="LudoBoard" component={LudoBoard} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="RefAndEarn" component={ReferralScreen} />
        <Stack.Screen name="DailyStreak" component={StreakPage} />
        <Stack.Screen name="LuckySpin" component={LuckySpinPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Essential Screens & Logic

#### 1. Google Login & Anti-Fraud Headers
Use `@react-native-google-signin/google-signin` and Firebase Authentication.

```javascript
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Get idToken, then send to backend
const targetToken = await auth().currentUser.getIdToken(true);
const deviceId = await getUniqueId(); // e.g. from react-native-device-info

const response = await fetch('/api/v1/auth/login', {
   method: 'POST',
   headers: {
      'Authorization': `Bearer ${targetToken}`,
      'x-device-id': deviceId,
      'x-is-emulator': isEmulator().toString(),
      'x-is-rooted': isRooted().toString() 
   }
});
```

#### 2. Socket.io Client for Ludo
Use `socket.io-client`. Pass the firebase token for authentication.

```javascript
import { io } from "socket.io-client";

const socket = io("http://your-backend-url", {
    auth: { token: firebaseIdToken }
});

socket.emit("join_auto_match", { mode: "2_PLAYER" });
socket.on("match_found", (roomData) => console.log(roomData));
```

#### 3. Monetization (AdMob) Flow
Use `react-native-google-mobile-ads`.

- **Banner Ads:** Place persistent anchors at the bottom of the Home, Streak, and Ludo Lobby screens. Configure refresh intervals directly in AdMob or via code. Note that counting impressions for the prize pool requires tracking duration & views during the match.
- **Rewarded Interstitial:** 
  For Lucky Spin: show standard Rewarded Ad before enabling the Spin logic. Once `rewardEarned` is triggered, hit backend `/api/v1/rewards/spin` with `{ rewardedAdCompleted: true }`.

## 2. Production Deployment Guide

### Backend Server Deployment
We recommend **Render**, **Railway**, or **AWS EC2/Elastic Beanstalk**. MongoDB uses Atlas.

**Steps:**
1. Connect GitHub repo containing `backend/`.
2. Environment Variables needed in production:
   - `PORT=5000`
   - `MONGODB_URI=<Your Mongo Atlas String>`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (Watch out for literal `\n` carriage returns in the PAAS control panel).
3. Push to main branch to deploy. Ensure you use `pm2` or at least standard `node src/index.js` in your host startup script.

### AdMob Configuration
1. Enable Server-Side Verification (SSV) in AdMob dashboard for the Rewarded Video unit.
2. Point SSV Callback URL to: `https://your-domain.com/api/v1/admob/ssv`
3. Enter custom parameters mapping `userId` or mongo `_id` in order for webhook to map correctly.

### Security Reminders
- You MUST securely store the `JWT_SECRET` and Firebase key.
- Enable MongoDB network access restrictions (IP Allowlist).
- Turn on SSL/TLS for your domain.

## Final Note
The backend implements complete Ad-Revenue distributed Ludo Matchmaking, Daily Streak validation (24-48h logic), Google Firebase Auth, and anti-fraud middleware for Emulators/Root devices.

Proceed to integrate React Native with this API framework to produce `rupeecash.apk`!

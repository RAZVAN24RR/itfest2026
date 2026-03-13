import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.campaia.app',
    appName: 'CampaiaAI',
    webDir: 'dist',
    // Note: API URL is set via VITE_API_URL in .env and bundled during build
    // Do NOT set server.url here as it overrides the local webview
    plugins: {
        GoogleAuth: {
            scopes: ['profile', 'email'],
            serverClientId: '557714121600-r6jh90ghjj22uc1qj6kibqf5cjpfmqak.apps.googleusercontent.com',
            forceCodeForRefreshToken: true,
        },
        SplashScreen: {
            "launchShowDuration": 400,
            "launchAutoHide": true,
            "launchFadeOutDuration": 300,
            "backgroundColor": "#ffffffff",
            "androidSplashResourceName": "splash",
            "androidScaleType": "CENTER_CROP",
            "showSpinner": true,
            "androidSpinnerStyle": "large",
            "iosSpinnerStyle": "small",
            "spinnerColor": "#999999",
            "splashFullScreen": true,
            "splashImmersive": true,
            "layoutName": "launch_screen",
            "useDialog": true
        },
        // Allow cleartext traffic for local development
        // This is needed for ngrok tunnels and localhost
        CapacitorHttp: {
            enabled: true
        }
    },
    android: {
        allowMixedContent: true,  // Allow HTTP content in HTTPS pages
    }
};
export default config;

import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, disableNetwork } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let db: any;

if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    const isTest = typeof window !== 'undefined' && (
        window.navigator.webdriver || 
        window.navigator.userAgent.toLowerCase().includes('playwright') ||
        window.navigator.userAgent.toLowerCase().includes('headless')
    );
    
    if (isTest) {
        db = initializeFirestore(app, {});
        disableNetwork(db).catch(err => console.error("Failed to disable Firestore network:", err));
        console.log("Firestore initialized with in-memory cache for test environment. Network disabled.");
    } else {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
        });
    }
} else {
    console.warn("Firebase API Key missing. Cloud sync disabled.");
}

export { db };

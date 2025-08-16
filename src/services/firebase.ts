import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateEmail,
  type User,
  type UserCredential,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env
    .VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
};

// Validate Firebase configuration
if (!firebaseConfig.projectId) {
  console.error(
    "❌ Firebase projectId is missing. Check your environment variables."
  );
}

// Debug Firebase configuration
console.log("🔧 Firebase Config:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey ? "✅ Set" : "❌ Missing",
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? "✅ Set" : "❌ Missing",
  measurementId: firebaseConfig.measurementId,
});

// Initialize Firebase app (singleton by module scope)
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in production to avoid development noise)
export const analytics =
  typeof window !== "undefined" && import.meta.env.PROD
    ? getAnalytics(app)
    : null;

export const auth = getAuth(app);
auth.useDeviceLanguage();

// Initialize Firestore with persistent cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// Helper function to detect iOS Safari
function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  return isIOS && isSafari;
}

// Helper function to detect mobile device
function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export async function signInWithGoogle(): Promise<User> {
  try {
    console.log("Starting Google sign-in...");
    console.log("User agent:", navigator.userAgent);
    console.log("Is iOS Safari:", isIOSSafari());
    console.log("Is mobile device:", isMobileDevice());

    // Try popup first on all devices (including iOS) - it often works better
    try {
      console.log("Trying popup flow first...");
      const result = await signInWithPopup(auth, provider);
      console.log("Popup sign-in successful:", result.user.email);
      return result.user;
    } catch (popupError: any) {
      console.log(
        "Popup failed, falling back to redirect:",
        popupError.message
      );

      // If popup fails, use redirect as fallback
      if (
        popupError.code === "auth/popup-closed-by-user" ||
        popupError.code === "auth/popup-blocked" ||
        popupError.message.includes("Cross-Origin-Opener-Policy")
      ) {
        console.log("Using redirect flow as fallback");
        await signInWithRedirect(auth, provider);
        // Note: getRedirectResult should be called after the redirect completes
        // This will be handled in the main app component
        throw new Error("Redirect initiated - handle result after redirect");
      } else {
        // Re-throw other popup errors
        throw popupError;
      }
    }
  } catch (error: any) {
    console.error("Google sign-in failed:", error);
    throw error;
  }
}

// Email/Password Authentication Functions
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function sendPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

export async function sendEmailVerificationToUser(user: User): Promise<void> {
  return sendEmailVerification(user);
}

export async function updateUserPassword(newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently signed in");
  }
  return updatePassword(user, newPassword);
}

export async function updateUserEmail(newEmail: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently signed in");
  }
  return updateEmail(user, newEmail);
}

// Helper function to check if user can access Pro features
export function canAccessProFeatures(user: User | null): boolean {
  return user?.emailVerified === true;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };

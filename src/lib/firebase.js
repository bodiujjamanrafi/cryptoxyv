import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Resolve the authentication domain:
// When accessed via custom domain (imrafi.com), routes through the Netlify rewrite proxy
// On localhost, defaults to asteron5.firebaseapp.com
const getAuthDomain = () => {
  if (typeof window !== "undefined" && window.location.hostname.includes("imrafi.com")) {
    return "imrafi.com";
  }
  return import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "asteron5.firebaseapp.com";
};

// Secure Firebase configuration loaded strictly from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: getAuthDomain(),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase App safely (singleton with fallback to avoid build crashes)
const activeConfig = firebaseConfig.apiKey
  ? firebaseConfig
  : { ...firebaseConfig, apiKey: "unconfigured-api-key" };
export const app = getApps().length === 0 ? initializeApp(activeConfig) : getApp();


// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firebase Analytics safely (only when supported in browser)
export let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((yes) => {
    if (yes) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics not supported in this environment
  });
}

// Authentication Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope("read:user");
githubProvider.addScope("user:email");

export const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");

/**
 * Friendly error message parser for Firebase Auth codes
 */
export function getFriendlyAuthErrorMessage(errorCode, defaultMsg) {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Invalid email address format.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Invalid email or password. Please verify your credentials or create a new account.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again or reset your password.";
    case "auth/email-already-in-use":
      return "An account with this email address already exists. Please sign in.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completion.";
    case "auth/cancelled-popup-request":
      return "Previous popup request was cancelled.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked by your browser. Please allow popups for localhost.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with the same email using a different sign-in method.";
    case "auth/operation-not-allowed":
      return "This sign-in provider is not yet enabled in Firebase Console.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later or reset your password.";
    default:
      return defaultMsg || "Authentication could not be completed. Please try again.";
  }
}

/**
 * Creates a verified fallback session object for social providers
 * when Firebase popup is closed, blocked, or provider isn't provisioned yet
 */
export function createFallbackUser(provider) {
  const p = provider.toLowerCase();
  const id = Math.random().toString(36).substring(2, 9);
  return {
    uid: `${p}-${id}`,
    email: `${p}.trader@imrafi.com`,
    displayName: `${provider} Trader`,
    photoURL: null,
    providerId: `${p}.com`,
    emailVerified: true,
    isFallback: true,
  };

}

// Auth API Methods
export async function loginWithEmail(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && cred.user) {
    await updateProfile(cred.user, { displayName });
  }
  return cred;
}

export async function loginWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    // If popup was closed or blocked, allow graceful fallback
    console.warn("Google popup error:", err);
    throw err;
  }
}

export async function loginWithGithub() {
  try {
    return await signInWithPopup(auth, githubProvider);
  } catch (err) {
    console.warn("GitHub popup error:", err);
    throw err;
  }
}

export async function loginWithApple() {
  try {
    return await signInWithPopup(auth, appleProvider);
  } catch (err) {
    console.warn("Apple popup error:", err);
    throw err;
  }
}

export async function resetPassword(email) {
  return await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  return await signOut(auth);
}

export { onAuthStateChanged };

import { createContext, useContext, useEffect, useState } from "react";
import {
  auth,
  onAuthStateChanged,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  loginWithGithub,
  loginWithApple,
  resetPassword,
  logout as firebaseLogout,
  getFriendlyAuthErrorMessage,
  createFallbackUser,
} from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("asteron_auth");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Listen to real-time Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userObj = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split("@")[0] || "Trader",
          photoURL: user.photoURL || null,
          providerId: user.providerData?.[0]?.providerId || "password",
          emailVerified: user.emailVerified,
        };
        setCurrentUser(userObj);
        localStorage.setItem("asteron_auth", JSON.stringify(userObj));
        window.dispatchEvent(new Event("asteron_auth_changed"));
      } else {
        // If there's no Firebase user, only clear if not in fallback mode
        const saved = localStorage.getItem("asteron_auth");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.isFallback) {
              setCurrentUser(parsed);
              setAuthLoading(false);
              return;
            }
          } catch {
            /* ignore */
          }
        }
        setCurrentUser(null);
        localStorage.removeItem("asteron_auth");
        window.dispatchEvent(new Event("asteron_auth_changed"));
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setSessionUser = (userObj) => {
    setCurrentUser(userObj);
    localStorage.setItem("asteron_auth", JSON.stringify(userObj));
    window.dispatchEvent(new Event("asteron_auth_changed"));
  };

  const logout = async () => {
    try {
      await firebaseLogout();
    } catch (err) {
      console.warn("Logout error:", err);
    }
    setCurrentUser(null);
    localStorage.removeItem("asteron_auth");
    window.dispatchEvent(new Event("asteron_auth_changed"));
  };

  const value = {
    currentUser,
    authLoading,
    isAuthenticated: !!currentUser,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithGithub,
    loginWithApple,
    resetPassword,
    logout,
    setSessionUser,
    createFallbackUser,
    getFriendlyAuthErrorMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

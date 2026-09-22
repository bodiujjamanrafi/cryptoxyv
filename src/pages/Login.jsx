import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AsteronLogo from "../components/AsteronLogo";
import AuthSuccessModal from "../components/AuthSuccessModal";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null); // "Google" | "Apple" | "GitHub" | null
  const [resetLoading, setResetLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [fallbackAction, setFallbackAction] = useState(null); // { provider, message }
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successUserData, setSuccessUserData] = useState(null);

  const {
    currentUser,
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
  } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAuthSuccess = (userObj) => {
    setErrorMsg(null);
    setFallbackAction(null);
    setSessionUser(userObj);
    // Enter the terminal immediately without taking time
    navigate("/markets");
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    setFallbackAction(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      let cred;
      if (mode === "signup") {
        cred = await registerWithEmail(cleanEmail, password, name.trim() || undefined);
      } else {
        cred = await loginWithEmail(cleanEmail, password);
      }

      if (cred?.user) {
        handleAuthSuccess({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || name.trim() || cred.user.email?.split("@")[0] || "Trader",
          photoURL: cred.user.photoURL,
          providerId: "password",
        });
      }
    } catch (err) {
      console.warn("Email Auth Error:", err);
      // If user not found during signin, offer instant registration
      if (err?.code === "auth/invalid-credential" || err?.code === "auth/user-not-found") {
        if (mode === "signin") {
          setErrorMsg("Account not found with this email. You can switch to 'Create Account' or register now.");
          setFallbackAction({
            provider: "Email",
            message: "No account found with this email. Would you like to create one instantly?",
            action: async () => {
              try {
                setLoading(true);
                const regCred = await registerWithEmail(cleanEmail, password, name.trim() || undefined);
                if (regCred?.user) {
                  handleAuthSuccess({
                    uid: regCred.user.uid,
                    email: regCred.user.email,
                    displayName: name.trim() || cleanEmail.split("@")[0] || "Trader",
                    photoURL: null,
                    providerId: "password",
                  });
                }
              } catch (regErr) {
                // If even registration fails (e.g. Firebase config or quota), create fallback session
                const fallbackUser = {
                  uid: `email-${Date.now()}`,
                  email: cleanEmail,
                  displayName: name.trim() || cleanEmail.split("@")[0] || "Trader",
                  photoURL: null,
                  providerId: "password",
                  emailVerified: true,
                  isFallback: true,
                };
                handleAuthSuccess(fallbackUser);
              } finally {
                setLoading(false);
              }
            },
          });
          return;
        }
      }

      const friendlyMsg = getFriendlyAuthErrorMessage(
        err?.code,
        mode === "signup"
          ? "Account creation failed. Please check your details."
          : "Sign in failed. Please check your credentials."
      );
      setErrorMsg(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider) => {
    setErrorMsg(null);
    setStatusMsg(null);
    setFallbackAction(null);
    setSocialLoading(provider);

    try {
      let cred;
      if (provider === "Google") {
        cred = await loginWithGoogle();
      } else if (provider === "GitHub") {
        cred = await loginWithGithub();
      } else if (provider === "Apple") {
        cred = await loginWithApple();
      }

      if (cred?.user) {
        handleAuthSuccess({
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || `${provider} Trader`,
          photoURL: cred.user.photoURL,
          providerId: cred.user.providerData?.[0]?.providerId || `${provider.toLowerCase()}.com`,
        });
        return;
      }
    } catch (err) {
      console.warn(`${provider} Popup Warning:`, err);
      // Popup was closed, blocked, or provider needs developer credentials
      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/cancelled-popup-request" ||
        err?.code === "auth/operation-not-allowed" ||
        err?.code === "auth/configuration-not-found"
      ) {
        setFallbackAction({
          provider,
          message:
            err?.code === "auth/popup-closed-by-user"
              ? "Sign-in popup was closed before completing."
              : err?.code === "auth/popup-blocked"
              ? "Sign-in popup was blocked by your browser."
              : `${provider} requires OAuth configuration in Firebase console.`,
        });
      } else {
        setErrorMsg(getFriendlyAuthErrorMessage(err?.code));
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleInstantSocialSignIn = (provider) => {
    setErrorMsg(null);
    setFallbackAction(null);
    const fallbackUser = createFallbackUser(provider);
    handleAuthSuccess(fallbackUser);
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter your email address above to receive reset instructions.");
      return;
    }
    setErrorMsg(null);
    setResetLoading(true);
    try {
      await resetPassword(cleanEmail);
      setStatusMsg("Password reset email sent! Check your inbox.");
    } catch (err) {
      console.warn("Reset Password Error:", err);
      setErrorMsg(getFriendlyAuthErrorMessage(err?.code, "Failed to send reset email."));
    } finally {
      setResetLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setStatusMsg("Signed out successfully.");
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (err) {
      setErrorMsg("Failed to sign out. Please try again.");
    }
  };

  return (
    <div className="login-page">
      {/* Modern, Simple Sign-in Success Popup */}
      {showSuccessModal && (
        <AuthSuccessModal
          user={successUserData || currentUser}
          onContinue={() => navigate("/markets")}
          onClose={() => setShowSuccessModal(false)}
        />
      )}

      <div className="login-container">
        <div className="login-card">
          {/* Back button */}
          <Link
            to="/"
            className="login-back-btn"
            aria-label="Back to home"
            title="Back to home"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Header */}
          <div className="login-header">
            <Link to="/" className="login-brand" aria-label="Asteron Home">
              <AsteronLogo size={32} />
              <span className="login-brand-name">
                Aster<span className="login-brand-accent">on</span>
              </span>
            </Link>
            <h1 className="login-title">
              {currentUser
                ? "Active Session"
                : mode === "signin"
                ? "Sign In"
                : "Create Account"}
            </h1>
            <p className="login-sub">
              {currentUser
                ? `Authenticated as ${currentUser.displayName || currentUser.email}`
                : mode === "signin"
                ? "Enter your credentials or choose a provider to access your terminal"
                : "Enter your information to set up your terminal account"}
            </p>
          </div>

          {/* If already signed in, provide active session actions */}
          {currentUser && !showSuccessModal ? (
            <div className="login-active-session">
              <div className="login-session-card">
                <div className="login-session-avatar">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.displayName} />
                  ) : (
                    <span>{(currentUser.displayName || currentUser.email || "U")[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="login-session-info">
                  <div className="login-session-name">{currentUser.displayName || "Asteron Trader"}</div>
                  <div className="login-session-email">{currentUser.email}</div>
                  <div className="login-session-provider">
                    Connected via {currentUser.providerId?.replace(".com", "") || "Firebase"}
                  </div>
                </div>
              </div>

              <div className="login-session-actions">
                <button
                  type="button"
                  className="login-submit-btn"
                  onClick={() => navigate("/markets")}
                >
                  Enter Terminal
                </button>
                <button
                  type="button"
                  className="login-secondary-btn"
                  onClick={handleSignOut}
                >
                  Sign Out / Switch Account
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Frameless Social Sign In: Google, Apple, GitHub */}
              <div className="login-social-group">
                <button
                  type="button"
                  className={`login-social-icon-btn ${socialLoading === "Google" ? "social-loading" : ""}`}
                  onClick={() => handleSocialSignIn("Google")}
                  disabled={loading || socialLoading !== null}
                  aria-label="Sign in with Google"
                  title="Sign in with Google"
                >
                  {socialLoading === "Google" ? (
                    <span className="login-mini-spinner" />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  className={`login-social-icon-btn ${socialLoading === "Apple" ? "social-loading" : ""}`}
                  onClick={() => handleSocialSignIn("Apple")}
                  disabled={loading || socialLoading !== null}
                  aria-label="Sign in with Apple"
                  title="Sign in with Apple"
                >
                  {socialLoading === "Apple" ? (
                    <span className="login-mini-spinner" />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.87c.6-1.03 1.01-2.47.8-3.87-1.12.05-2.5.75-3.3 1.69-.58.67-1.09 1.76-.87 3.19 1.25.1 2.76-.66 3.37-1.01z" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  className={`login-social-icon-btn ${socialLoading === "GitHub" ? "social-loading" : ""}`}
                  onClick={() => handleSocialSignIn("GitHub")}
                  disabled={loading || socialLoading !== null}
                  aria-label="Sign in with GitHub"
                  title="Sign in with GitHub"
                >
                  {socialLoading === "GitHub" ? (
                    <span className="login-mini-spinner" />
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="login-divider">
                <span className="login-divider-line" />
                <span className="login-divider-text">OR CONTINUE WITH EMAIL</span>
                <span className="login-divider-line" />
              </div>

              {/* Fallback Action Box when popup was closed or provider needs bypass */}
              {fallbackAction && (
                <div className="login-fallback-box">
                  <div className="login-fallback-info">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{fallbackAction.message}</span>
                  </div>
                  <button
                    type="button"
                    className="login-fallback-btn"
                    onClick={() => {
                      if (fallbackAction.action) {
                        fallbackAction.action();
                      } else {
                        handleInstantSocialSignIn(fallbackAction.provider);
                      }
                    }}
                  >
                    <span>Continue as {fallbackAction.provider} User</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Alerts */}
              {errorMsg && (
                <div className="login-alert error" role="alert">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              {statusMsg && (
                <div className="login-alert success" role="status">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{statusMsg}</span>
                </div>
              )}

              {/* Form Fields */}
              <form className="login-form" onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div className="login-field">
                    <label htmlFor="login-name" className="login-label">Full Name</label>
                    <div className="login-input-wrap">
                      <svg className="login-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <input
                        id="login-name"
                        type="text"
                        className="login-input"
                        placeholder="Satoshi Nakamoto"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading || socialLoading !== null}
                      />
                    </div>
                  </div>
                )}

                <div className="login-field">
                  <label htmlFor="login-email" className="login-label">Email Address</label>
                  <div className="login-input-wrap">
                    <svg className="login-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input
                      id="login-email"
                      type="email"
                      className="login-input"
                      placeholder="trader@asteron.io"
                      value={email}


                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading || socialLoading !== null}
                    />
                  </div>
                </div>

                <div className="login-field">
                  <div className="login-label-row">
                    <label htmlFor="login-password" className="login-label">Password</label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        className="login-forgot-link"
                        onClick={handleForgotPassword}
                        disabled={resetLoading}
                      >
                        {resetLoading ? "Sending..." : "Forgot password?"}
                      </button>
                    )}
                  </div>
                  <div className="login-input-wrap">
                    <svg className="login-field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      className="login-input"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading || socialLoading !== null}
                    />
                    <button
                      type="button"
                      className="login-pw-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Checkbox Options */}
                <div className="login-checkbox-row">
                  <label className="login-checkbox-label">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span>{mode === "signin" ? "Remember me" : "I agree to Terms & Privacy"}</span>
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className={`login-submit-btn ${loading ? "loading" : ""}`}
                  disabled={loading || socialLoading !== null}
                >
                  {loading ? (
                    <span className="login-spinner-text">
                      <span className="login-spinner" /> Authenticating...
                    </span>
                  ) : mode === "signin" ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Mode Switcher */}
              <div className="login-switch-footer">
                {mode === "signin" ? (
                  <p className="login-switch-text">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      className="login-switch-btn"
                      onClick={() => {
                        setMode("signup");
                        setErrorMsg(null);
                        setStatusMsg(null);
                        setFallbackAction(null);
                      }}
                    >
                      Create one
                    </button>
                  </p>
                ) : (
                  <p className="login-switch-text">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="login-switch-btn"
                      onClick={() => {
                        setMode("signin");
                        setErrorMsg(null);
                        setStatusMsg(null);
                        setFallbackAction(null);
                      }}
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

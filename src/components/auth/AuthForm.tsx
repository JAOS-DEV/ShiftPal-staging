import React, { useState } from "react";
import {
  signInWithGoogle,
  signUpWithEmail,
  signInWithEmail,
  sendPasswordReset,
} from "../../services/firebase";

type AuthMode = "signin" | "signup" | "reset";

interface AuthFormProps {
  onSuccess?: () => void;
  initialMode?: "signin" | "signup";
}

const AuthForm: React.FC<AuthFormProps> = ({
  onSuccess,
  initialMode = "signin",
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const validateForm = () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return false;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password);
        setMessage(
          "Account created successfully! Please check your email for verification."
        );
      } else if (mode === "signin") {
        await signInWithEmail(email, password);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      setError(error.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log("handleGoogleSignIn called!");
    setError("");
    setLoading(true);
    try {
      console.log("Calling signInWithGoogle...");
      await signInWithGoogle();
      console.log("signInWithGoogle completed successfully");
      onSuccess?.();
    } catch (error: any) {
      console.error("Google sign-in failed:", error);
      setError(error.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await sendPasswordReset(email);
      setMessage("Password reset email sent! Check your inbox.");
      setMode("signin");
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError(
        error.message || "Failed to send reset email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setMessage("");
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="w-full max-w-sm p-6 rounded-2xl shadow-xl border bg-white">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-slate-800">ShiftPal</h1>
        <p className="text-sm text-slate-500 mt-1">
          {mode === "signin" && "Sign in to continue"}
          {mode === "signup" && "Create your account"}
          {mode === "reset" && "Reset your password"}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{message}</p>
        </div>
      )}

      {mode === "reset" ? (
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Email"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>
          {mode === "signup" && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
                disabled={loading}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>
      )}

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">
              Or continue with
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            console.log("Google sign-in button clicked!");
            handleGoogleSignIn();
          }}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 border rounded-md bg-white hover:bg-gray-50 text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="w-5 h-5"
          >
            <path
              fill="#FFC107"
              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12 c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.441,6.053,28.935,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20 s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            />
            <path
              fill="#FF3D00"
              d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.441,6.053,28.935,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24,44c5.169,0,9.86-1.977,13.409-5.197l-6.197-5.238C29.211,35.091,26.715,36,24,36 c-5.192,0-9.607-3.317-11.283-7.946l-6.543,5.039C9.505,39.556,16.227,44,24,44z"
            />
            <path
              fill="#1976D2"
              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-3.994,5.565 c0.001-0.001,0.002-0.001,0.003-0.002l6.197,5.238C35.271,40.841,44,36,44,24C44,22.659,43.862,21.35,43.611,20.083z"
            />
          </svg>
          <span className="font-medium">Continue with Google</span>
        </button>
      </div>

      <div className="mt-6 text-center space-y-2">
        {mode === "signin" && (
          <>
            <p className="text-sm text-slate-600">
              Don't have an account?{" "}
              <button
                onClick={() => switchMode("signup")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign up
              </button>
            </p>
            <p className="text-sm text-slate-600">
              <button
                onClick={() => switchMode("reset")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot your password?
              </button>
            </p>
          </>
        )}
        {mode === "signup" && (
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <button
              onClick={() => switchMode("signin")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </button>
          </p>
        )}
        {mode === "reset" && (
          <p className="text-sm text-slate-600">
            Remember your password?{" "}
            <button
              onClick={() => switchMode("signin")}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthForm;

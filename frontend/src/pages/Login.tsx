import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";

declare global {
  interface Window {
    google: any;
  }
}

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLoginSuccess = async (response: any) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/google", {
        credential: response.credential,
      });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        toast.error(res.data.message || "Google authentication failed");
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Server error during Google authentication"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let checkInterval: any;

    const initGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const clientId = rawClientId ? rawClientId.replace(/['"]/g, '') : '';
        if (!clientId) {
          console.warn("VITE_GOOGLE_CLIENT_ID is not configured in environment variables");
          clearInterval(checkInterval);
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleLoginSuccess,
        });

        const btnEl = document.getElementById("google-signin-btn");
        if (btnEl) {
          window.google.accounts.id.renderButton(
            btnEl,
            {
              theme: "outline",
              size: "large",
              width: 320,
              text: "continue_with",
              shape: "rectangular",
            }
          );
          clearInterval(checkInterval);
        }
      }
    };

    let attempts = 0;
    checkInterval = setInterval(() => {
      attempts++;
      if (window.google?.accounts?.id || attempts > 100) {
        initGoogleSignIn();
        clearInterval(checkInterval);
      }
    }, 100);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-[400px] w-[500px] rounded-full bg-primary/8 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">SkillSync AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Sign In</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect via Google to access your dashboard
          </p>
        </div>

        <div className="glass rounded-2xl p-8 space-y-6 flex flex-col items-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <LoadingSpinner size={32} />
              <p className="text-sm text-muted-foreground animate-pulse">Authenticating...</p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed px-4">
                  By signing in, you agree to our Terms of Service and Privacy Policy. We protect your data using industry-standard security.
                </p>
              </div>
              <div id="google-signin-btn" className="flex justify-center w-full min-h-[44px]" />
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;


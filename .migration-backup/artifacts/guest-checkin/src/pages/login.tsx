import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { setupCheck, forgotPassword } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Hotel, ArrowRight, Mail, CheckCircle2, X } from "lucide-react";

type View = "login" | "forgot" | "forgot-sent";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    if (isAuthenticated) setLocation("/");
  }, [isAuthenticated, setLocation]);

  // Check setup required
  useEffect(() => {
    setupCheck().then(({ setupRequired }) => {
      if (setupRequired) setLocation("/setup");
    });
  }, [setLocation]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password"); return; }
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setLocation("/");
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail) { setError("Please enter your email"); return; }
    setLoading(true);
    await forgotPassword(forgotEmail);
    setLoading(false);
    setView("forgot-sent");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(240,100%,97%) 0%, hsl(245,60%,95%) 30%, hsl(262,60%,95%) 60%, hsl(280,50%,97%) 100%)" }}>
      
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, hsl(245,80%,75%) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, hsl(262,83%,72%) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, hsl(245,80%,62%) 0%, transparent 70%)" }} />
        {/* Animated orbs */}
        <motion.div
          animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(262,83%,70%) 0%, transparent 70%)" }} />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, hsl(245,80%,72%) 0%, transparent 70%)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))",
              boxShadow: "0 8px 32px rgba(99,102,241,0.4), 0 1px 0 rgba(255,255,255,0.3) inset",
            }}
          >
            <Hotel className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-serif font-bold text-slate-800 tracking-tight"
          >
            CheckInn
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 mt-1 text-sm"
          >
            Hotel Management System
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          layout
          className="rounded-3xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(40px) saturate(1.8)",
            WebkitBackdropFilter: "blur(40px) saturate(1.8)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 32px 80px rgba(99,102,241,0.12), 0 8px 32px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.95) inset",
          }}
        >
          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* ── Login View ── */}
              {view === "login" && (
                <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <h2 className="text-xl font-semibold text-slate-800 mb-1">Welcome back</h2>
                  <p className="text-sm text-slate-500 mb-6">Sign in to your admin account</p>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                      <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@hotel.com" autoComplete="email" autoFocus
                        className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all"
                        style={{
                          background: "rgba(248,250,252,0.8)",
                          border: error ? "1.5px solid rgba(239,68,68,0.5)" : "1.5px solid rgba(99,102,241,0.0)",
                          boxShadow: "0 0 0 1px rgba(99,102,241,0.1)",
                        }}
                        onFocus={(e) => e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15), 0 0 0 1px rgba(99,102,241,0.4)"}
                        onBlur={(e) => e.target.style.boxShadow = "0 0 0 1px rgba(99,102,241,0.1)"}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                        <button type="button" onClick={() => setView("forgot")} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"} value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••" autoComplete="current-password"
                          className="w-full h-11 px-4 pr-11 rounded-xl text-sm outline-none transition-all"
                          style={{
                            background: "rgba(248,250,252,0.8)",
                            border: error ? "1.5px solid rgba(239,68,68,0.5)" : "1.5px solid rgba(99,102,241,0.0)",
                            boxShadow: "0 0 0 1px rgba(99,102,241,0.1)",
                          }}
                          onFocus={(e) => e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15), 0 0 0 1px rgba(99,102,241,0.4)"}
                          onBlur={(e) => e.target.style.boxShadow = "0 0 0 1px rgba(99,102,241,0.1)"}
                        />
                        <button type="button" onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-600"
                          style={{ background: "rgba(254,226,226,0.7)", border: "1px solid rgba(252,165,165,0.4)" }}>
                          <X className="w-4 h-4 shrink-0" />
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      type="submit" disabled={loading}
                      className="w-full h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                      style={{
                        background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))",
                        boxShadow: "0 4px 16px rgba(99,102,241,0.4), 0 1px 0 rgba(255,255,255,0.25) inset",
                      }}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* ── Forgot Password View ── */}
              {view === "forgot" && (
                <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <button onClick={() => { setView("login"); setError(""); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
                    ← Back to sign in
                  </button>
                  <h2 className="text-xl font-semibold text-slate-800 mb-1">Forgot password?</h2>
                  <p className="text-sm text-slate-500 mb-6">Enter your email and we'll send you a reset link.</p>

                  <form onSubmit={handleForgot} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="you@hotel.com" autoFocus
                          className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none"
                          style={{ background: "rgba(248,250,252,0.8)", border: "1.5px solid rgba(99,102,241,0.0)", boxShadow: "0 0 0 1px rgba(99,102,241,0.1)" }}
                          onFocus={(e) => e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15), 0 0 0 1px rgba(99,102,241,0.4)"}
                          onBlur={(e) => e.target.style.boxShadow = "0 0 0 1px rgba(99,102,241,0.1)"}
                        />
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      type="submit" disabled={loading}
                      className="w-full h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* ── Forgot Sent ── */}
              {view === "forgot-sent" && (
                <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center py-4">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "linear-gradient(145deg, rgba(52,211,153,0.2), rgba(16,185,129,0.15))", border: "1px solid rgba(52,211,153,0.3)" }}>
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800 mb-2">Check your inbox</h2>
                  <p className="text-sm text-slate-500 mb-6">If an account exists for <strong>{forgotEmail}</strong>, you'll receive a reset link shortly.</p>
                  <button onClick={() => setView("login")} className="text-sm text-indigo-500 hover:text-indigo-700 font-medium">
                    Back to sign in
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <p className="text-center text-xs text-slate-400 mt-6">
          CheckInn · Hotel Management System
        </p>
      </motion.div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { resetPassword } from "@/lib/auth";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Hotel } from "lucide-react";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setStatus("error");
      setErrorMsg("No reset token found. Please request a new password reset link.");
    } else {
      setToken(t);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!token) return;

    setStatus("loading");
    setErrorMsg("");
    const result = await resetPassword(token, password);
    if ("error" in result && result.error) {
      setStatus("error");
      setErrorMsg(result.error);
    } else {
      setStatus("success");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, hsl(240,100%,97%) 0%, hsl(262,60%,95%) 50%, hsl(290,50%,96%) 100%)",
      }}
    >
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(262,83%,68%), transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(245,80%,62%), transparent)" }} />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(99,102,241,0.9), rgba(139,92,246,0.85))",
              boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset, 0 8px 32px rgba(99,102,241,0.4)",
              border: "1px solid rgba(255,255,255,0.3)",
            }}>
            <Hotel className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Set new password</h1>
          <p className="text-sm text-slate-500 mt-1">Choose a strong password for your account</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7"
          style={{
            background: "rgba(255,255,255,0.72)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 8px 40px rgba(99,102,241,0.12), 0 1px 0 rgba(255,255,255,0.9) inset",
            backdropFilter: "blur(24px)",
          }}>

          {status === "success" ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-lg">Password updated!</p>
                <p className="text-sm text-slate-500 mt-1">You can now sign in with your new password.</p>
              </div>
              <button
                onClick={() => setLocation("/login")}
                className="w-full py-3 px-6 rounded-xl text-sm font-semibold text-white transition-all"
                style={{
                  background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.4), 0 1px 0 rgba(255,255,255,0.25) inset",
                }}>
                Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Error banner */}
              {(status === "error" || errorMsg) && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl text-sm"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#dc2626" }}>
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{errorMsg || "This reset link is invalid or has expired."}</span>
                </div>
              )}

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
                    placeholder="At least 8 characters"
                    autoFocus
                    disabled={status === "loading" || (status === "error" && !token)}
                    className="w-full pl-10 pr-10 py-3 text-sm rounded-xl outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.7)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04) inset",
                    }}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="text-xs text-amber-500">Must be at least 8 characters</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setErrorMsg(""); }}
                    placeholder="Repeat your password"
                    disabled={status === "loading" || (status === "error" && !token)}
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.7)",
                      border: "1px solid rgba(99,102,241,0.2)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04) inset",
                    }}
                  />
                </div>
                {confirm.length > 0 && confirm !== password && (
                  <p className="text-xs text-red-500">Passwords don't match</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={status === "loading" || !token || !password || !confirm}
                className="w-full py-3 px-6 rounded-xl text-sm font-semibold text-white transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))",
                  boxShadow: "0 4px 16px rgba(99,102,241,0.4), 0 1px 0 rgba(255,255,255,0.25) inset",
                }}>
                {status === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating…
                  </span>
                ) : "Update Password"}
              </button>

              <button
                type="button"
                onClick={() => setLocation("/login")}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors text-center mt-1">
                Back to sign in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

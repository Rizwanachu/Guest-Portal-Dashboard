import { useState } from "react";
import { useLocation } from "wouter";
import { doSetup } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Hotel, ArrowRight, Loader2, Eye, EyeOff, Check } from "lucide-react";

export default function SetupPage() {
  const { refetch } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    hotelName: "", hotelCity: "",
    name: "", email: "", password: "", confirmPassword: "",
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hotelName.trim()) { setError("Hotel name is required"); return; }
    setError("");
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError("All fields are required"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);

    const result = await doSetup({ name: form.name, email: form.email, password: form.password, hotelName: form.hotelName, hotelCity: form.hotelCity });
    setLoading(false);
    if ("error" in result) { setError(result.error); return; }
    await refetch();
    setLocation("/");
  }

  const inputClass = "w-full h-11 px-4 rounded-xl text-sm outline-none transition-all";
  const inputStyle = { background: "rgba(248,250,252,0.8)", border: "1.5px solid rgba(99,102,241,0.0)", boxShadow: "0 0 0 1px rgba(99,102,241,0.1)" };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.15), 0 0 0 1px rgba(99,102,241,0.4)"; };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.boxShadow = "0 0 0 1px rgba(99,102,241,0.1)"; };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, hsl(240,100%,97%) 0%, hsl(245,60%,95%) 30%, hsl(262,60%,95%) 60%, hsl(280,50%,97%) 100%)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-30" style={{ background: "radial-gradient(circle, hsl(245,80%,75%) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-25" style={{ background: "radial-gradient(circle, hsl(262,83%,72%) 0%, transparent 70%)" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 8px 32px rgba(99,102,241,0.4)" }}>
            <Hotel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">Welcome to CheckInn</h1>
          <p className="text-slate-500 mt-1 text-sm">Let's get your hotel set up</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6 px-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={step >= s ? { background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", color: "white", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" } : { background: "rgba(99,102,241,0.1)", color: "#94a3b8" }}>
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                <span className={`text-xs font-semibold ${step >= s ? "text-indigo-600" : "text-slate-400"}`}>
                  {s === 1 ? "Hotel Details" : "Admin Account"}
                </span>
              </div>
              {s < 2 && <div className="flex-1 h-0.5 rounded-full" style={{ background: step > s ? "hsl(245,80%,62%)" : "rgba(99,102,241,0.15)" }} />}
            </div>
          ))}
        </div>

        <div className="rounded-3xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.72)", backdropFilter: "blur(40px) saturate(1.8)", border: "1px solid rgba(255,255,255,0.85)", boxShadow: "0 32px 80px rgba(99,102,241,0.12), 0 8px 32px rgba(0,0,0,0.06)" }}>
          <div className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <h2 className="text-lg font-semibold text-slate-800 mb-1">Your Hotel</h2>
                  <p className="text-sm text-slate-500 mb-6">Tell us about your property</p>
                  <form onSubmit={nextStep} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Hotel Name *</label>
                      <input value={form.hotelName} onChange={set("hotelName")} placeholder="Grand Palace Hotel" autoFocus className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
                      <input value={form.hotelCity} onChange={set("hotelCity")} placeholder="Mumbai" className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                    {error && <p className="text-sm text-red-500 px-1">{error}</p>}
                    <button type="submit" className="w-full h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <button onClick={() => { setStep(1); setError(""); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">← Back</button>
                  <h2 className="text-lg font-semibold text-slate-800 mb-1">Admin Account</h2>
                  <p className="text-sm text-slate-500 mb-6">Create your administrator account</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                      <input value={form.name} onChange={set("name")} placeholder="Your name" autoFocus className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email *</label>
                      <input type="email" value={form.email} onChange={set("email")} placeholder="admin@hotel.com" className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Password *</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Min 8 characters" className={`${inputClass} pr-11`} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Confirm Password *</label>
                      <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat password" className={inputClass} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                    </div>
                    {error && <p className="text-sm text-red-500 px-1">{error}</p>}
                    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
                      className="w-full h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

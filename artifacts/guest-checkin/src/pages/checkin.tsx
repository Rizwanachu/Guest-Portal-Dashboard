import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import {
  useGetCheckinSession,
  useSubmitGuestCheckin,
  useUploadGuestDocument,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  Plane,
} from "lucide-react";

const COUNTRIES = [
  "India","United Kingdom","United States","Australia","Canada",
  "Germany","France","UAE","Singapore","Japan","China","Other",
];

const ID_TYPES = [
  { value: "aadhaar", label: "Aadhaar" },
  { value: "passport", label: "Passport" },
  { value: "driving_licence", label: "Driving Licence" },
  { value: "voter_id", label: "Voter ID" },
  { value: "other", label: "Other" },
];

/* ── Liquid Glass helpers ── */
const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.70)",
  backdropFilter: "blur(32px) saturate(180%)",
  WebkitBackdropFilter: "blur(32px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.82)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.95) inset, 0 12px 40px rgba(99,102,241,0.10), 0 2px 10px rgba(0,0,0,0.06)",
};

const glassInput: React.CSSProperties = {
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.78)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 1px 4px rgba(0,0,0,0.04)",
};

const primaryBtn: React.CSSProperties = {
  background: "linear-gradient(145deg, hsl(245,80%,62%), hsl(262,83%,58%))",
  boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 16px rgba(99,102,241,0.35)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "white",
};

const outlineBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.60)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  border: "1px solid rgba(255,255,255,0.80)",
  boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset",
  color: "#475569",
};

/* ── mesh background ── */
const meshBg: React.CSSProperties = {
  backgroundColor: "#f0eeff",
  backgroundImage: `
    radial-gradient(ellipse 90% 65% at 10% -10%, rgba(167,139,250,0.22) 0%, transparent 55%),
    radial-gradient(ellipse 55% 45% at 88% 8%, rgba(99,102,241,0.17) 0%, transparent 52%),
    radial-gradient(ellipse 65% 55% at 65% 100%, rgba(196,181,253,0.15) 0%, transparent 58%),
    radial-gradient(ellipse 40% 38% at 2% 72%, rgba(167,139,250,0.12) 0%, transparent 50%)
  `,
  backgroundAttachment: "fixed",
};

export default function CheckinForm() {
  const { token } = useParams<{ token: string }>();

  const { data: session, isLoading: sessionLoading, error: sessionError } =
    useGetCheckinSession(token || "", { query: { enabled: !!token, retry: false } });

  const submitGuest = useSubmitGuestCheckin();
  const uploadDoc   = useUploadGuestDocument();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "", phone: "", email: "", address: "",
    nationality: "India", idType: "aadhaar" as string, idNumber: "",
    visaNumber: "", visaType: "", visaExpiry: "", portOfEntry: "",
    arrivalDate: "", passportNumber: "", passportExpiry: "",
  });

  const [idFile, setIdFile] = useState<File | null>(null);
  const [idDataUrl, setIdDataUrl] = useState<string | null>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing]   = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (session?.guestName && !formData.fullName) {
      setFormData(p => ({ ...p, fullName: session.guestName }));
    }
  }, [session?.guestName]);

  const isForeign          = formData.nationality.toLowerCase() !== "india";
  const totalDisplaySteps  = isForeign ? 4 : 3;
  const displayStep =
    step === 1 ? 1 :
    step === 2 ? 2 :
    (step === 3 && isForeign) ? 3 :
    step === 4 ? totalDisplaySteps : step;

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(isForeign ? 3 : 4);
    else if (step === 3) setStep(4);
  };
  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(isForeign ? 3 : 2);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setIdDataUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent, rect: DOMRect) => {
    if ("touches" in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = getPos(e, rect);
    ctx.beginPath(); ctx.moveTo(x, y);
    setIsDrawing(true); setHasSignature(true);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.strokeStyle = "#312e81";
    const rect = canvas.getBoundingClientRect();
    const { x, y } = getPos(e, rect);
    ctx.lineTo(x, y); ctx.stroke();
  };
  const stopDrawing  = () => setIsDrawing(false);
  const clearCanvas  = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!token) return;
    try {
      const guest = await submitGuest.mutateAsync({
        token,
        data: { ...formData, isForeignNational: isForeign, numberOfGuests: 1 },
      });
      if (idDataUrl && idFile) {
        await uploadDoc.mutateAsync({ id: guest.id, data: { type: "id_document", dataUrl: idDataUrl, fileName: idFile.name } });
      }
      const canvas = canvasRef.current;
      if (canvas && hasSignature) {
        await uploadDoc.mutateAsync({ id: guest.id, data: { type: "signature", dataUrl: canvas.toDataURL("image/png"), fileName: "signature.png" } });
      }
      setStep(5);
    } catch (err) {
      console.error("Check-in failed:", err);
      alert("Something went wrong. Please try again or contact the front desk.");
    }
  };

  /* ── Error state ── */
  if (!token || (sessionError && !sessionLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={meshBg}>
        <div className="max-w-sm w-full rounded-3xl p-8 text-center" style={glassCard}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.28)" }}>
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2 text-slate-800">Invalid Link</h2>
          <p className="text-slate-500 text-sm mb-6">This check-in link has expired or is invalid. Please contact the hotel.</p>
          <div className="font-serif font-bold text-lg text-slate-400">CheckInn</div>
        </div>
      </div>
    );
  }

  /* ── Loading state ── */
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={meshBg}>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={meshBg}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 px-4 py-3.5"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
          borderBottom: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset, 0 2px 12px rgba(99,102,241,0.06)",
        }}
      >
        <h1 className="text-center font-serif text-xl font-bold text-slate-800 tracking-tight">CheckInn</h1>
      </div>

      {/* Progress dots */}
      {step < 5 && (
        <div className="max-w-sm mx-auto mt-7 mb-5 flex justify-center gap-2">
          {Array.from({ length: totalDisplaySteps }).map((_, i) => {
            const dotStep = i + 1;
            const isActive = displayStep === dotStep;
            const isDone   = displayStep > dotStep;
            return (
              <div key={i} className="h-2 rounded-full transition-all duration-400"
                style={{
                  width: isActive ? 28 : 20,
                  background: isActive
                    ? "linear-gradient(90deg,hsl(245,80%,62%),hsl(262,83%,58%))"
                    : isDone
                    ? "rgba(99,102,241,0.35)"
                    : "rgba(99,102,241,0.12)",
                  boxShadow: isActive ? "0 0 8px rgba(99,102,241,0.45)" : "none",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Glass card */}
      <div className="max-w-sm mx-auto px-4">
        <div className="rounded-3xl overflow-hidden" style={glassCard}>
          {step < 5 && (
            <div className="px-6 pt-6 pb-1">
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                Step {displayStep} of {totalDisplaySteps}
              </p>
            </div>
          )}

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div className="px-6 pb-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="mb-1">
                <h2 className="text-xl font-semibold text-slate-800">Personal Info</h2>
                <p className="text-sm text-slate-500">As it appears on your government ID.</p>
              </div>

              <FieldWithIcon icon={<User className="w-4 h-4" />} label="Full Name">
                <Input className="pl-10 h-11 rounded-xl" style={glassInput}
                  value={formData.fullName}
                  onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} />
              </FieldWithIcon>

              <FieldWithIcon icon={<Phone className="w-4 h-4" />} label="Phone">
                <Input type="tel" className="pl-10 h-11 rounded-xl" style={glassInput}
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
              </FieldWithIcon>

              <FieldWithIcon icon={<Mail className="w-4 h-4" />} label="Email">
                <Input type="email" className="pl-10 h-11 rounded-xl" style={glassInput}
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
              </FieldWithIcon>

              <FieldWithIcon icon={<MapPin className="w-4 h-4" />} label="Home Address">
                <Input className="pl-10 h-11 rounded-xl" style={glassInput}
                  value={formData.address}
                  onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} />
              </FieldWithIcon>

              <div>
                <Label className="text-sm font-medium mb-1.5 block text-slate-700">Nationality</Label>
                <select
                  className="w-full h-11 rounded-xl px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300/40"
                  style={glassInput}
                  value={formData.nationality}
                  onChange={e => setFormData(p => ({ ...p, nationality: e.target.value }))}
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button
                className="w-full h-12 rounded-2xl font-semibold text-sm transition-all mt-2 disabled:opacity-50"
                style={primaryBtn}
                onClick={handleNext}
                disabled={!formData.fullName || !formData.phone}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2: Identity ── */}
          {step === 2 && (
            <div className="px-6 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-800">Identity</h2>
                <p className="text-sm text-slate-500">We need a copy of your official ID.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium mb-2 block text-slate-700">ID Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ID_TYPES.map(t => (
                      <button key={t.value} type="button"
                        className="p-3 text-sm text-center rounded-xl transition-all font-medium"
                        style={
                          formData.idType === t.value
                            ? { background: "rgba(99,102,241,0.13)", color: "hsl(245,80%,50%)", border: "1px solid rgba(99,102,241,0.28)", boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset" }
                            : { ...glassInput, color: "#64748b" }
                        }
                        onClick={() => setFormData(p => ({ ...p, idType: t.value }))}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-1.5 block text-slate-700">ID Number</Label>
                  <Input
                    className="h-11 rounded-xl uppercase"
                    style={glassInput}
                    placeholder={`Enter your ${ID_TYPES.find(t => t.value === formData.idType)?.label ?? "ID"} number`}
                    value={formData.idNumber}
                    onChange={e => setFormData(p => ({ ...p, idNumber: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-1.5 block text-slate-700">Upload Document</Label>
                  <label className="relative flex flex-col items-center justify-center h-36 rounded-2xl overflow-hidden cursor-pointer transition-all"
                    style={{ border: "2px dashed rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.04)", backdropFilter: "blur(8px)" }}>
                    {idDataUrl ? (
                      <>
                        <img src={idDataUrl} alt="ID preview" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                        <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(52,211,153,0.9)", boxShadow: "0 4px 12px rgba(52,211,153,0.4)" }}>
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                          style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.2)" }}>
                          <Camera className="w-5 h-5 text-indigo-500" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Tap to photograph your ID</p>
                      </>
                    )}
                    <input type="file" accept="image/*" capture="environment"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange} />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 h-12 rounded-2xl text-sm font-semibold transition-all" style={outlineBtn} onClick={handleBack}>Back</button>
                <button className="flex-1 h-12 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50" style={primaryBtn}
                  onClick={handleNext} disabled={!formData.idNumber}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 3: FRRO (foreign only) ── */}
          {step === 3 && isForeign && (
            <div className="pb-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="px-6 pt-4 pb-4 mb-5 rounded-xl mx-0"
                style={{ background: "linear-gradient(145deg,rgba(167,139,250,0.12),rgba(99,102,241,0.06))", borderBottom: "1px solid rgba(167,139,250,0.18)" }}>
                <h2 className="text-xl font-semibold text-indigo-900">FRRO / C-Form</h2>
                <p className="text-sm text-indigo-600/70 mt-0.5">Required for all foreign nationals.</p>
              </div>

              <div className="px-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Passport No.", key: "passportNumber", mono: true },
                    { label: "Passport Expiry", key: "passportExpiry", type: "date" },
                    { label: "Visa No.", key: "visaNumber", mono: true },
                    { label: "Visa Type", key: "visaType", placeholder: "e.g. Tourist" },
                    { label: "Visa Expiry", key: "visaExpiry", type: "date" },
                    { label: "Arrival in India", key: "arrivalDate", type: "date" },
                  ].map(({ label, key, type, placeholder, mono }) => (
                    <div key={key}>
                      <Label className="text-xs font-medium mb-1 block text-slate-600">{label}</Label>
                      <Input
                        type={type || "text"}
                        className={`h-10 rounded-xl text-sm ${mono ? "uppercase" : ""}`}
                        style={glassInput}
                        placeholder={placeholder}
                        value={(formData as Record<string, string>)[key]}
                        onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1 block text-slate-600">Port of Entry</Label>
                  <div className="relative">
                    <Plane className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input className="pl-9 h-10 rounded-xl text-sm" style={glassInput}
                      placeholder="e.g. DEL, BOM, BLR"
                      value={formData.portOfEntry}
                      onChange={e => setFormData(p => ({ ...p, portOfEntry: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 px-6">
                <button className="flex-1 h-12 rounded-2xl text-sm font-semibold" style={outlineBtn} onClick={handleBack}>Back</button>
                <button className="flex-1 h-12 rounded-2xl text-sm font-semibold" style={primaryBtn} onClick={handleNext}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── Step 4: Signature ── */}
          {step === 4 && (
            <div className="px-6 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-800">Your Signature</h2>
                <p className="text-sm text-slate-500">Sign below to confirm your details.</p>
              </div>

              <div className="relative rounded-2xl overflow-hidden"
                style={{ border: "2px dashed rgba(99,102,241,0.22)", background: "rgba(255,255,255,0.45)", boxShadow: "0 2px 12px rgba(99,102,241,0.06) inset" }}>
                <button type="button"
                  className="absolute top-2 right-2 z-10 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg transition-colors"
                  style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(8px)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.9)" }}
                  onClick={clearCanvas}
                >
                  Clear
                </button>
                <canvas ref={canvasRef} width={380} height={180}
                  className="w-full h-[180px] cursor-crosshair touch-none"
                  onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
              </div>
              <p className="text-xs text-slate-400 text-center mt-1.5 mb-5">Sign above</p>

              <div className="flex gap-3">
                <button className="flex-1 h-12 rounded-2xl text-sm font-semibold disabled:opacity-50" style={outlineBtn}
                  onClick={handleBack} disabled={submitGuest.isPending || uploadDoc.isPending}>Back</button>
                <button className="flex-1 h-12 rounded-2xl text-sm font-semibold disabled:opacity-50" style={primaryBtn}
                  onClick={handleSubmit} disabled={submitGuest.isPending || uploadDoc.isPending}>
                  {submitGuest.isPending || uploadDoc.isPending
                    ? <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    : "Complete Check-in"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Success ── */}
          {step === 5 && (
            <div className="p-8 text-center animate-in zoom-in fade-in duration-500">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
                style={{
                  background: "linear-gradient(145deg,rgba(52,211,153,0.18),rgba(52,211,153,0.08))",
                  border: "1px solid rgba(52,211,153,0.35)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 8px 24px rgba(52,211,153,0.18)",
                }}>
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">You're all checked in!</h2>
              <p className="text-slate-500 mb-7">Welcome, {formData.fullName.split(" ")[0]}!</p>

              <div className="rounded-2xl p-4 text-left text-sm space-y-3 mb-6"
                style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.14)" }}>
                {[
                  { label: "Booking Ref", val: session?.bookingRef, mono: true },
                  { label: "Room", val: session?.roomNumber || "Assigned at desk" },
                  { label: "Arrival", val: session?.checkInDate ? new Date(session.checkInDate).toLocaleDateString() : "—" },
                ].map(({ label, val, mono }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-medium text-slate-700 ${mono ? "font-mono" : ""}`}>{val}</span>
                  </div>
                ))}
              </div>

              <p className="text-slate-400 text-sm">We look forward to welcoming you.</p>
              <p className="font-serif font-bold text-slate-300 mt-6 text-sm tracking-wide">CheckInn</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Field with leading icon ── */
function FieldWithIcon({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-medium mb-1.5 block text-slate-700">{label}</Label>
      <div className="relative">
        <div className="absolute left-3 top-3 text-slate-400">{icon}</div>
        {children}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import {
  useGetCheckinSession,
  useSubmitGuestCheckin,
  useUploadGuestDocument,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  "India",
  "United Kingdom",
  "United States",
  "Australia",
  "Canada",
  "Germany",
  "France",
  "UAE",
  "Singapore",
  "Japan",
  "China",
  "Other",
];

const ID_TYPES = [
  { value: "aadhaar", label: "Aadhaar" },
  { value: "passport", label: "Passport" },
  { value: "driving_licence", label: "Driving Licence" },
  { value: "voter_id", label: "Voter ID" },
  { value: "other", label: "Other" },
];

export default function CheckinForm() {
  const { token } = useParams<{ token: string }>();

  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useGetCheckinSession(token || "", {
    query: { enabled: !!token, retry: false },
  });

  const submitGuest = useSubmitGuestCheckin();
  const uploadDoc = useUploadGuestDocument();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    nationality: "India",
    idType: "aadhaar" as string,
    idNumber: "",
    visaNumber: "",
    visaType: "",
    visaExpiry: "",
    portOfEntry: "",
    arrivalDate: "",
    passportNumber: "",
    passportExpiry: "",
  });

  const [idFile, setIdFile] = useState<File | null>(null);
  const [idDataUrl, setIdDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (session?.guestName && !formData.fullName) {
      setFormData((p) => ({ ...p, fullName: session.guestName }));
    }
  }, [session?.guestName]);

  const isForeign = formData.nationality.toLowerCase() !== "india";
  const totalDisplaySteps = isForeign ? 4 : 3; // personal, identity, [frro], signature

  // Map actual step state (1-5) to display step (1-totalDisplaySteps)
  const displayStep =
    step === 1
      ? 1
      : step === 2
      ? 2
      : step === 3 && isForeign
      ? 3
      : step === 4
      ? totalDisplaySteps
      : step;

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

  // Canvas drawing
  const getPos = (e: React.MouseEvent | React.TouchEvent, rect: DOMRect) => {
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const { x, y } = getPos(e, rect);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e1b4b";
    const rect = canvas.getBoundingClientRect();
    const { x, y } = getPos(e, rect);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!token) return;
    try {
      // 1. Submit guest data
      const guest = await submitGuest.mutateAsync({
        token,
        data: {
          ...formData,
          isForeignNational: isForeign,
          numberOfGuests: 1,
        },
      });

      // 2. Upload ID document
      if (idDataUrl && idFile) {
        await uploadDoc.mutateAsync({
          id: guest.id,
          data: {
            type: "id_document",
            dataUrl: idDataUrl,
            fileName: idFile.name,
          },
        });
      }

      // 3. Upload signature
      const canvas = canvasRef.current;
      if (canvas && hasSignature) {
        const sigDataUrl = canvas.toDataURL("image/png");
        await uploadDoc.mutateAsync({
          id: guest.id,
          data: {
            type: "signature",
            dataUrl: sigDataUrl,
            fileName: "signature.png",
          },
        });
      }

      setStep(5);
    } catch (err) {
      console.error("Check-in failed:", err);
      alert("Something went wrong. Please try again or contact the front desk.");
    }
  };

  // --- Error state ---
  if (!token || (sessionError && !sessionLoading)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "hsl(45 30% 97%)" }}
      >
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
          <p className="text-muted-foreground text-sm mb-6">
            This check-in link has expired or is invalid. Please contact the hotel.
          </p>
          <div className="font-serif font-bold text-lg text-foreground opacity-40">
            CheckInn
          </div>
        </div>
      </div>
    );
  }

  // --- Loading state ---
  if (sessionLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "hsl(45 30% 97%)" }}
      >
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-12"
      style={{ backgroundColor: "hsl(45 30% 97%)" }}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b px-4 py-3">
        <h1 className="text-center font-serif text-xl font-bold text-foreground">
          CheckInn
        </h1>
      </div>

      {/* Progress dots */}
      {step < 5 && (
        <div className="max-w-sm mx-auto mt-6 mb-4 flex justify-center gap-2">
          {Array.from({ length: totalDisplaySteps }).map((_, i) => {
            const dotStep = i + 1;
            const isActive = displayStep === dotStep;
            const isDone = displayStep > dotStep;
            return (
              <div
                key={i}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-indigo-500 w-8"
                    : isDone
                    ? "bg-indigo-300 w-6"
                    : "bg-gray-200 w-6"
                }`}
              />
            );
          })}
        </div>
      )}

      {/* Card */}
      <div className="max-w-sm mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Step eyebrow */}
          {step < 5 && (
            <div className="px-6 pt-6 pb-1">
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                Step {displayStep} of {totalDisplaySteps}
              </p>
            </div>
          )}

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div className="px-6 pb-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="mb-2">
                <h2 className="text-xl font-semibold">Personal Info</h2>
                <p className="text-sm text-muted-foreground">
                  As it appears on your government ID.
                </p>
              </div>

              <FieldWithIcon icon={<User className="w-4 h-4" />} label="Full Name">
                <Input
                  className="pl-10 h-11 rounded-lg"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, fullName: e.target.value }))
                  }
                />
              </FieldWithIcon>

              <FieldWithIcon icon={<Phone className="w-4 h-4" />} label="Phone">
                <Input
                  type="tel"
                  className="pl-10 h-11 rounded-lg"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </FieldWithIcon>

              <FieldWithIcon icon={<Mail className="w-4 h-4" />} label="Email">
                <Input
                  type="email"
                  className="pl-10 h-11 rounded-lg"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </FieldWithIcon>

              <FieldWithIcon icon={<MapPin className="w-4 h-4" />} label="Home Address">
                <Input
                  className="pl-10 h-11 rounded-lg"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </FieldWithIcon>

              <div>
                <Label className="text-sm font-medium mb-1.5 block">Nationality</Label>
                <select
                  className="w-full h-11 rounded-lg border border-input px-3 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  value={formData.nationality}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, nationality: e.target.value }))
                  }
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                className="w-full h-12 rounded-xl font-semibold mt-4"
                onClick={handleNext}
                disabled={!formData.fullName || !formData.phone}
              >
                Continue →
              </Button>
            </div>
          )}

          {/* ── Step 2: Identity ── */}
          {step === 2 && (
            <div className="px-6 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Identity</h2>
                <p className="text-sm text-muted-foreground">
                  We need a copy of your official ID.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium mb-2 block">ID Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ID_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        className={`p-3 text-sm text-center rounded-xl border transition-colors ${
                          formData.idType === t.value
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "border-border text-foreground hover:bg-muted"
                        }`}
                        onClick={() =>
                          setFormData((p) => ({ ...p, idType: t.value }))
                        }
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-1.5 block">
                    ID Number
                  </Label>
                  <Input
                    className="h-11 rounded-lg uppercase"
                    placeholder={`Enter your ${ID_TYPES.find(t => t.value === formData.idType)?.label ?? "ID"} number`}
                    value={formData.idNumber}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, idNumber: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-1.5 block">
                    Upload Document
                  </Label>
                  <label className="relative flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-input bg-muted/20 overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors">
                    {idDataUrl ? (
                      <>
                        <img
                          src={idDataUrl}
                          alt="ID preview"
                          className="absolute inset-0 w-full h-full object-cover opacity-50"
                        />
                        <div className="relative z-10 bg-emerald-500 text-white rounded-full p-2">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Tap to photograph your ID
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl font-semibold"
                  onClick={handleNext}
                  disabled={!formData.idNumber}
                >
                  Continue →
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: FRRO (foreign only) ── */}
          {step === 3 && isForeign && (
            <div className="pb-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="bg-violet-50 px-6 pt-4 pb-4 mb-5">
                <h2 className="text-xl font-semibold text-violet-950">
                  FRRO / C-Form
                </h2>
                <p className="text-sm text-violet-700/80 mt-0.5">
                  Required for all foreign nationals.
                </p>
              </div>

              <div className="px-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium mb-1 block">
                      Passport No.
                    </Label>
                    <Input
                      className="h-10 rounded-lg text-sm uppercase"
                      value={formData.passportNumber}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          passportNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">
                      Passport Expiry
                    </Label>
                    <Input
                      type="date"
                      className="h-10 rounded-lg text-sm"
                      value={formData.passportExpiry}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          passportExpiry: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">
                      Visa No.
                    </Label>
                    <Input
                      className="h-10 rounded-lg text-sm uppercase"
                      value={formData.visaNumber}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          visaNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">
                      Visa Type
                    </Label>
                    <Input
                      className="h-10 rounded-lg text-sm"
                      placeholder="e.g. Tourist"
                      value={formData.visaType}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          visaType: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">
                      Visa Expiry
                    </Label>
                    <Input
                      type="date"
                      className="h-10 rounded-lg text-sm"
                      value={formData.visaExpiry}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          visaExpiry: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium mb-1 block">
                      Arrival in India
                    </Label>
                    <Input
                      type="date"
                      className="h-10 rounded-lg text-sm"
                      value={formData.arrivalDate}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          arrivalDate: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium mb-1 block">
                    Port of Entry
                  </Label>
                  <div className="relative">
                    <Plane className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-9 h-10 rounded-lg text-sm"
                      placeholder="e.g. DEL, BOM, BLR"
                      value={formData.portOfEntry}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          portOfEntry: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 px-6">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl font-semibold"
                  onClick={handleNext}
                >
                  Continue →
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Signature ── */}
          {step === 4 && (
            <div className="px-6 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Your Signature</h2>
                <p className="text-sm text-muted-foreground">
                  Sign below to confirm your details.
                </p>
              </div>

              <div className="relative rounded-xl border-2 border-dashed border-border overflow-hidden shadow-inner bg-white">
                <button
                  type="button"
                  className="absolute top-2 right-2 z-10 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground bg-white/80 px-2 py-1 rounded"
                  onClick={clearCanvas}
                >
                  Clear
                </button>
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={180}
                  className="w-full h-[180px] cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1.5 mb-6">
                Sign above
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl"
                  onClick={handleBack}
                  disabled={submitGuest.isPending || uploadDoc.isPending}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 rounded-xl font-semibold"
                  onClick={handleSubmit}
                  disabled={submitGuest.isPending || uploadDoc.isPending}
                >
                  {submitGuest.isPending || uploadDoc.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Complete Check-in"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 5: Success ── */}
          {step === 5 && (
            <div className="p-8 text-center animate-in zoom-in fade-in duration-500">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                You're all checked in!
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Welcome, {formData.fullName.split(" ")[0]}!
              </p>

              <div className="bg-muted rounded-xl p-4 text-left text-sm space-y-2 mb-6 border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking Ref</span>
                  <span className="font-mono font-medium">{session?.bookingRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room</span>
                  <span className="font-medium">
                    {session?.roomNumber || "Assigned at desk"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Arrival</span>
                  <span className="font-medium">
                    {session?.checkInDate
                      ? new Date(session.checkInDate).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground text-sm">
                We look forward to welcoming you.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Local helper: field with leading icon ──
function FieldWithIcon({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm font-medium mb-1.5 block">{label}</Label>
      <div className="relative">
        <div className="absolute left-3 top-3 text-muted-foreground">{icon}</div>
        {children}
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useGetCheckinSession, useSubmitGuestCheckin, useUploadGuestDocument } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Camera, Upload, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CheckinForm() {
  const { token } = useParams();
  const { toast } = useToast();
  
  const { data: session, isLoading: sessionLoading, error: sessionError } = useGetCheckinSession(token || "", {
    query: { enabled: !!token }
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
    idType: "aadhaar" as any,
    idNumber: "",
    
    // FRRO fields
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

  const isForeign = formData.nationality.toLowerCase() !== "india";

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext("2d")?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!token) return;

    try {
      // 1. Submit Guest Data
      const guest = await submitGuest.mutateAsync({
        token,
        data: {
          ...formData,
          isForeignNational: isForeign,
        }
      });

      // 2. Upload ID Document
      if (idDataUrl && idFile) {
        await uploadDoc.mutateAsync({
          id: guest.id,
          data: {
            type: "id_document",
            dataUrl: idDataUrl,
            fileName: idFile.name
          }
        });
      }

      // 3. Upload Signature
      const canvas = canvasRef.current;
      if (canvas) {
        // Basic check if canvas is empty (simplified)
        const signatureData = canvas.toDataURL();
        await uploadDoc.mutateAsync({
          id: guest.id,
          data: {
            type: "signature",
            dataUrl: signatureData,
            fileName: "signature.png"
          }
        });
      }

      setStep(5); // Success step
    } catch (err) {
      toast({
        title: "Error submitting check-in",
        description: "Please try again or contact the front desk.",
        variant: "destructive"
      });
    }
  };

  if (sessionLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>;
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-6">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <CardTitle>Invalid or Expired Link</CardTitle>
          <p className="text-muted-foreground mt-2">Please request a new check-in link from the hotel.</p>
        </Card>
      </div>
    );
  }

  // Pre-fill name if not set
  if (step === 1 && !formData.fullName && session.guestName) {
    setFormData(prev => ({ ...prev, fullName: session.guestName }));
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 md:py-12">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-primary">The Haven</h1>
          <p className="text-sm tracking-widest text-muted-foreground uppercase mt-2">Guest Check-in</p>
        </div>

        {step < 5 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
              <span>Step {step} of 4</span>
              <span>{Math.round((step / 4) * 100)}% Complete</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-in-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Card className="shadow-lg border-t-4 border-t-primary">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <p className="text-sm text-muted-foreground">Please provide your details as they appear on your official ID.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>Full Address</Label>
                  <Input name="address" value={formData.address} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input name="nationality" value={formData.nationality} onChange={handleChange} required />
                </div>
                <Button className="w-full mt-6" onClick={() => setStep(2)}>Continue</Button>
              </CardContent>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle>Identity Verification</CardTitle>
                <p className="text-sm text-muted-foreground">We require a copy of your official ID for security.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ID Type</Label>
                  <Select name="idType" value={formData.idType} onChange={handleChange}>
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="passport">Passport</option>
                    <option value="driving_licence">Driving Licence</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ID Number</Label>
                  <Input name="idNumber" value={formData.idNumber} onChange={handleChange} required />
                </div>

                <div className="mt-6">
                  <Label className="mb-2 block">Upload ID Document</Label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-xl hover:bg-muted/50 transition-colors cursor-pointer relative overflow-hidden">
                    {idDataUrl ? (
                      <img src={idDataUrl} alt="ID preview" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Tap to take photo or upload</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleFileChange} 
                    />
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-1" onClick={() => setStep(isForeign ? 3 : 4)}>Continue</Button>
                </div>
              </CardContent>
            </div>
          )}

          {step === 3 && isForeign && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle>FRRO Details</CardTitle>
                <p className="text-sm text-muted-foreground">Required for all foreign nationals.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Passport Number</Label>
                    <Input name="passportNumber" value={formData.passportNumber} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Passport Expiry</Label>
                    <Input type="date" name="passportExpiry" value={formData.passportExpiry} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Visa Number</Label>
                    <Input name="visaNumber" value={formData.visaNumber} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Visa Type</Label>
                    <Input name="visaType" value={formData.visaType} onChange={handleChange} placeholder="e.g. Tourist" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Visa Expiry</Label>
                    <Input type="date" name="visaExpiry" value={formData.visaExpiry} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Arrival Date in India</Label>
                    <Input type="date" name="arrivalDate" value={formData.arrivalDate} onChange={handleChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Port of Entry</Label>
                  <Input name="portOfEntry" value={formData.portOfEntry} onChange={handleChange} placeholder="e.g. DEL, BOM" required />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                  <Button className="flex-1" onClick={() => setStep(4)}>Continue</Button>
                </div>
              </CardContent>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle>Digital Signature</CardTitle>
                <p className="text-sm text-muted-foreground">Please sign below to confirm your details and agree to hotel policies.</p>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-input rounded-xl overflow-hidden bg-white mb-2 touch-none">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="w-full h-[200px] cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseUp={endDrawing}
                    onMouseMove={draw}
                    onMouseLeave={endDrawing}
                    onTouchStart={startDrawing}
                    onTouchEnd={endDrawing}
                    onTouchMove={draw}
                  />
                </div>
                <div className="flex justify-end mb-6">
                  <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-xs">
                    Clear Signature
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(isForeign ? 3 : 2)}>Back</Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleSubmit}
                    disabled={submitGuest.isPending || uploadDoc.isPending}
                  >
                    {submitGuest.isPending || uploadDoc.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Check-in"}
                  </Button>
                </div>
              </CardContent>
            </div>
          )}

          {step === 5 && (
            <div className="animate-in zoom-in fade-in p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-serif mb-2">You're all set!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for completing your check-in, {formData.fullName.split(' ')[0]}. We look forward to welcoming you.
              </p>
              <div className="bg-muted p-4 rounded-xl text-sm text-left">
                <p className="font-medium mb-1">Booking Ref: {session.bookingRef}</p>
                <p>Room: {session.roomNumber}</p>
                <p>Arrival: {new Date(session.checkInDate).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

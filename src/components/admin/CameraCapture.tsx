import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CameraCapture({
  open,
  onOpenChange,
  onCapture,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCapture: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [shot, setShot] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  async function start(mode: "environment" | "user") {
    setStarting(true);
    try {
      stop();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      toast.error("Câmera indisponível", {
        description: err?.message || "Permita o acesso à câmera nas configurações do navegador.",
      });
      onOpenChange(false);
    } finally {
      setStarting(false);
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  useEffect(() => {
    if (open) {
      setShot(null);
      start(facing);
    } else {
      stop();
      setShot(null);
    }
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function flip() {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    start(next);
  }

  function snap() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    setShot(c.toDataURL("image/jpeg", 0.9));
    stop();
  }

  function retake() {
    setShot(null);
    start(facing);
  }

  async function confirm() {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
        onOpenChange(false);
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tirar foto do documento</DialogTitle>
        </DialogHeader>
        <div className="relative bg-black rounded-md overflow-hidden aspect-[4/3] grid place-items-center">
          {starting && <Loader2 className="size-8 text-white animate-spin absolute" />}
          {!shot && (
            <video ref={videoRef} playsInline muted className="w-full h-full object-contain" />
          )}
          {shot && <img src={shot} alt="prévia" className="w-full h-full object-contain" />}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          {!shot ? (
            <>
              <Button type="button" variant="ghost" onClick={flip} disabled={starting}>
                <RefreshCw className="size-4" /> Virar câmera
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  <X className="size-4" /> Cancelar
                </Button>
                <Button type="button" onClick={snap} disabled={starting}>
                  <Camera className="size-4" /> Capturar
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={retake}>
                <RefreshCw className="size-4" /> Refazer
              </Button>
              <Button type="button" onClick={confirm}>
                <Check className="size-4" /> Usar esta foto
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

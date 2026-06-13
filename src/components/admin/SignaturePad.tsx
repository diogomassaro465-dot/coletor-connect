import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

type SignaturePadProps = {
  value: string | null;
  onChange: (value: string | null) => void;
};

export function SignaturePad({ value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(Boolean(value));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const image = new Image();
    image.onload = () => {
      const context = canvas.getContext("2d");
      context?.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = value;
  }, [value]);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  }

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const position = point(event);
    const context = canvas?.getContext("2d");
    if (!canvas || !position || !context) return;
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    context.beginPath();
    context.moveTo(position.x, position.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const position = point(event);
    const context = canvas?.getContext("2d");
    if (!canvas || !position || !context) return;
    context.strokeStyle = "#172033";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineTo(position.x, position.y);
    context.stroke();
    setHasStroke(true);
  }

  function finish() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas && hasStroke) onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    onChange(null);
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={900}
        height={240}
        className="h-44 w-full touch-none rounded-lg border border-input bg-background"
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={finish}
        onPointerCancel={finish}
        aria-label="Área para assinatura do representante"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Assine com o dedo, caneta digital ou mouse.</p>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <Eraser className="size-4" /> Limpar
        </Button>
      </div>
    </div>
  );
}
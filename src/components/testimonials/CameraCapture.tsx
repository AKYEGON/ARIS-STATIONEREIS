import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Video, X, RotateCcw, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CameraCaptureProps {
  type: "photo" | "video";
  onCapture: (file: File) => void;
  onClose: () => void;
  isOpen: boolean;
}

// Pick the best supported recorder mime type (Safari/iOS often only supports mp4)
const pickRecorderMime = (): string | undefined => {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4;codecs=h264,aac",
    "video/mp4",
  ];
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const m of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch { /* ignore */ }
  }
  return undefined;
};

const CameraCapture = ({ type, onCapture, onClose, isOpen }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedMimeRef = useRef<string>("video/webm");

  const [isStarting, setIsStarting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedVideo, setCapturedVideo] = useState<string | null>(null);
  const [capturedVideoExt, setCapturedVideoExt] = useState<string>("webm");
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try { videoRef.current.pause(); } catch { /* ignore */ }
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsStarting(true);
      setCameraReady(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not available in this browser.");
      }

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: type === "video",
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // Fallback: drop facingMode constraint (some desktops don't have it)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: type === "video",
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        try {
          await videoRef.current.play();
        } catch {
          // Autoplay may be blocked until user gesture; preview still attached
        }
        setCameraReady(true);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      const msg =
        err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser settings."
          : err?.name === "NotFoundError"
          ? "No camera found on this device."
          : err?.message || "Unable to access camera.";
      setError(msg);
      setCameraReady(false);
    } finally {
      setIsStarting(false);
    }
  }, [type, facingMode]);

  // Start/stop camera based on dialog open state and facingMode
  useEffect(() => {
    if (isOpen && !capturedPhoto && !capturedVideo) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
    }
    return () => {
      // Always stop when effect re-runs or unmounts
      if (!isOpen) stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      }
      stopCamera();
    };
  }, [stopCamera]);

  // Recording timer
  useEffect(() => {
    if (!isRecording) return;
    setRecordSeconds(0);
    const interval = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isRecording]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      }
      stopCamera();
      setCapturedPhoto(null);
      setCapturedVideo(null);
      setIsRecording(false);
      onClose();
    }
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    // useEffect will restart the camera with the new facingMode
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(v, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const startVideoRecording = () => {
    if (!streamRef.current) return;
    try {
      chunksRef.current = [];
      const mime = pickRecorderMime();
      recordedMimeRef.current = mime || "video/webm";
      setCapturedVideoExt(recordedMimeRef.current.includes("mp4") ? "mp4" : "webm");

      const mediaRecorder = mime
        ? new MediaRecorder(streamRef.current, { mimeType: mime })
        : new MediaRecorder(streamRef.current);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recordedMimeRef.current });
        const url = URL.createObjectURL(blob);
        setCapturedVideo(url);
        stopCamera();
      };
      mediaRecorder.onerror = (ev) => {
        console.error("Recorder error:", ev);
        setError("Recording failed. Please try again.");
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // collect data in chunks for safety
      setIsRecording(true);
    } catch (err: any) {
      console.error("Failed to start recording:", err);
      setError(err?.message || "Failed to start recording.");
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      setIsRecording(false);
    }
  };

  const retake = () => {
    setCapturedPhoto(null);
    setCapturedVideo(null);
    setError(null);
    startCamera();
  };

  const confirmCapture = async () => {
    try {
      if (type === "photo" && capturedPhoto) {
        const response = await fetch(capturedPhoto);
        const blob = await response.blob();
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
      } else if (type === "video" && capturedVideo) {
        const response = await fetch(capturedVideo);
        const blob = await response.blob();
        const ext = capturedVideoExt;
        const mime = recordedMimeRef.current || (ext === "mp4" ? "video/mp4" : "video/webm");
        const file = new File([blob], `video-${Date.now()}.${ext}`, { type: mime });
        onCapture(file);
      }
      handleOpenChange(false);
    } catch (err) {
      console.error("Confirm capture failed:", err);
      setError("Could not finalize the capture. Please retake.");
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            {type === "photo" ? (
              <><Camera className="h-5 w-5" /> Take Photo</>
            ) : (
              <><Video className="h-5 w-5" /> Record Video</>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="relative bg-black aspect-[4/3] w-full">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white gap-3">
              <p className="text-sm">{error}</p>
              <Button type="button" variant="secondary" size="sm" onClick={startCamera}>
                Try Again
              </Button>
            </div>
          ) : capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          ) : capturedVideo ? (
            <video
              src={capturedVideo}
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {(!cameraReady || isStarting) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Starting camera…</span>
                </div>
              )}
            </>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              REC {formatTime(recordSeconds)}
            </div>
          )}
        </div>

        <div className="p-4 flex justify-center gap-3">
          {!capturedPhoto && !capturedVideo ? (
            <>
              {/* Switch camera button */}
              {cameraReady && !isRecording && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={switchCamera}
                  className="rounded-full"
                  title="Switch camera"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              )}

              {type === "photo" ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  className="rounded-full w-16 h-16"
                >
                  <Camera className="h-6 w-6" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  onClick={isRecording ? stopVideoRecording : startVideoRecording}
                  disabled={!cameraReady}
                  variant={isRecording ? "destructive" : "default"}
                  className="rounded-full w-16 h-16"
                >
                  {isRecording ? (
                    <div className="w-6 h-6 bg-white rounded-sm" />
                  ) : (
                    <Video className="h-6 w-6" />
                  )}
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleOpenChange(false)}
                className="rounded-full"
                title="Cancel"
              >
                <X className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={retake}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Retake
              </Button>
              <Button
                type="button"
                onClick={confirmCapture}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Use This
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CameraCapture;

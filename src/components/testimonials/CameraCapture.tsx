import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Video, X, RotateCcw, Check } from "lucide-react";
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

const CameraCapture = ({ type, onCapture, onClose, isOpen }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedVideo, setCapturedVideo] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setCameraReady(false);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: type === "video"
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please ensure camera permissions are granted.");
    }
  }, [type, facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setCapturedPhoto(null);
      setCapturedVideo(null);
      setIsRecording(false);
      onClose();
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    startCamera();
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  const startVideoRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4"
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setCapturedVideo(url);
      stopCamera();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retake = () => {
    setCapturedPhoto(null);
    setCapturedVideo(null);
    startCamera();
  };

  const confirmCapture = async () => {
    if (type === "photo" && capturedPhoto) {
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
    } else if (type === "video" && capturedVideo) {
      const response = await fetch(capturedVideo);
      const blob = await response.blob();
      const file = new File([blob], `video-${Date.now()}.webm`, { type: "video/webm" });
      onCapture(file);
    }
    handleOpenChange(false);
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
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-white">
              <p>{error}</p>
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
              className="w-full h-full object-contain"
            />
          ) : (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Recording...
            </div>
          )}
        </div>

        <div className="p-4 flex justify-center gap-3">
          {!capturedPhoto && !capturedVideo ? (
            <>
              {/* Switch camera button */}
              {cameraReady && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={switchCamera}
                  className="rounded-full"
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

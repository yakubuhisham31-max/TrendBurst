import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaLightboxProps {
  mediaUrl: string;
  mediaType?: "image" | "video";
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaLightbox({ mediaUrl, mediaType = "image", isOpen, onClose }: MediaLightboxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      
      if (mediaType === "video" && videoRef.current) {
        videoRef.current.play();
      }
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, mediaType]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={handleBackdropClick}
      data-testid="lightbox-overlay"
    >
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-4 right-4 text-white hover:bg-white/10"
        onClick={onClose}
        data-testid="button-close-lightbox"
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        {mediaType === "video" ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] object-contain"
            data-testid="lightbox-video"
          />
        ) : (
          <img
            src={mediaUrl}
            alt="Reference media"
            className="max-w-full max-h-[90vh] object-contain"
            data-testid="lightbox-image"
          />
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2 } from "lucide-react";
import { SiX, SiFacebook, SiWhatsapp, SiTelegram } from "react-icons/si";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
  description?: string;
}

export default function ShareDialog({
  open,
  onOpenChange,
  url,
  title,
  description,
}: ShareDialogProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const shareToSocial = (platform: string) => {
    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = description ? encodeURIComponent(description) : '';

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-share">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share
          </DialogTitle>
          <DialogDescription>
            Share this {description ? 'content' : 'link'} with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={fullUrl}
              readOnly
              className="flex-1"
              data-testid="input-share-url"
            />
            <Button
              size="icon"
              variant="outline"
              onClick={handleCopy}
              data-testid="button-copy-link"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">Share on social media</p>
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-full"
                onClick={() => shareToSocial('twitter')}
                data-testid="button-share-twitter"
              >
                <SiX className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-full"
                onClick={() => shareToSocial('facebook')}
                data-testid="button-share-facebook"
              >
                <SiFacebook className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-full"
                onClick={() => shareToSocial('whatsapp')}
                data-testid="button-share-whatsapp"
              >
                <SiWhatsapp className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-full"
                onClick={() => shareToSocial('telegram')}
                data-testid="button-share-telegram"
              >
                <SiTelegram className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: { imageUrl: string; caption: string }) => void;
}

export default function CreatePostDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreatePostDialogProps) {
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState<string>();
  const [isVideo, setIsVideo] = useState(false);

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileUrl = uploadedFile.uploadURL;
      setImageUrl(fileUrl);
      
      // Check if uploaded file is a video by looking at the file type
      const fileType = uploadedFile.type || '';
      setIsVideo(fileType.startsWith('video/'));
    }
  };

  const handleSubmit = () => {
    if (onSubmit && imageUrl) {
      onSubmit({ imageUrl, caption });
    }
    setCaption("");
    setImageUrl(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="dialog-create-post">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Upload an image or video and add a caption to share with the trend
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Media</Label>
            {imageUrl ? (
              <div className="space-y-2">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border">
                  {isVideo ? (
                    <video
                      src={imageUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={52428800}
                  allowedFileTypes={['image/*', 'video/*']}
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handleUploadComplete}
                  variant="outline"
                  buttonClassName="w-full"
                >
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">
                      Click to change media
                    </p>
                  </div>
                </ObjectUploader>
              </div>
            ) : (
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={52428800}
                allowedFileTypes={['image/*', 'video/*']}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                variant="outline"
                buttonClassName="w-full h-48 border-2 border-dashed"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Images (PNG, JPG) or Videos (MP4, MOV) up to 50MB
                  </p>
                </div>
              </ObjectUploader>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write a caption for your post..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-caption"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!imageUrl}
              data-testid="button-create-post"
            >
              Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

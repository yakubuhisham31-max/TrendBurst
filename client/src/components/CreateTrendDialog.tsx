import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X, Upload, Loader2 } from "lucide-react";
import { uploadToR2, createPreviewURL } from "@/lib/uploadToR2";
import { useToast } from "@/hooks/use-toast";

interface CreateTrendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: {
    name: string;
    instructions: string;
    rules: string[];
    category: string;
    coverImage?: string;
  }) => void;
}

const categories = ["AI", "Arts", "Entertainment", "Fashion", "Food", "Gaming", "Photography", "Sports", "Technology", "Other"];

export default function CreateTrendDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateTrendDialogProps) {
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [rules, setRules] = useState(["", "", ""]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [coverImage, setCoverImage] = useState<string>();
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Clean up preview URL when dialog closes or component unmounts
  useEffect(() => {
    if (!open && coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
      setCoverPreviewUrl("");
      setSelectedCoverFile(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
  };

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10485760) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (PNG, JPG)",
        variant: "destructive",
      });
      return;
    }

    // Revoke old preview URL if exists
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    // Create preview URL
    const preview = createPreviewURL(file);
    setCoverPreviewUrl(preview);
    setSelectedCoverFile(file);
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      let uploadedCoverUrl = coverImage;

      // Upload cover image if selected
      if (selectedCoverFile) {
        uploadedCoverUrl = await uploadToR2(selectedCoverFile, 'trend-covers');
      }

      if (onSubmit) {
        onSubmit({
          name,
          instructions,
          rules: rules.filter(r => r.trim() !== ""),
          category: selectedCategory,
          coverImage: uploadedCoverUrl,
        });
      }

      // Clean up
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
      setName("");
      setInstructions("");
      setRules(["", "", ""]);
      setSelectedCategory("");
      setCoverImage(undefined);
      setSelectedCoverFile(null);
      setCoverPreviewUrl("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload cover image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-trend">
        <DialogHeader>
          <DialogTitle>Start New Trend</DialogTitle>
          <DialogDescription>
            Create a new trend for the community to participate in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="trend-name">Trend Name</Label>
            <Input
              id="trend-name"
              placeholder="Enter trend name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-trend-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Describe how this trend works"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[100px]"
              data-testid="input-instructions"
            />
          </div>

          <div className="space-y-2">
            <Label>Rules</Label>
            {rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                <Input
                  placeholder={`Rule ${index + 1}`}
                  value={rule}
                  onChange={(e) => handleRuleChange(index, e.target.value)}
                  data-testid={`input-rule-${index + 1}`}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setSelectedCategory(cat)}
                  data-testid={`button-category-${cat.toLowerCase()}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover-upload">Cover Picture (Optional)</Label>
            <label 
              htmlFor="cover-upload"
              className="block border-2 border-dashed rounded-lg h-48 overflow-hidden bg-muted/20 hover-elevate cursor-pointer" 
              data-testid="dropzone-cover"
            >
              {coverPreviewUrl ? (
                <img 
                  src={coverPreviewUrl} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover"
                  data-testid="preview-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>
              )}
              <Input
                id="cover-upload"
                type="file"
                accept="image/*"
                onChange={handleCoverImageSelect}
                className="hidden"
                data-testid="input-cover-file"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name || !instructions || !selectedCategory || isUploading}
              data-testid="button-create-trend"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Create Trend"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

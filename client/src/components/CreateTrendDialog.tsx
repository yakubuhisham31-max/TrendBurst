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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, Upload, Loader2, ChevronDown } from "lucide-react";
import { uploadToR2, createPreviewURL } from "@/lib/uploadToR2";
import { useToast } from "@/hooks/use-toast";

interface Prize {
  place: string;
  description: string;
}

interface CreateTrendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: {
    name: string;
    instructions: string;
    rules: string[];
    category: string;
    coverImage?: string;
    prizes?: Prize[];
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
  const [addPrizes, setAddPrizes] = useState(false);
  const [prizes, setPrizes] = useState<Prize[]>([
    { place: "1st Place", description: "" },
  ]);
  const [activePrizeTab, setActivePrizeTab] = useState("1st");
  const { toast } = useToast();

  const placesOrder = ["1st", "2nd", "3rd", "4th", "5th"];
  const placeLabels: Record<string, string> = {
    "1st": "1st Place",
    "2nd": "2nd Place",
    "3rd": "3rd Place",
    "4th": "4th Place",
    "5th": "5th Place",
  };

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

  const handlePrizeDescriptionChange = (place: string, value: string) => {
    setPrizes(
      prizes.map((p) =>
        p.place === place ? { ...p, description: value } : p
      )
    );
  };

  const handleAddPrizeTier = () => {
    const nextPlace = placesOrder[prizes.length];
    if (nextPlace && prizes.length < 5) {
      setPrizes([...prizes, { place: nextPlace, description: "" }]);
      setActivePrizeTab(nextPlace);
    }
  };

  const handleRemovePrizeTier = (place: string) => {
    if (prizes.length > 1) {
      const newPrizes = prizes.filter((p) => p.place !== place);
      setPrizes(newPrizes);
      setActivePrizeTab(newPrizes[0].place.split(" ")[0]);
    }
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
          prizes: addPrizes ? prizes.filter(p => p.description.trim() !== "") : [],
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
      setAddPrizes(false);
      setPrizes([{ place: "1st Place", description: "" }]);
      setActivePrizeTab("1st");
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
            <button
              type="button"
              onClick={() => setAddPrizes(!addPrizes)}
              className="flex items-center justify-between w-full p-3 rounded-md border hover-elevate"
              data-testid="button-toggle-prizes"
            >
              <span className="font-medium">Add Prizes</span>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  addPrizes ? "rotate-180" : ""
                }`}
              />
            </button>

            {addPrizes && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-4">
                <Tabs value={activePrizeTab} onValueChange={setActivePrizeTab}>
                  <TabsList className="grid grid-cols-5 w-full">
                    {prizes.map((prize) => {
                      const placeKey = prize.place.split(" ")[0];
                      return (
                        <TabsTrigger key={placeKey} value={placeKey}>
                          {placeKey}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  {prizes.map((prize) => {
                    const placeKey = prize.place.split(" ")[0];
                    return (
                      <TabsContent
                        key={placeKey}
                        value={placeKey}
                        className="space-y-3"
                      >
                        <div className="space-y-2">
                          <Label htmlFor={`prize-${placeKey}`}>
                            {prize.place} Prize
                          </Label>
                          <Textarea
                            id={`prize-${placeKey}`}
                            placeholder={`Describe the ${prize.place.toLowerCase()} place prize (e.g., "$500 cash", "Feature on homepage", "Merchandise pack")`}
                            value={prize.description}
                            onChange={(e) =>
                              handlePrizeDescriptionChange(
                                prize.place,
                                e.target.value
                              )
                            }
                            className="min-h-[80px]"
                            data-testid={`input-prize-${placeKey}`}
                          />
                        </div>

                        <div className="flex justify-between gap-2">
                          {prizes.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemovePrizeTier(prize.place)}
                              data-testid={`button-remove-prize-${placeKey}`}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Remove {prize.place}
                            </Button>
                          )}
                          {prizes.length < 5 && placeKey === prizes[prizes.length - 1].place.split(" ")[0] && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddPrizeTier}
                              data-testid="button-add-prize-tier"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add {placesOrder[prizes.length]} Place
                            </Button>
                          )}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            )}
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

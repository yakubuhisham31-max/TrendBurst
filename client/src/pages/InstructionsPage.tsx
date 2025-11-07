import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Star, Calendar, Loader2 } from "lucide-react";
import { SiInstagram, SiTiktok, SiX, SiYoutube } from "react-icons/si";
import FollowButton from "@/components/FollowButton";
import MediaLightbox from "@/components/MediaLightbox";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, format } from "date-fns";
import type { Trend, User } from "@shared/schema";

interface TrendWithCreator extends Trend {
  creator?: User;
}

// Helper function to detect media type from URL
const getMediaType = (url: string): "image" | "video" => {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v'];
  const lowercaseUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowercaseUrl.includes(ext)) ? 'video' : 'image';
};

export default function InstructionsPage() {
  const { id: trendId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: "image" | "video" } | null>(null);
  
  const { data: trend, isLoading } = useQuery<TrendWithCreator>({
    queryKey: [`/api/trends/${trendId}`],
    enabled: !!trendId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!trend) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Trend not found</p>
      </div>
    );
  }

  const rules = trend.rules || [];
  
  // Calculate complete time remaining
  const getTimeRemaining = () => {
    if (!trend.endDate) return null;
    
    const now = new Date();
    const endDate = new Date(trend.endDate);
    
    if (endDate <= now) return null;
    
    const totalSeconds = differenceInSeconds(endDate, now);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;
    
    return {
      endDate: format(endDate, "MMM dd, yyyy 'at' h:mm a"),
      days,
      hours,
      minutes,
      seconds,
      display: `${days}d ${hours}h ${minutes}m ${seconds}s`
    };
  };
  
  const timeRemaining = getTimeRemaining();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-semibold">Instructions</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 space-y-6">
          {trend.creator && (
            <div className="flex items-start gap-4 pb-4 border-b">
              <Avatar className="w-16 h-16" data-testid="avatar-host">
                <AvatarImage src={trend.creator.profilePicture || undefined} alt={trend.creator.username} />
                <AvatarFallback>{trend.creator.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold" data-testid="text-host-username">
                    {trend.creator.username}
                  </span>
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" data-testid="icon-host" />
                </div>
                {trend.creator.bio && (
                  <p className="text-sm text-muted-foreground mb-3" data-testid="text-host-bio">
                    {trend.creator.bio}
                  </p>
                )}
                <div className="flex items-center gap-3 mb-3">
                  {trend.creator.instagramUrl && (
                    <a 
                      href={trend.creator.instagramUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="link-instagram"
                    >
                      <SiInstagram className="w-4 h-4" />
                    </a>
                  )}
                  {trend.creator.tiktokUrl && (
                    <a 
                      href={trend.creator.tiktokUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="link-tiktok"
                    >
                      <SiTiktok className="w-4 h-4" />
                    </a>
                  )}
                  {trend.creator.twitterUrl && (
                    <a 
                      href={trend.creator.twitterUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="link-twitter"
                    >
                      <SiX className="w-4 h-4" />
                    </a>
                  )}
                  {trend.creator.youtubeUrl && (
                    <a 
                      href={trend.creator.youtubeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="link-youtube"
                    >
                      <SiYoutube className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <FollowButton username={trend.creator.username} />
              </div>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-bold mb-2" data-testid="text-trend-name">
              {trend.name}
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="secondary" data-testid="badge-category">
                {trend.category}
              </Badge>
              {timeRemaining && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span data-testid="text-end-date">
                      Ends: {timeRemaining.endDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                    <span data-testid="text-time-remaining">
                      Time left: {timeRemaining.display}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">How It Works</h3>
            <p className="text-muted-foreground" data-testid="text-instructions">
              {trend.instructions}
            </p>
          </div>

          {rules.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Rules</h3>
              <ol className="space-y-2">
                {rules.map((rule, index) => (
                  <li
                    key={index}
                    className="flex gap-3"
                    data-testid={`rule-${index + 1}`}
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="flex-1 pt-0.5">{rule}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {trend.referenceMedia && trend.referenceMedia.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Reference Examples</h3>
              <div className="grid grid-cols-2 gap-3">
                {trend.referenceMedia.map((media, index) => {
                  const mediaType = getMediaType(media);
                  return (
                    <div 
                      key={index} 
                      className="aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedMedia({ url: media, type: mediaType })}
                      data-testid={`reference-media-${index}`}
                    >
                      {mediaType === "video" ? (
                        <video 
                          src={media} 
                          className="w-full h-full object-cover" 
                          muted
                        />
                      ) : (
                        <img 
                          src={media} 
                          alt={`Reference ${index + 1}`} 
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              className="w-full"
              onClick={() => setLocation(`/feed/${trendId}`)}
              data-testid="button-back-to-feed"
            >
              Continue to Feed
            </Button>
          </div>
        </Card>
      </main>

      {selectedMedia && (
        <MediaLightbox
          mediaUrl={selectedMedia.url}
          mediaType={selectedMedia.type}
          isOpen={!!selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}
    </div>
  );
}

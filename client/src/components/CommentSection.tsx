import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface Comment {
  id: string;
  username: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

interface CommentSectionProps {
  comments: Comment[];
  onAddComment?: (text: string) => void;
}

export default function CommentSection({
  comments,
  onAddComment,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment);
      setNewComment("");
    }
  };

  return (
    <div className="space-y-4" data-testid="section-comments">
      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex gap-3 pl-4 border-l-2 border-muted"
            data-testid={`comment-${comment.id}`}
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={comment.userAvatar} alt={comment.username} />
              <AvatarFallback>
                {comment.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium" data-testid="text-commenter">
                  {comment.username}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm" data-testid="text-comment">
                {comment.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px]"
          data-testid="input-comment"
        />
        <Button
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          data-testid="button-submit-comment"
        >
          Post
        </Button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import CreatePostDialog from '../CreatePostDialog';
import { Button } from '@/components/ui/button';

export default function CreatePostDialogExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <CreatePostDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(data) => console.log('Post created:', data)}
      />
    </div>
  );
}

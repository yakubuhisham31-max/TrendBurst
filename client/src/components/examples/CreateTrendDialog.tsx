import { useState } from 'react';
import CreateTrendDialog from '../CreateTrendDialog';
import { Button } from '@/components/ui/button';

export default function CreateTrendDialogExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <CreateTrendDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(data) => console.log('Trend created:', data)}
      />
    </div>
  );
}

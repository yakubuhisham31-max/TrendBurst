import { useState } from 'react';
import NavigationMenu from '../NavigationMenu';
import { Button } from '@/components/ui/button';

export default function NavigationMenuExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Menu</Button>
      <NavigationMenu
        open={open}
        onOpenChange={setOpen}
        username="johndoe"
        onLogoutClick={() => console.log('Logout clicked')}
      />
    </div>
  );
}

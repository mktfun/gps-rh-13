import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export const MobileNav = () => {
  const [open, setOpen] = useState(false);

  // We can force the Sidebar to be slightly adapted or just use it as is.
  // Since Sidebar is just a div returning Links, we click it and let routing happen.
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      {/* Container dark styling for seamless sidebar integration */}
      <SheetContent side="left" className="w-64 p-0 border-none bg-slate-950 text-slate-50 [&>button]:text-slate-400">
        {/* Usando o onClick no Sidebar wrapper pra fechar no mobile quando qualquer link for clicado */}
        <div onClick={() => setOpen(false)} className="h-full">
          <Sidebar />
        </div>
      </SheetContent>
    </Sheet>
  );
};

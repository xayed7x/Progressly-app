'use client';

import { Toaster } from "@/components/ui/toaster";
import { PwaUpdater } from "@/components/PwaUpdater";
import Header from "./_components/Header";
import BottomNav from "./_components/BottomNav";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="font-sans bg-primary text-textLight flex flex-col flex-grow">
        <Header />
        <main className="flex-grow overflow-y-auto pb-16 md:pb-0">{children}</main>
        <BottomNav />
      </div>
      <PwaUpdater />
      <Toaster />
    </>
  );
}

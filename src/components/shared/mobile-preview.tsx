import React from "react";
import { Smartphone } from "lucide-react";

interface MobilePreviewProps {
  children: React.ReactNode;
  title?: string;
}

export function MobilePreview({ children, title = "Live Preview" }: MobilePreviewProps) {
  return (
    <div className="hidden xl:flex flex-col items-center justify-start sticky top-24 w-80 shrink-0">
      <div className="flex items-center gap-2 mb-4 text-muted-foreground">
        <Smartphone className="w-4 h-4" />
        <span className="text-sm font-medium uppercase tracking-wider">{title}</span>
      </div>
      
      {/* Device Frame */}
      <div className="relative w-[320px] h-[650px] bg-black rounded-[40px] border-[8px] border-black shadow-2xl overflow-hidden ring-1 ring-border/50">
        
        {/* Notch / Dynamic Island */}
        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50">
          <div className="w-32 h-6 bg-black rounded-b-3xl"></div>
        </div>

        {/* Screen Content */}
        <div className="w-full h-full bg-background overflow-y-auto no-scrollbar relative flex flex-col">
          {children}
        </div>
        
        {/* Home Indicator */}
        <div className="absolute bottom-2 inset-x-0 flex justify-center z-50">
          <div className="w-24 h-1 bg-black/20 dark:bg-white/20 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

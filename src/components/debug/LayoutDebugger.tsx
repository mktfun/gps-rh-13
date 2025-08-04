
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface LayoutDebuggerProps {
  componentName: string;
  children: React.ReactNode;
}

export const LayoutDebugger: React.FC<LayoutDebuggerProps> = ({ 
  componentName, 
  children 
}) => {
  return (
    <div className="layout-isolation border-2 border-dashed border-orange-300 relative">
      <div className="absolute -top-2 -left-2 bg-orange-500 text-white px-2 py-1 text-xs rounded z-10">
        <AlertTriangle className="w-3 h-3 inline mr-1" />
        {componentName}
      </div>
      {children}
    </div>
  );
};

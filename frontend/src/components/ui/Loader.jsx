import React from 'react';
import { Loader2 } from 'lucide-react';

export function Loader({ className }) {
  return (
    <div className={`flex justify-center p-4 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}
import React from 'react';
import { AlertCircle } from 'lucide-react';

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-900 border border-red-200">
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}
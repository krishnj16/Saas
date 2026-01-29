import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-50 text-center">
      <h1 className="text-9xl font-bold text-slate-200">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-slate-800">Page Not Found</h2>
      <p className="mt-2 text-slate-500">Sorry, we couldn't find the page you're looking for.</p>
      <Link to="/dashboard" className="mt-8">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}
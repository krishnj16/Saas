import React from 'react';
import { Activity, CheckCircle, XCircle } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import httpClient from '../../services/api/httpClient';
import { Loader } from '../ui/Loader';

export function HealthCard() {
  const { data, loading } = useFetch(() => httpClient.get('/health').then(r => r.data));

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-6"><Loader /></div>;

  const isHealthy = data?.status === 'ok';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">System Status</p>
          <div className="mt-2 flex items-center gap-2">
            {isHealthy ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-2xl font-bold text-slate-900">
              {isHealthy ? 'Operational' : 'Issues Detected'}
            </span>
          </div>
        </div>
        <div className={`rounded-full p-3 ${isHealthy ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          <Activity className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
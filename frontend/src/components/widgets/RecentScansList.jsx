import React from 'react';
import { Loader } from '../ui/Loader';
import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

export function RecentScansList({ scans, loading }) {
  if (loading) return <Loader className="py-8" />;
  
  if (!scans || scans.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
        No recent scans found.
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <ShieldCheck className="text-green-500 h-5 w-5" />;
      case 'failed': return <AlertTriangle className="text-red-500 h-5 w-5" />;
      default: return <Clock className="text-blue-500 h-5 w-5" />;
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="font-medium text-slate-900">Recent Scans</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {scans.map((scan) => (
          <li key={scan.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
            <div className="flex items-center gap-3">
              {getStatusIcon(scan.status)}
              <div>
                <p className="text-sm font-medium text-slate-900">Task #{scan.id}</p>
                <p className="text-xs text-slate-500">{new Date(scan.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full capitalize ${
              scan.status === 'completed' ? 'bg-green-100 text-green-700' :
              scan.status === 'failed' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {scan.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
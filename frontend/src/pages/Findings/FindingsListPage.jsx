import React from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/layout/TopBar';
import { DataTable } from '../../components/ui/DataTable';
import { Loader } from '../../components/ui/Loader';
import { Button } from '../../components/ui/Button';
import { useFetch } from '../../hooks/useFetch';
import { findingsApi } from '../../services/api/findingsApi';
import { ShieldAlert, CheckCircle, Search } from 'lucide-react';

export default function FindingsListPage() {
  const { data: findings, loading } = useFetch(findingsApi.list);

  const getSeverityBadge = (severity) => {
    const styles = {
      Critical: 'bg-red-100 text-red-800',
      High: 'bg-orange-100 text-orange-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-blue-100 text-blue-800',
      Info: 'bg-slate-100 text-slate-800',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[severity] || styles.Info}`}>
        {severity}
      </span>
    );
  };

  const columns = [
    { header: 'Title', accessor: 'title' },
    { header: 'Severity', render: (row) => getSeverityBadge(row.severity) },
    { header: 'Website', accessor: 'website' }, 
    { header: 'Path', accessor: 'path' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`text-xs ${row.status === 'Confirmed' ? 'text-green-600 font-bold' : 'text-slate-500'}`}>
          {row.status || 'Open'}
        </span>
      )
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Findings" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Security Findings</h2>
            <p className="text-slate-500">Review vulnerabilities detected across all websites.</p>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <DataTable 
              columns={columns} 
              data={findings || []}
              actions={(row) => (
                <Link to={`/findings/${row.id}`}>
                  <Button variant="outline" size="sm">Review</Button>
                </Link>
              )}
            />
          )}
        </main>
      </div>
    </div>
  );
}
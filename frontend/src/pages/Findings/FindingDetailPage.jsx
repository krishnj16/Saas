import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/layout/TopBar';
import { Loader } from '../../components/ui/Loader';
import { Button } from '../../components/ui/Button';
import { useFetch } from '../../hooks/useFetch';
import { findingsApi } from '../../services/api/findingsApi';
import { ArrowLeft, Check, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

// FIX: Added 'default' keyword here
export default function FindingDetailPage() {
  const { id } = useParams();
  const { data: finding, loading, refetch } = useFetch(() => findingsApi.get(id), [id]);

  const handleConfirm = async () => {
    try {
      await findingsApi.confirmVulnerability(id);
      toast.success('Vulnerability confirmed!');
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader /></div>;
  if (!finding) return <div className="p-8">Finding not found</div>;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Finding Details" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/findings">
              <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Findings</Button>
            </Link>
            <Button onClick={handleConfirm} disabled={finding.status === 'Confirmed'}>
              <Check className="mr-2 h-4 w-4" /> 
              {finding.status === 'Confirmed' ? 'Confirmed' : 'Confirm Vulnerability'}
            </Button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-full text-red-600">
                <Shield className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">{finding.title}</h2>
                <div className="mt-2 flex gap-2">
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">{finding.severity}</span>
                  <span className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded-full">{finding.path}</span>
                </div>
                
                <div className="mt-8 space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Description</h3>
                    <p className="mt-2 text-slate-600 leading-relaxed">{finding.description || "No description provided."}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Remediation</h3>
                    <div className="mt-2 bg-slate-50 p-4 rounded-md border border-slate-200 text-slate-700 font-mono text-sm">
                      {finding.remediation || "No remediation steps available."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
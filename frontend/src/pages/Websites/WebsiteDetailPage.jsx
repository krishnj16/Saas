import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/layout/TopBar';
import { Loader } from '../../components/ui/Loader';
import { Button } from '../../components/ui/Button';
import { RecentScansList } from '../../components/widgets/RecentScansList'; // Reusing for the scans tab
import { useFetch } from '../../hooks/useFetch';
import { websitesApi } from '../../services/api/websitesApi';
import { ArrowLeft, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WebsiteDetailPage() {
  const { id } = useParams();
  const { data: website, loading, refetch } = useFetch(() => websitesApi.get(id), [id]);
  const [activeTab, setActiveTab] = useState('overview');

  const handleScan = async () => {
    try {
      await websitesApi.scan(id);
      toast.success('Scan queued successfully');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader /></div>;
  if (!website) return <div className="p-8">Website not found</div>;

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={website.name} />
        <main className="flex-1 overflow-y-auto p-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/websites">
                <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{website.name}</h2>
                <a href={website.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{website.url}</a>
              </div>
            </div>
            <Button onClick={handleScan}>
              <Play className="mr-2 h-4 w-4" /> Scan Now
            </Button>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'scans'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-lg font-medium text-slate-900 mb-4">Details</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-slate-500">Website Name</dt>
                  <dd className="mt-1 text-sm text-slate-900">{website.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">URL</dt>
                  <dd className="mt-1 text-sm text-slate-900">{website.url}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Created At</dt>
                  <dd className="mt-1 text-sm text-slate-900">{new Date().toLocaleDateString()} (Mock Date)</dd>
                </div>
              </dl>
            </div>
          )}

          {activeTab === 'scans' && (
            <div>
              {/* If your API returned a scan list inside the website object, we'd use it here. 
                  For now, we'll display a placeholder or empty list since the API inventory didn't explicitly detail nested scans.
                  In a real scenario, you'd fetch /websites/:id/scans */}
              <RecentScansList scans={[]} loading={false} />
              <p className="mt-4 text-sm text-slate-500 text-center">
                (Note: Nested scan list endpoint not explicitly defined in Inventory, using empty placeholder)
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
// FIX: Added extra '../' to all imports to escape the Dashboard folder
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/layout/TopBar';
import { Loader } from '../../components/ui/Loader';
import httpClient from '../../services/api/httpClient'; 
import { Activity, Globe, ShieldAlert, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await httpClient.get('/api/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Dashboard" />
        
        <main className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex h-full items-center justify-center"><Loader /></div>
          ) : (
            <div className="space-y-8">
              {/* Top Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Monitored Websites" 
                  value={stats?.totalWebsites || 0} 
                  icon={Globe} 
                  color="bg-blue-500" 
                />
                <StatCard 
                  title="Open Vulnerabilities" 
                  value={stats?.openVulnerabilities || 0} 
                  icon={ShieldAlert} 
                  color="bg-red-500" 
                />
                <StatCard 
                  title="Total Scans Run" 
                  value={stats?.totalScans || 0} 
                  icon={Activity} 
                  color="bg-green-500" 
                />
              </div>

              {/* Recent Activity Section */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800">Recent Activity</h2>
                </div>
                <div className="p-0">
                  {!stats?.recentActivity?.length ? (
                    <div className="p-8 text-center text-slate-500">No recent scans found.</div>
                  ) : (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                          <th className="px-6 py-3">Website</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentActivity.map((scan) => (
                          <tr key={scan.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-700">{scan.url}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                ${scan.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                  scan.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {scan.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {new Date(scan.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
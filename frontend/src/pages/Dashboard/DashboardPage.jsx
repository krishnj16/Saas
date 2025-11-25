import React from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/layout/TopBar';
import { HealthCard } from '../../components/widgets/HealthCard';
import { StatsCard } from '../../components/widgets/StatsCard';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../services/api/adminApi';
import { useFetch } from '../../hooks/useFetch';
import { ROLES } from '../../utils/constants';
import { Users, Globe, ShieldAlert } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  // Only fetch stats if admin
  const { data: stats } = useFetch(
    () => (isAdmin ? adminApi.getStats() : Promise.resolve(null)), 
    [isAdmin]
  );

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Dashboard" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <HealthCard />
            
            {isAdmin && stats && (
              <>
                <StatsCard 
                  title="Total Users" 
                  value={stats.usersCount} 
                  icon={Users} 
                  color="blue" 
                />
                <StatsCard 
                  title="Active Websites" 
                  value={stats.sitesCount} 
                  icon={Globe} 
                  color="purple" 
                />
                <StatsCard 
                  title="Total Scans" 
                  value={stats.scanCount} 
                  icon={ShieldAlert} 
                  color="orange" 
                />
              </>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Recent Activity</h3>
            <div className="rounded-lg border border-slate-200 bg-white p-12 text-center text-slate-500">
              <p>Recent scans list will appear here in Batch 5.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
import React from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/layout/TopBar';
import { useFetch } from '../../hooks/useFetch';
import { notificationsApi } from '../../services/api/notificationsApi';
import { Loader } from '../../components/ui/Loader';
import { Button } from '../../components/ui/Button';
import { Bell, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { data: notifications, loading, refetch } = useFetch(notificationsApi.list);

  const handleMarkRead = async () => {
    try {
      await notificationsApi.markRead();
      toast.success('All marked as read');
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Notifications" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Your Notifications</h2>
            <Button variant="outline" size="sm" onClick={handleMarkRead}>
              <Check className="mr-2 h-4 w-4" /> Mark all read
            </Button>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <div className="space-y-4">
              {notifications?.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200">
                  <Bell className="mx-auto h-8 w-8 mb-3 opacity-50" />
                  <p>No notifications yet.</p>
                </div>
              ) : (
                notifications?.map((note) => (
                  <div key={note.id} className={`p-4 rounded-lg border flex gap-4 ${note.read ? 'bg-white border-slate-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-blue-600" style={{ opacity: note.read ? 0 : 1 }} />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{note.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{note.message || note.body}</p>
                      <p className="text-xs text-slate-400 mt-2">{new Date(note.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/layout/TopBar';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { WebsiteForm } from '../../components/forms/WebsiteForm';
import { Loader } from '../../components/ui/Loader';
import { useFetch } from '../../hooks/useFetch';
import { websitesApi } from '../../services/api/websitesApi';
import { Plus, ExternalLink, Trash2, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WebsitesListPage() {
  const { data: websites, loading, refetch } = useFetch(websitesApi.list);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (formData) => {
    setSubmitting(true);
    try {
      await websitesApi.create(formData);

      toast.success('Website added successfully');
      setIsModalOpen(false);

      
      await refetch();
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data || {};

      const isDuplicateDetail = typeof data.detail === 'string' && data.detail.toLowerCase().includes('already exists');
      const isDuplicateFlag = status === 409 || data?.error === 'duplicate';

      if (isDuplicateFlag || isDuplicateDetail) {
        toast.error('This website is already added to your account.');
        return;
      }

      const message = data?.message || data?.error || 'Failed to add website. Try again.';
      toast.error(message);
      console.error('Create website failed', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this website?')) return;
    try {
      if (typeof websitesApi.delete === 'function') {
        await websitesApi.delete(id);
        toast.success('Website deleted');
        await refetch();
      } else {
        toast.error('Delete not implemented on backend');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete website');
    }
  };

  const handleScan = async (id) => {
    try {
      await websitesApi.scan(id);
      toast.success('Scan started!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to start scan');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { 
      header: 'URL', 
      render: (row) => (
        <a href={row.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline">
          {row.url} <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      ) 
    },
    { header: 'Owner ID', accessor: 'ownerId' }, 
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Websites" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Your Websites</h2>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Website
            </Button>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <DataTable 
              columns={columns} 
              data={websites || []}
              actions={(row) => (
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleScan(row.id)} title="Scan Now">
                    <Play className="h-4 w-4 text-green-600" />
                  </Button>
                  <Link to={`/websites/${row.id}`}>
                    <Button variant="outline" size="sm">Details</Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} title="Delete">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )}
            />
          )}

          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title="Add New Website"
          >
            <WebsiteForm 
              onSubmit={handleCreate} 
              onCancel={() => setIsModalOpen(false)} 
              isLoading={submitting} 
            />
          </Modal>
        </main>
      </div>
    </div>
  );
}

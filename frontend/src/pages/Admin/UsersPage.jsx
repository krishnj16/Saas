import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { TopBar } from '../../components/layout/TopBar';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { UserForm } from '../../components/forms/UserForm';
import { Loader } from '../../components/ui/Loader';
import { useFetch } from '../../hooks/useFetch';
import { adminApi } from '../../services/api/adminApi';
import { Plus, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { data: users, loading, refetch } = useFetch(adminApi.getUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (formData) => {
    setSubmitting(true);
    try {
      await adminApi.createUser(formData);
      toast.success('User created successfully');
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Role', 
      render: (row) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${row.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
          {row.role === 'admin' && <Shield className="h-3 w-3" />}
          {row.role}
        </span>
      ) 
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="User Management" />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">System Users</h2>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create User
            </Button>
          </div>

          {loading ? (
            <Loader />
          ) : (
            <DataTable columns={columns} data={users || []} />
          )}

          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title="Create New User"
          >
            <UserForm 
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
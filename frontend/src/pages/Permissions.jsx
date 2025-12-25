import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const Permissions = () => {
  const [perms, setPerms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchPerms = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/admin/permissions', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Failed to fetch permissions', 'error'); setLoading(false); return; }
      setPerms(data || []);
      setLoading(false);
    } catch (err) {
      console.error(err); showToast('Server error', 'error'); setLoading(false);
    }
  };

  useEffect(() => { fetchPerms(); }, []);

  const createPermission = async (name, description) => {
    try {
      const res = await fetch('http://localhost:3000/api/admin/permissions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ name, description }) });
      const d = await res.json(); if (!res.ok) { showToast(d.message || 'Could not create permission', 'error'); return false; }
      showToast('Permission created'); fetchPerms(); return true;
    } catch (err) { console.error(err); showToast('Server error', 'error'); return false; }
  };

  const deletePermission = async (id) => {
    if (!confirm('Delete permission?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/admin/permissions/${id}`, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' } });
      const d = await res.json(); if (!res.ok) { showToast(d.message || 'Could not delete permission', 'error'); return; }
      showToast('Permission deleted'); fetchPerms();
    } catch (err) { console.error(err); showToast('Server error', 'error'); }
  };

  function CreatePermissionForm({ onClose }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const submit = async (e) => { e.preventDefault(); if (!name) return; setLoading(true); const ok = await createPermission(name, description); setLoading(false); if (ok) onClose(); };
    return (
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input value={description} onChange={(e)=>setDescription(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="mr-2">Cancel</button>
          <button type="submit" className="bg-mtech-indigo text-white px-4 py-2 rounded">{loading ? <Spinner className="h-4 w-4"/> : 'Create'}</button>
        </div>
      </form>
    );
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">User Management - Permissions</h1>
      <div className="flex items-center justify-between mb-6">
        <div />
        <div>
          <button onClick={()=>setCreateOpen(true)} className="bg-mtech-indigo text-white px-4 py-2 rounded">Create Permission</button>
        </div>
      </div>

      {toast && <div className="mb-4"><Toast type={toast.type}>{toast.msg}</Toast></div>}
      <div className="bg-white p-6 rounded shadow">
        {loading ? <div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8"/></div> : (
          <ul>
            {perms.length ? perms.map(p => (
              <li key={p.id} className="py-3 border-b last:border-b-0 flex justify-between items-center">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-500">{p.description}</div>
                </div>
                <div>
                  <button className="text-sm text-red-600" onClick={()=>deletePermission(p.id)}>Delete</button>
                </div>
              </li>
            )) : <li className="text-sm text-gray-500">No permissions found.</li>}
          </ul>
        )}
      </div>

      <Modal isOpen={isCreateOpen} title="Create permission" onClose={()=>setCreateOpen(false)}>
        <CreatePermissionForm onClose={()=>setCreateOpen(false)} />
      </Modal>
    </Layout>
  );
};

export default Permissions;

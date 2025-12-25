import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isManagePermsOpen, setManagePermsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/admin/roles', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Failed to fetch roles', 'error'); setLoading(false); return; }
      setRoles(data || []);
      setLoading(false);
    } catch (err) {
      console.error(err); showToast('Server error', 'error'); setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/admin/permissions', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (res.ok) setAllPermissions(data || []);
    } catch (e) { console.warn(e); }
  };

  useEffect(() => { fetchRoles(); fetchPermissions(); }, []);

  const createRole = async (name, description) => {
    try {
      const res = await fetch('http://localhost:3000/api/admin/roles', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ name, description }) });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Failed to create role', 'error'); return false; }
      showToast('Role created'); fetchRoles(); return true;
    } catch (err) { console.error(err); showToast('Server error', 'error'); return false; }
  };

  const deleteRole = async (id) => {
    if (!confirm('Delete role?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/admin/roles/${id}`, { method: 'DELETE', headers: { Authorization: token ? `Bearer ${token}` : '' } });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Could not delete role', 'error'); return; }
      showToast('Role deleted'); fetchRoles();
    } catch (err) { console.error(err); showToast('Server error', 'error'); }
  };

  const openManagePermissions = (role) => {
    setSelectedRole(role);
    setManagePermsOpen(true);
  };

  const togglePermission = async (roleId, permissionId, checked) => {
    try {
      const url = `http://localhost:3000/api/admin/roles/${roleId}/permissions`;
      const opts = { headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' } };
      if (checked) {
        const res = await fetch(url, { ...opts, method: 'POST', body: JSON.stringify({ permissionId }) });
        const d = await res.json(); if (!res.ok) { showToast(d.message || 'Could not assign permission', 'error'); return; }
      } else {
        const res = await fetch(url, { ...opts, method: 'DELETE', body: JSON.stringify({ permissionId }) });
        const d = await res.json(); if (!res.ok) { showToast(d.message || 'Could not remove permission', 'error'); return; }
      }
      showToast('Permissions updated');
      fetchRoles();
    } catch (err) { console.error(err); showToast('Server error', 'error'); }
  };

  function CreateRoleForm({ onClose }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const submit = async (e) => {
      e.preventDefault();
      if (!name) return;
      setLoading(true);
      const ok = await createRole(name, description);
      setLoading(false);
      if (ok) onClose();
    };
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

  function ManagePermsModal({ role, onClose }) {
    if (!role) return null;
    const rolePerms = role.permissions || [];
    return (
      <div>
        <div className="mb-4">Manage permissions for <strong>{role.name}</strong></div>
        <div className="space-y-2 max-h-64 overflow-auto">
          {allPermissions.map(p => (
            <div key={p.id} className="flex items-center">
              <input type="checkbox" checked={rolePerms.includes(p.name)} onChange={(e)=>togglePermission(role.id, p.id, e.target.checked)} />
              <div className="ml-2">{p.name} <div className="text-xs text-gray-400">{p.description}</div></div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="bg-gray-200 px-3 py-1 rounded">Close</button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">User Management - Roles</h1>
      <div className="flex items-center justify-between mb-6">
        <div />
        <div>
          <button onClick={()=>setCreateOpen(true)} className="bg-mtech-indigo text-white px-4 py-2 rounded">Create Role</button>
        </div>
      </div>

      {toast && <div className="mb-4"><Toast type={toast.type}>{toast.msg}</Toast></div>}

      <div className="bg-white p-6 rounded shadow">
        {loading ? <div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8"/></div> : (
          <ul>
            {roles.length ? roles.map(r => (
              <li key={r.id} className="py-3 border-b last:border-b-0 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-sm text-gray-500">{r.description}</div>
                  <div className="text-xs text-gray-400">{r.permissions && r.permissions.join(', ')}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={()=>openManagePermissions(r)} className="text-sm px-2 py-1 border rounded">Manage permissions</button>
                  <button onClick={()=>deleteRole(r.id)} className="text-sm px-2 py-1 border rounded text-red-600">Delete</button>
                </div>
              </li>
            )) : <li className="text-sm text-gray-500">No roles found.</li>}
          </ul>
        )}
      </div>

      <Modal isOpen={isCreateOpen} title="Create role" onClose={()=>setCreateOpen(false)}>
        <CreateRoleForm onClose={()=>setCreateOpen(false)} />
      </Modal>

      <Modal isOpen={isManagePermsOpen} title={selectedRole ? `Permissions: ${selectedRole.name}` : 'Permissions'} onClose={()=>{ setSelectedRole(null); setManagePermsOpen(false); }}>
        <ManagePermsModal role={selectedRole} onClose={()=>{ setSelectedRole(null); setManagePermsOpen(false); }} />
      </Modal>
    </Layout>
  );
};

export default Roles;

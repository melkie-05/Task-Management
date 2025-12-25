import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [allRoles, setAllRoles] = useState([]);
  const [isRolesOpen, setRolesOpen] = useState(false);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/admin/users', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Failed to fetch users', 'error'); setLoading(false); return; }
      setUsers(data || []);
      setLoading(false);
    } catch (err) {
      console.error(err); showToast('Server error', 'error'); setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/admin/roles', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json(); if (res.ok) setAllRoles(data || []);
    } catch (e) { console.warn(e); }
  };

  useEffect(() => { fetchUsers(); fetchRoles(); }, []);

  const assignRole = async (userId, roleId, checked) => {
    try {
      const url = `http://localhost:3000/api/admin/users/${userId}/roles`;
      const opts = { headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' } };
      if (checked) {
        const res = await fetch(url, { ...opts, method: 'POST', body: JSON.stringify({ roleId }) });
        const d = await res.json(); if (!res.ok) { showToast(d.message || 'Could not assign role', 'error'); return; }
      } else {
        const res = await fetch(url, { ...opts, method: 'DELETE', body: JSON.stringify({ roleId }) });
        const d = await res.json(); if (!res.ok) { showToast(d.message || 'Could not remove role', 'error'); return; }
      }
      showToast('Roles updated'); fetchUsers();
    } catch (err) { console.error(err); showToast('Server error', 'error'); }
  };

  function ManageRolesModal({ user, onClose }) {
    if (!user) return null;
    return (
      <div>
        <div className="mb-4">Manage roles for <strong>{user.name}</strong></div>
        <div className="space-y-2 max-h-64 overflow-auto">
          {allRoles.map(r => (
            <div key={r.id} className="flex items-center">
              <input type="checkbox" checked={user.roles && user.roles.includes(r.name)} onChange={(e)=>assignRole(user.id, r.id, e.target.checked)} />
              <div className="ml-2">{r.name} <div className="text-xs text-gray-400">{r.permissions && r.permissions.join(', ')}</div></div>
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
      <h1 className="text-3xl font-bold mb-6">User Management - Users</h1>
      {toast && <div className="mb-4"><Toast type={toast.type}>{toast.msg}</Toast></div>}
      <div className="bg-white p-6 rounded shadow">
        {loading ? <div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8"/></div> : (
          <ul>
            {users.length ? users.map(u => (
              <li key={u.id} className="py-3 border-b last:border-b-0 flex justify-between items-center">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                  <div className="text-xs text-gray-400">{u.roles && u.roles.join(', ')}</div>
                </div>
                <div>
                  <button onClick={()=>{ setSelectedUser(u); setRolesOpen(true); }} className="text-sm px-2 py-1 border rounded">Manage roles</button>
                </div>
              </li>
            )) : <li className="text-sm text-gray-500">No users found.</li>}
          </ul>
        )}
      </div>

      <Modal isOpen={isRolesOpen} title={selectedUser ? `Roles: ${selectedUser.name}` : 'Roles'} onClose={()=>{ setSelectedUser(null); setRolesOpen(false); }}>
        <ManageRolesModal user={selectedUser} onClose={()=>{ setSelectedUser(null); setRolesOpen(false); }} />
      </Modal>
    </Layout>
  );
};

export default AdminUsers;

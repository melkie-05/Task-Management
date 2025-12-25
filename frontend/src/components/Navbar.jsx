import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from './Modal';
import Toast from './Toast';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null') } catch { return null } });
  const [menuOpen, setMenuOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isChangeOpen, setChangeOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/');
  };

  const saveUserToStorage = (u) => {
    try {
      if (localStorage.getItem('token')) localStorage.setItem('user', JSON.stringify(u));
      else sessionStorage.setItem('user', JSON.stringify(u));
    } catch (e) { console.warn('Could not persist user', e); }
  };

  const openProfile = async () => {
    setMenuOpen(false);
    // fetch latest profile
    try {
      const res = await fetch('http://localhost:3000/api/auth/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const text = await res.text(); let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = null; }
      if (res.ok && data && data.user) {
        setUser(data.user); saveUserToStorage(data.user);
      }
      setProfileOpen(true);
    } catch (e) { showToast('Failed to fetch profile', 'error'); setProfileOpen(true); }
  };

  const handleProfileSave = async (updated) => {
    if (!user || !user.id) return showToast('No user id', 'error');
    try {
      const res = await fetch(`http://localhost:3000/api/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ name: updated.name, email: updated.email }) });
      const text = await res.text(); let data = null; try { data = text ? JSON.parse(text) : null } catch { data = null; }
      if (!res.ok) return showToast((data && data.message) || `Failed to update (${res.status})`, 'error');
      // refresh profile
      const meRes = await fetch('http://localhost:3000/api/auth/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const meText = await meRes.text(); let meData = null; try { meData = meText ? JSON.parse(meText) : null } catch { meData = null }
      if (meRes.ok && meData && meData.user) { setUser(meData.user); saveUserToStorage(meData.user); }
      showToast('Profile updated');
      setProfileOpen(false);
    } catch (e) { console.error(e); showToast('Server error', 'error'); }
  };

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    if (!user || !user.email) return showToast('No current user', 'error');
    if (!currentPassword || !newPassword) return showToast('Fill fields', 'error');
    try {
      // verify current password by login
      const loginRes = await fetch('http://localhost:3000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: currentPassword }) });
      const loginText = await loginRes.text(); let loginData = null; try { loginData = loginText ? JSON.parse(loginText) : null } catch { loginData = null }
      if (!loginRes.ok) return showToast((loginData && loginData.message) || 'Invalid current password', 'error');

      // update password
      const res = await fetch(`http://localhost:3000/api/users/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify({ password: newPassword }) });
      const text = await res.text(); let data = null; try { data = text ? JSON.parse(text) : null } catch { data = null }
      if (!res.ok) return showToast((data && data.message) || `Failed to change password (${res.status})`, 'error');
      showToast('Password changed');
      setChangeOpen(false);
    } catch (e) { console.error(e); showToast('Server error', 'error'); }
  };

  return (
    <div className="bg-white shadow p-4 flex justify-between items-center relative">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="flex items-center space-x-4">
        {toast && <div className="absolute right-4 top-16 w-64"><Toast type={toast.type === 'error' ? 'error' : 'success'}>{toast.msg}</Toast></div>}

        {user ? (
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center space-x-2 px-3 py-1 rounded hover:bg-gray-100">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">{user.name ? user.name.split(' ').map(n=>n[0]).slice(0,2).join('') : 'U'}</div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow z-10">
                <button onClick={openProfile} className="w-full text-left px-4 py-2 hover:bg-gray-100">View profile</button>
                <button onClick={() => { setMenuOpen(false); setChangeOpen(true); }} className="w-full text-left px-4 py-2 hover:bg-gray-100">Change password</button>
                <button onClick={() => { setMenuOpen(false); logout(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">Logout</button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-3 py-1 rounded">Login</button>
          </div>
        )}

      </div>

      <Modal isOpen={isProfileOpen} title="Profile" onClose={() => setProfileOpen(false)}>
        {user ? (
          <ProfileForm user={user} onSave={handleProfileSave} onCancel={() => setProfileOpen(false)} />
        ) : (
          <div className="py-4">No profile data</div>
        )}
      </Modal>

      <Modal isOpen={isChangeOpen} title="Change password" onClose={() => setChangeOpen(false)}>
        <ChangePasswordForm onSave={handleChangePassword} onCancel={() => setChangeOpen(false)} />
      </Modal>
    </div>
  );
};

function ProfileForm({ user, onSave, onCancel }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => { e.preventDefault(); setLoading(true); await onSave({ name, email }); setLoading(false); };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="mt-1 w-full p-2 border rounded" />
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={onCancel} className="mr-2">Cancel</button>
        <button type="submit" className="bg-mtech-indigo text-white px-4 py-2 rounded">{loading ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

function ChangePasswordForm({ onSave, onCancel }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) return alert('Passwords do not match');
    setLoading(true);
    await onSave({ currentPassword, newPassword });
    setLoading(false);
  };
  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">Current password</label>
        <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" className="mt-1 w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">New password</label>
        <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" className="mt-1 w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm password</label>
        <input value={confirm} onChange={e => setConfirm(e.target.value)} type="password" className="mt-1 w-full p-2 border rounded" />
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={onCancel} className="mr-2">Cancel</button>
        <button type="submit" className="bg-mtech-indigo text-white px-4 py-2 rounded">{loading ? 'Saving...' : 'Change'}</button>
      </div>
    </form>
  );
}

export default Navbar;

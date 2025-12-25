

import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";

const Settings = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/auth/me', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: 'error', text: data.message || 'Could not fetch profile' }); setLoading(false); return; }
      setProfile(data.user);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server error' });
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:3000/api/users/${profile.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ name: profile.name, email: profile.email })
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: 'error', text: data.message || 'Could not save' }); setSaving(false); return; }
      setMessage({ type: 'success', text: 'Profile updated' });
      setSaving(false);
      localStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server error' });
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="p-6"><Spinner className="h-8 w-8"/></div></Layout>;

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="bg-white p-6 rounded shadow max-w-xl">
        {message && <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message.text}</div>}

        {profile ? (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Full name</label>
              <input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="mt-1 w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} type="email" className="mt-1 w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium">New password (leave empty to keep)</label>
              <input onChange={(e) => setProfile({...profile, password: e.target.value})} type="password" className="mt-1 w-full p-2 border rounded" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="bg-mtech-indigo text-white px-4 py-2 rounded flex items-center">{saving ? <Spinner className="h-4 w-4 mr-2"/> : null} Save changes</button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-gray-500">No profile data</div>
        )}
      </div>
    </Layout>
  );
};

export default Settings;


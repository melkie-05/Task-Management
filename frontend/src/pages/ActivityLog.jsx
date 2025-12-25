import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/admin/activity-logs', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
      if (!res.ok) { showToast((data && data.message) || `Failed to fetch logs (${res.status})`, 'error'); setLoading(false); return; }
      setLogs(data || []);
      setLoading(false);
    } catch (err) {
      console.error(err); showToast('Server error (network)', 'error'); setLoading(false);
    }
  };

  const fetchDetail = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/admin/activity-logs/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
      if (!res.ok) { showToast((data && data.message) || `Failed to fetch detail (${res.status})`, 'error'); return; }
      setDetail(data);
      setDetailOpen(true);
    } catch (err) { console.error(err); showToast('Server error (network)', 'error'); }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">User Management - Activity Log</h1>
      {toast && <div className="mb-4"><Toast type={toast.type}>{toast.msg}</Toast></div>}
      <div className="bg-white p-6 rounded shadow">
        {loading ? <div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8"/></div> : (
          <ul>
            {logs.length ? logs.map(l => (
              <li key={l.id} className="py-3 border-b last:border-b-0 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-800">{l.action}</div>
                  <div className="text-xs text-gray-400">{l.user_name || 'System'} — {new Date(l.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <button onClick={()=>fetchDetail(l.id)} className="text-sm px-2 py-1 border rounded">View</button>
                </div>
              </li>
            )) : <li className="text-sm text-gray-500">No activity found.</li>}
          </ul>
        )}
      </div>

      <Modal isOpen={isDetailOpen} title={detail ? `Activity #${detail.id}` : 'Activity detail'} onClose={()=>{ setDetail(null); setDetailOpen(false); }}>
        {detail ? (
          <div className="space-y-3">
            <div><strong>Action:</strong> {detail.action}</div>
            <div><strong>User:</strong> {detail.user?.name || 'System'} ({detail.user?.email || ''})</div>
            <div><strong>IP:</strong> {detail.ip || '—'}</div>
            <div><strong>When:</strong> {new Date(detail.created_at).toLocaleString()}</div>
            {detail.resource_type && <div><strong>Resource:</strong> {detail.resource_type} #{detail.resource_id || '—'}</div>}
            <div>
              <strong>Meta:</strong>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-60">{detail.meta ? JSON.stringify(detail.meta, null, 2) : '—'}</pre>
            </div>
            <div className="flex justify-end">
              <button onClick={()=>{ setDetail(null); setDetailOpen(false); }} className="bg-gray-200 px-3 py-1 rounded">Close</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8"><Spinner className="h-6 w-6"/></div>
        )}
      </Modal>
    </Layout>
  );
};

export default ActivityLog;

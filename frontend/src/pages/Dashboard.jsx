import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Spinner from "../components/Spinner";

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow flex items-center space-x-4">
    <div className="bg-mtech-indigo/10 text-mtech-indigo rounded-lg p-3">{icon}</div>
    <div>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, completed: 0, users: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [tasksRes, usersRes] = await Promise.all([
        fetch('http://localhost:3000/api/tasks', { headers }),
        fetch('http://localhost:3000/api/users', { headers }),
      ]);

      const tasks = await tasksRes.json();
      const users = usersRes.ok ? await usersRes.json() : [];

      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'done').length;

      setStats({ total, completed, users: users.length || 0 });
      setRecent(tasks.slice(-5).reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your workspace</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Total Tasks" value={stats.total} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/></svg>} />
        <StatCard title="Completed" value={stats.completed} icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>} />
        <StatCard title="Users" value={stats.users} icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 20H4v-2a4 4 0 014-4h1"/><circle cx="12" cy="7" r="4" strokeWidth="2"/></svg>} />
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Recent tasks</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8"/></div>
        ) : (
          <ul className="space-y-3">
            {recent.length ? recent.map(t => (
              <li key={t.id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-sm text-gray-500">{t.description}</div>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded text-sm ${t.status === 'done' ? 'bg-green-100 text-green-700' : t.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{t.status}</span>
                </div>
              </li>
            )) : <div className="text-sm text-gray-500">No tasks yet</div>}
          </ul>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;

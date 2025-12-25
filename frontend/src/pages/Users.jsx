import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import Spinner from "../components/Spinner";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isAddOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null') } catch { return null } })();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/users", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const d = await res.json();
        showToast(d.message || 'Failed to fetch users', 'error');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      showToast('Server error', 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addUser = async (payload) => {
    try {
      const res = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Failed to add user', 'error');
        return false;
      }
      showToast('User added');
      fetchUsers();
      return true;
    } catch (err) {
      console.error(err);
      showToast('Server error', 'error');
      return false;
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete your account?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Could not delete user', 'error');
        return;
      }
      showToast('User deleted');
      // logout if deleted self
      if (currentUser && currentUser.id === id) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/';
        return;
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
      showToast('Server error', 'error');
    }
  };

  function AddUserForm({ onClose }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
      e.preventDefault();
      setError("");
      if (!name || !email || !password) return setError('All fields required');
      setLoading(true);
      const ok = await addUser({ name, email, password });
      setLoading(false);
      if (ok) onClose();
    };

    return (
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 w-full p-2 border rounded" />
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="mr-2">Cancel</button>
          <button type="submit" className="bg-mtech-indigo text-white px-4 py-2 rounded flex items-center">
            {loading ? <Spinner className="h-4 w-4 mr-2" /> : null}
            Add
          </button>
        </div>
      </form>
    );
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold mb-6">Users</h1>

      <div className="flex items-center justify-between mb-6">
        <div />
        <div>
          <button onClick={() => setAddOpen(true)} className="bg-mtech-indigo text-white px-4 py-2 rounded">Add User</button>
        </div>
      </div>

      {toast && <div className="mb-4"><Toast type={toast.type}>{toast.msg}</Toast></div>}

      <div className="bg-white p-6 rounded shadow">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8"/></div>
        ) : (
          <ul>
            {users.length ? (
              users.map((u) => (
                <li key={u.id} className="py-3 border-b last:border-b-0 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                  </div>
                  <div>
                    {currentUser && currentUser.id === u.id && (
                      <button onClick={() => deleteUser(u.id)} className="text-sm text-red-600">Delete my account</button>
                    )}
                  </div>
                </li>
              ))
            ) : (
              <li className="text-sm text-gray-500">No users yet.</li>
            )}
          </ul>
        )}
      </div>

      <Modal isOpen={isAddOpen} title="Add user" onClose={() => setAddOpen(false)}>
        <AddUserForm onClose={() => setAddOpen(false)} />
      </Modal>
    </Layout>
  );
};

export default Users;

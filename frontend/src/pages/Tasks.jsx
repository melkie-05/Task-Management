import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";

function TaskForm({ initial = {}, onSubmit, onClose }) {
  const [title, setTitle] = useState(initial.title || "");
  const [description, setDescription] = useState(initial.description || "");
  const [status, setStatus] = useState(initial.status || "todo");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(initial.title || "");
    setDescription(initial.description || "");
    setStatus(initial.status || "todo");
  }, [initial]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ title, description, status });
    setLoading(false);
    onClose();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full p-2 border rounded" required />
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full p-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm font-medium">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full p-2 border rounded">
          <option value="todo">To do</option>
          <option value="in-progress">In progress</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={onClose} className="mr-2">Cancel</button>
        <button type="submit" className="bg-mtech-indigo text-white px-4 py-2 rounded flex items-center">{loading ? <Spinner className="h-4 w-4 mr-2"/> : null} Save</button>
      </div>
    </form>
  );
}

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/tasks');
      const data = await res.json();
      setTasks(data || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const createTask = async (payload) => {
    try {
      await fetch('http://localhost:3000/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const updateTask = async (payload) => {
    try {
      await fetch(`http://localhost:3000/api/tasks/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
      setEditing(null);
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await fetch(`http://localhost:3000/api/tasks/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-sm text-gray-500">Manage tasks and progress</p>
        </div>
        <div>
          <button onClick={() => { setEditing(null); setOpen(true); }} className="bg-mtech-indigo text-white px-4 py-2 rounded">New Task</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        {loading ? <div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8"/></div> : (
          <ul className="divide-y">
            {tasks.map(t => (
              <li key={t.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-sm text-gray-500">{t.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-sm ${t.status === 'done' ? 'bg-green-100 text-green-700' : t.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{t.status}</span>
                  <button onClick={() => { setEditing(t); setOpen(true); }} className="text-sm text-mtech-indigo">Edit</button>
                  <button onClick={() => deleteTask(t.id)} className="text-sm text-red-600">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal isOpen={isOpen} title={editing ? 'Edit Task' : 'New Task'} onClose={() => setOpen(false)}>
        <TaskForm initial={editing || {}} onSubmit={editing ? updateTask : createTask} onClose={() => setOpen(false)} />
      </Modal>
    </Layout>
  );
};

export default Tasks;

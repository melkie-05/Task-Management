const run = async () => {
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'Password123!' })
    });
    console.log('login status', loginRes.status);
    const loginText = await loginRes.text();
    console.log('login body:', loginText);

    const token = (() => { try { return JSON.parse(loginText).token } catch { return null } })();
    if (!token) { console.error('No token, aborting'); return; }

    const res = await fetch('http://localhost:3000/api/admin/activity-logs', { headers: { Authorization: `Bearer ${token}` } });
    console.log('activity logs status', res.status);
    const text = await res.text();
    console.log('activity logs body:', text);
  } catch (err) {
    console.error('error', err);
  }
};

run();

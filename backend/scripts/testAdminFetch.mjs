async function run() {
  const loginRes = await fetch('http://localhost:3000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.com', password: 'Password123!' }) });
  const loginData = await loginRes.json();
  console.log('login:', loginData);
  const token = loginData.token;
  if (!token) return console.error('No token from login');

  const usersRes = await fetch('http://localhost:3000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
  const users = await usersRes.json();
  console.log('admin users:', users);
}

run().catch(console.error);

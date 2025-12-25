import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import Spinner from "../components/Spinner";
export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUpOpen, setSignUpOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) navigate('/dashboard');
    // eslint-disable-next-line
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Simple validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      // store token + user (basic)
      if (rememberMe) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }

      // fetch enriched profile (roles, permissions)
      try {
        const token = data.token;
        const res2 = await fetch('http://localhost:3000/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res2.ok) {
          const d = await res2.json();
          if (rememberMe) localStorage.setItem('user', JSON.stringify(d.user));
          else sessionStorage.setItem('user', JSON.stringify(d.user));
        }
      } catch (e) {
        console.warn('Could not fetch profile after login', e);
      }

      showToast('Login successful');
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Server error. Please try again later.');
      setLoading(false);
    }
  };

  function SignUpForm({ onSuccess, onError }) {
    const [name, setName] = useState("");
    const [emailS, setEmailS] = useState("");
    const [passwordS, setPasswordS] = useState("");
    const [loadingS, setLoadingS] = useState(false);
    const [errorS, setErrorS] = useState("");

    const submit = async (e) => {
      e.preventDefault();
      setErrorS("");
      if (!name || !emailS || !passwordS) {
        setErrorS('All fields required');
        return;
      }
      if (!/\S+@\S+\.\S+/.test(emailS)) {
        setErrorS('Invalid email');
        return;
      }
      if (passwordS.length < 6) {
        setErrorS('Password must be at least 6 characters');
        return;
      }

      setLoadingS(true);
      try {
        const res = await fetch('http://localhost:3000/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email: emailS, password: passwordS })
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorS(data.message || 'Could not create account');
          onError && onError(data.message || 'Could not create account');
          setLoadingS(false);
          return;
        }

        // Auto-login after register
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailS, password: passwordS })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          onError && onError(loginData.message || 'Created but could not login');
          setLoadingS(false);
          return;
        }

        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        onSuccess && onSuccess();
        setLoadingS(false);
        navigate('/dashboard');
      } catch (err) {
        console.error(err);
        setErrorS('Server error');
        onError && onError('Server error');
        setLoadingS(false);
      }
    };

    return (
      <form onSubmit={submit} className="space-y-4">
        {errorS && <div className="text-sm text-red-600">{errorS}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input value={emailS} onChange={(e) => setEmailS(e.target.value)} type="email" className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input value={passwordS} onChange={(e) => setPasswordS(e.target.value)} type="password" className="mt-1 w-full p-2 border rounded" />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={loadingS} className="bg-mtech-indigo text-white px-4 py-2 rounded flex items-center">
            {loadingS ? <Spinner className="h-4 w-4 mr-2"/> : null}
            Create account
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mtech-blue text-white font-bold text-2xl shadow-md">
            M<span className="text-mtech-indigo">T</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">M-Tech</h1>
        
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-8 sm:px-8">
            <h2 className="text-2xl font-semibold text-gray-900 text-center">Sign in to your account</h2>
            <p className="text-gray-500 text-center text-sm mt-1">Enter your credentials to continue</p>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {toast && (
              <div className="mt-4">
                <Toast type={toast.type === 'error' ? 'error' : 'success'}>{toast.msg}</Toast>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mtech-indigo focus:border-transparent transition"
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <a href="#" className="text-sm text-mtech-indigo hover:text-indigo-700">
                    Forgot password?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mtech-indigo focus:border-transparent transition"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-mtech-indigo rounded focus:ring-mtech-indigo"
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember me</span>
                </label>
              </div>

                          <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-mtech-indigo hover:bg-indigo-600 disabled:opacity-60 text-white font-medium py-3 px-4 rounded-lg transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mtech-indigo text-center block flex items-center justify-center"
                >
                  {loading ? <Spinner className="h-5 w-5 mr-2" /> : null}
                  Sign in
                </button>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">
                  <svg className="h-5 w-5 text-[#4285F4]" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93L5.84 14.09z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="ml-2">Google</span>
                </button>
                <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="ml-2">GitHub</span>
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don’t have an account?{' '}
              <button onClick={() => setSignUpOpen(true)} className="font-medium text-mtech-indigo hover:text-indigo-700">
                Sign up
              </button>
            </p>

            <Modal isOpen={isSignUpOpen} title="Create your account" onClose={() => setSignUpOpen(false)}>
              <SignUpForm
                onSuccess={async () => {
                  setSignUpOpen(false);
                  showToast('Account created — logging in...');
                }}
                onError={(msg) => showToast(msg, 'error')}
              />
            </Modal>
          </div>

          <div className="bg-gray-50 px-6 py-3 text-center text-xs text-gray-500 border-t border-gray-200">
            © {new Date().getFullYear()} M-Tech Solutions. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
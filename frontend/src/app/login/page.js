"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Backend integration
      const res = await axios.post('http://localhost:5000/api/user/login', {
        email,
        password
      });

      // Backend response mein 'token' aur 'user' dono aa rahe hain
      if (res.data.token) {
        console.log("✅ Login Success!");
        
        // 1. Token save karo (Auth ke liye)
        localStorage.setItem('token', res.data.token); 
        
        // 2. User info save karo (Dashboard UI ke liye)
        localStorage.setItem('user_info', JSON.stringify(res.data.user)); 

        // 3. Redirect to dashboard
        router.push('/dashboard'); 
      }
    } catch (err) {
      console.error("❌ Login Failed:", err.response?.data);
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-[#1e293b] p-8 shadow-2xl border border-slate-700">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-400 font-medium">Login to access your trading dashboard</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg">
              <p className="text-red-400 text-center text-sm font-medium">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                required
                className="w-full rounded-lg bg-slate-900 border border-slate-700 py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="password"
                required
                className="w-full rounded-lg bg-slate-900 border border-slate-700 py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`group relative flex w-full justify-center rounded-lg bg-blue-600 py-3 px-4 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none transition-all active:scale-95 shadow-lg shadow-blue-900/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LogIn className="h-5 w-5 text-blue-300" />
            </span>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-slate-500">
            Don't have an account? <a href="/register" className="text-blue-400 hover:underline">Register here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
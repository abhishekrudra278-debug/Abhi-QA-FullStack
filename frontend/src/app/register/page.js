"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', uid: `UID_${Date.now()}` });
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/user/register', formData);
      alert("Registration Successful! Now Login.");
      router.push('/login');
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
      <form onSubmit={handleRegister} className="bg-[#1e293b] p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>
        <input 
          type="text" placeholder="Full Name" 
          className="w-full p-3 mb-4 bg-slate-900 text-white rounded border border-slate-700 outline-none focus:border-blue-500"
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
        />
        <input 
          type="email" placeholder="Email" 
          className="w-full p-3 mb-4 bg-slate-900 text-white rounded border border-slate-700 outline-none focus:border-blue-500"
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
        />
        <input 
          type="password" placeholder="Password" 
          className="w-full p-3 mb-6 bg-slate-900 text-white rounded border border-slate-700 outline-none focus:border-blue-500"
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
        />
        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-all">
          Register
        </button>
      </form>
    </div>
  );
}
"use client";
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({}); // For inline errors
  const [isLoading, setIsLoading] = useState(false); // Double click protection
  const router = useRouter();

  // --- Validation Logic ---
  const validate = () => {
    let tempErrors = {};
    const nameRegex = /^[a-zA-Z\s]{3,30}$/; // Only letters, 3-30 chars
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Proper email format

    if (!nameRegex.test(formData.name)) tempErrors.name = "Name should be 3-30 alphabets only.";
    if (!emailRegex.test(formData.email)) tempErrors.email = "Enter a valid email (e.g. user@domain.com).";
    if (formData.password.length < 8) tempErrors.password = "Password must be at least 8 characters.";
    
    // Sequential password check (123456)
    if (/(012|123|234|345|456|567|678|789|abc|bcd)/i.test(formData.password)) {
        tempErrors.password = "Sequential passwords are not allowed.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true); // Disable button immediately
    
    try {
      // Normalize email to lowercase
      const submissionData = { 
        ...formData, 
        email: formData.email.toLowerCase().trim(),
        uid: `UID_${Date.now()}` 
      };

      await axios.post('https://abhi-qa-fullstack.onrender.com/api/user/register', submissionData);
      router.push('/login');
    } catch (err) {
      const serverError = err.response?.data?.error || "Server error occurred";
      setErrors({ server: serverError });
    } finally {
      setIsLoading(false); // Re-enable if failed
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a] p-4">
      <form onSubmit={handleRegister} className="bg-[#1e293b] p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Account</h2>

        {/* Server/Duplicate Error */}
        {errors.server && <p className="bg-red-500/10 border border-red-500 text-red-500 p-2 rounded text-sm mb-4 text-center">{errors.server}</p>}

        <div className="mb-4">
          <input 
            type="text" placeholder="Full Name" 
            className={`w-full p-3 bg-slate-900 text-white rounded border outline-none focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-slate-700'}`}
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
          />
          {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name}</span>}
        </div>

        <div className="mb-4">
          <input 
            type="email" placeholder="Email" 
            className={`w-full p-3 bg-slate-900 text-white rounded border outline-none focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-slate-700'}`}
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
          />
          {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email}</span>}
        </div>

        <div className="mb-6">
          <input 
            type="password" placeholder="Password" 
            className={`w-full p-3 bg-slate-900 text-white rounded border outline-none focus:border-blue-500 ${errors.password ? 'border-red-500' : 'border-slate-700'}`}
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
          />
          {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password}</span>}
        </div>

        <button 
          disabled={isLoading}
          className={`w-full font-bold py-3 rounded transition-all ${isLoading ? 'bg-slate-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
        >
          {isLoading ? "Processing..." : "Register"}
        </button>
      </form>
    </div>
  );
}
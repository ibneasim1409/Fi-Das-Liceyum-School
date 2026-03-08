import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, UserCircle, Mail, Lock, Loader2, School } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const SetupWizard = () => {
    const navigate = useNavigate();
    const [statusLoading, setStatusLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        schoolName: 'Fi-Das Liceyum',
        name: 'Super Admin',
        email: 'admin@fidas.edu.pk',
        password: '',
        confirmPassword: ''
    });

    // 1. Check if we actually need setup. If admins exist, kick them to login.
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/auth/setup-status`);
                if (!res.data.needsSetup) {
                    navigate('/login'); // Setup already complete
                } else {
                    setStatusLoading(false);
                }
            } catch (err) {
                console.error('Failed to check setup status:', err);
                setError('Could not connect to the server to verify setup status.');
                setStatusLoading(false);
            }
        };
        checkStatus();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match.");
        }

        if (formData.password.length < 6) {
            return setError("Password must be at least 6 characters.");
        }

        setSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/initial-setup`, {
                schoolName: formData.schoolName,
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            // Auto-login the new admin
            localStorage.setItem('token', res.data.token);
            window.location.href = '/'; // Force a full reload to reset auth contexts
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initialize the system.');
            setSubmitting(false);
        }
    };

    if (statusLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">

                {/* Left Side: Branding */}
                <div className="bg-primary p-12 text-white flex flex-col justify-between hidden md:flex relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md mb-8 border border-white/20">
                            <School className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-black mb-4 leading-tight">Welcome to<br />Fi-Das Liceyum ERP</h1>
                        <p className="text-primary-50 text-lg leading-relaxed">
                            Your database is currently completely clean. Let's initialize your root administration account to secure the system.
                        </p>
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-sm font-medium bg-white/10 w-fit px-4 py-2 rounded-full border border-white/20">
                            <ShieldCheck className="w-4 h-4 text-green-400" /> Enterprise Secured Boot
                        </div>
                    </div>
                </div>

                {/* Right Side: Setup Form */}
                <div className="p-8 md:p-12 pb-16 flex flex-col justify-center">
                    <div className="mb-10 block md:hidden">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                            <School className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900">System Setup</h2>
                    </div>

                    <div className="mb-8 hidden md:block">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Create Root Admin</h2>
                        <p className="text-gray-500 mt-2">This account will have total control over the ERP.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 flex items-start gap-3">
                            <div className="mt-0.5">⚠️</div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">Official School Name</label>
                            <div className="relative">
                                <School className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium text-gray-900"
                                    value={formData.schoolName}
                                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">Administrator Name</label>
                            <div className="relative">
                                <UserCircle className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium text-gray-900"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">Master Email Address</label>
                            <div className="relative">
                                <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium text-gray-900"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium text-gray-900"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium text-gray-900"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-primary text-white font-bold py-4 rounded-2xl mt-8 hover:bg-primary-600 transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Initializing System...</>
                            ) : (
                                'Complete Enterprise Setup'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;

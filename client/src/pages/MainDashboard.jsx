import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, UserCheck, Wallet, Loader2, AlertCircle } from 'lucide-react';

const MainDashboard = () => {
    const [stats, setStats] = useState({
        activeStudents: 0,
        totalInquiries: 0,
        pendingAdmissions: 0,
        totalCollection: 0,
        outstandingDues: 0,
        conversionRate: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/dashboard/stats`);
                setStats(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
                setError(true);
                setLoading(false);
            }
        };

        fetchStats();
    }, [API_URL]);

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );

    if (error) return (
        <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6">
            <div className="p-4 bg-red-50 rounded-full mb-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Dashboard Error</h2>
            <p className="text-gray-500 max-w-md italic">
                We couldn't load the real-time metrics right now. Please check your internet connection or contact the administrator.
            </p>
            <button
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
                Retry Loading
            </button>
        </div>
    );

    return (
        <div className="p-6">
            <h1 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Main Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {/* Active Students */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 border-l-4 border-primary hover:scale-[1.02] transition-all relative overflow-hidden group">
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Students</p>
                            <p className="text-3xl font-black text-gray-900 mt-1">{stats.activeStudents.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Inquiries */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 border-l-4 border-secondary hover:scale-[1.02] transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inquiry Pipeline</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black text-gray-900 mt-1">{stats.totalInquiries.toLocaleString()}</p>
                                <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
                                    {stats.conversionRate}% Conv.
                                </span>
                            </div>
                        </div>
                        <div className="p-3 bg-secondary/10 rounded-2xl group-hover:bg-secondary group-hover:text-white transition-all">
                            <FileText className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Pending Admissions */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 border-l-4 border-orange-400 hover:scale-[1.02] transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Payment</p>
                            <p className="text-3xl font-black text-orange-600 mt-1">{stats.pendingAdmissions.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-2xl group-hover:bg-orange-400 group-hover:text-white transition-all">
                            <UserCheck className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Total Collection */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 border-l-4 border-green-500 hover:scale-[1.02] transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Collection</p>
                            <p className="text-xl font-black text-green-600 mt-1">Rs. {stats.totalCollection.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-2xl group-hover:bg-green-500 group-hover:text-white transition-all">
                            <Wallet className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Outstanding Dues */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 border-l-4 border-red-500 hover:scale-[1.02] transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Outstanding Dues</p>
                            <p className="text-xl font-black text-red-600 mt-1">Rs. {stats.outstandingDues.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-50 bg-gradient-to-br from-white to-gray-50 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-black text-gray-900 mb-4">Welcome to Fi Das Liceyum School ERP</h2>
                    <p className="text-gray-500 font-medium leading-relaxed max-w-2xl">
                        This is your central hub for managing school operations. Use the sidebar to navigate through inquiries, admissions, and class management. The metrics above are updated in real-time.
                    </p>
                </div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-3xl"></div>
            </div>
        </div>
    );
};

export default MainDashboard;

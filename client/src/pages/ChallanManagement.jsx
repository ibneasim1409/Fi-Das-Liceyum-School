import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Search,
    Filter,
    Printer,
    CheckCircle,
    Clock,
    AlertCircle,
    Eye,
    ChevronRight,
    Loader2,
    Zap,
    Trash2
} from 'lucide-react';
import { useDialog } from '../store/DialogContext';

const ChallanManagement = () => {
    const [challans, setChallans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const navigate = useNavigate();
    const { showAlert, showConfirm } = useDialog();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const fetchChallans = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/challans`);
            setChallans(res.data);
        } catch (err) {
            console.error('Error fetching challans:', err);
            showAlert('Error', 'Failed to load challans', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallans();
    }, []);

    const handleMarkPaid = async (id) => {
        const confirmed = await showConfirm(
            'Mark as Paid',
            'Are you sure you want to mark this challan as paid? This will record the payment for today.'
        );

        if (confirmed) {
            try {
                const res = await axios.patch(`${API_URL}/api/challans/${id}`, {
                    status: 'paid',
                    paymentMethod: 'cash',
                    paidAt: new Date()
                });

                if (res.data.enrollmentCompleted) {
                    showAlert('Admission Finalized', `Payment confirmed! Student has been admitted with ID: ${res.data.studentId}`, 'success');
                } else {
                    showAlert('Success', 'Challan marked as paid', 'success');
                }
                fetchChallans();
            } catch (err) {
                showAlert('Error', err.response?.data?.message || 'Failed to update challan', 'error');
            }
        }
    };

    const handleGenerateMonthly = async () => {
        const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());
        const monthInput = prompt('WARNING: Billing is strictly automated on the 1st of every month. Are you absolutely sure you want to run a manual override generation?\n\nEnter month for generation (e.g. "April 2024"):', currentMonth);

        if (!monthInput) return;

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/challans/generate-monthly`, { month: monthInput });
            showAlert(
                'Generation Complete',
                `Successfully generated ${res.data.generatedCount} challans. ${res.data.skippedCount} were skipped as they already exist.`,
                'success'
            );
            fetchChallans();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Failed to generate challans', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVoidBatch = async () => {
        const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());
        const monthInput = prompt('EMERGENCY: Enter month to VOID (e.g. "March 2024"):', currentMonth);

        if (!monthInput) return;

        const confirmed = await showConfirm(
            'CRITICAL WARNING - VOID BATCH',
            `Are you absolutely certain you want to VOID all pending monthly challans for ${monthInput}? This cannot be undone.`,
            'error'
        );
        if (!confirmed) return;

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/challans/void-batch`, { month: monthInput });
            showAlert('Success', res.data.message, 'success');
            fetchChallans();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Failed to void batch', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filteredChallans = challans.filter(c => {
        const matchesSearch =
            c.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.challanNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
            case 'void': return 'bg-gray-200 text-gray-500 border-gray-300 italic';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid': return <CheckCircle size={14} />;
            case 'pending': return <Clock size={14} />;
            case 'overdue': return <AlertCircle size={14} />;
            case 'void': return <Trash2 size={14} />;
            default: return null;
        }
    };

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Fee Collection</h1>
                    <p className="text-gray-500 font-medium">Manage and track student fee challans</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
                        {['all', 'pending', 'paid'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize ${statusFilter === s
                                    ? 'bg-secondary text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enterprise Emergency Override Panel */}
            <div className="bg-red-50/50 border border-red-100 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="bg-red-100 p-3 rounded-2xl text-red-600 mt-1 md:mt-0">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-red-900 font-bold text-lg leading-tight tracking-tight">Enterprise Emergency Controls</h3>
                        <p className="text-red-700/80 text-sm font-medium mt-1">
                            Fee generation operates on an automated schedule (1st of every month). Use these controls <span className="font-bold underline">only</span> for critical manual overrides or mass error recovery.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleVoidBatch}
                        className="flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 px-5 py-3 rounded-2xl font-bold hover:bg-red-50 transition-all shadow-sm"
                    >
                        <Trash2 size={18} /> Void Bad Batch
                    </button>
                    <button
                        onClick={handleGenerateMonthly}
                        className="flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-sm"
                    >
                        <Zap size={18} fill="currentColor" /> Override Generation
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by student name or challan number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all font-medium"
                    />
                </div>
                <div className="bg-white px-4 py-2 border border-gray-200 rounded-2xl shadow-sm flex items-center justify-around translate-y-0.5">
                    <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider font-black text-gray-400">Total</p>
                        <p className="text-xl font-black text-gray-900">{challans.length}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider font-black text-amber-500">Pending</p>
                        <p className="text-xl font-black text-amber-600">{challans.filter(c => c.status === 'pending').length}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-100"></div>
                    <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider font-black text-green-500">Collected</p>
                        <p className="text-xl font-black text-green-600">{challans.filter(c => c.status === 'paid').length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Challan Info</th>
                                <th className="px-6 py-4">Student Details</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredChallans.map((challan) => (
                                <tr key={challan._id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-sm font-bold text-gray-900">{challan.challanNumber}</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-black">{challan.month}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{challan.studentName}</div>
                                        <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                                            <span>Class: {challan.classId?.name || 'N/A'}</span>
                                            {challan.studentId && challan.studentId !== 'PENDING' && (
                                                <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                    ID: {challan.studentId}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${challan.type === 'admission' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                                            }`}>
                                            {challan.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-gray-900">Rs. {challan.totalAmount.toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                        {new Date(challan.dueDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getStatusStyle(challan.status)}`}>
                                            {getStatusIcon(challan.status)}
                                            <span className="capitalize">{challan.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {['pending', 'overdue'].includes(challan.status) && (
                                                <button
                                                    onClick={() => handleMarkPaid(challan._id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                                    title="Mark as Paid (Cash)"
                                                >
                                                    <CheckCircle size={20} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/challan/${challan._id}?from=challans`)}
                                                className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                title="Print Challan"
                                            >
                                                <Printer size={20} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all">
                                                <Eye size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredChallans.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Filter className="text-gray-200" size={48} />
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No challans found matching your criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ChallanManagement;

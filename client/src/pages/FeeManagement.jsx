import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Settings,
    Plus,
    Save,
    Trash2,
    History,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Layers
} from 'lucide-react';
import { useDialog } from '../store/DialogContext';

const FeeManagement = () => {
    const { showAlert, showConfirm } = useDialog();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [feeStructures, setFeeStructures] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Generate allowed sessions (Current Year + 5 years ahead)
    const currentYear = new Date().getFullYear();
    const sessions = Array.from({ length: 6 }, (_, i) => {
        const year = currentYear + i;
        const nextYearShort = (year + 1).toString().slice(-2);
        return `${year}-${nextYearShort}`;
    });

    const [formData, setFormData] = useState({
        name: '',
        sessionId: sessions[0],
        classId: '',
        amounts: {
            tuitionFee: 0,
            admissionFee: 0,
            securityDeposit: 0,
            otherFees: []
        },
        isDefault: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [feeRes, classRes] = await Promise.all([
                axios.get(`${API_URL}/api/fees`),
                axios.get(`${API_URL}/api/classes`)
            ]);
            setFeeStructures(feeRes.data);
            setClasses(classRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
            showAlert('error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAmountChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            amounts: {
                ...prev.amounts,
                [name]: parseFloat(value) || 0
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.classId) return showAlert('warning', 'Please select a class');

        setIsSaving(true);
        try {
            await axios.post(`${API_URL}/api/fees`, formData);
            showAlert('success', 'Fee structure created successfully');
            fetchData();
            setFormData({
                name: '',
                sessionId: sessions[0],
                classId: '',
                amounts: { tuitionFee: 0, admissionFee: 0, securityDeposit: 0, otherFees: [] },
                isDefault: false
            });
        } catch (err) {
            console.error('Error saving:', err);
            showAlert('error', err.response?.data?.message || 'Error saving data');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm('Are you sure you want to delete this fee structure?');
        if (!confirmed) return;

        try {
            await axios.delete(`${API_URL}/api/fees/${id}`);
            showAlert('success', 'Deleted successfully');
            fetchData();
        } catch (err) {
            showAlert('error', 'Error deleting');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Layers className="w-8 h-8 text-primary" />
                        Fee Management
                    </h1>
                    <p className="text-muted-foreground mt-1">Define and version class-wise fee structures.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Creation Form */}
                <div className="xl:col-span-1">
                    <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden sticky top-24">
                        <div className="p-6 border-b border-border bg-gray-50/50">
                            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                                <Plus className="w-5 h-5" />
                                New Structure
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Structure Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Standard 2024"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Session</label>
                                    <select
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none cursor-pointer"
                                        value={formData.sessionId}
                                        onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                                        required
                                    >
                                        {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Class</label>
                                    <select
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none cursor-pointer"
                                        value={formData.classId}
                                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <hr className="border-border my-6" />

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground text-primary">Monthly Tuition Fee</label>
                                    <input
                                        type="number"
                                        name="tuitionFee"
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.amounts.tuitionFee}
                                        onChange={handleAmountChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">One-time Admission Fee</label>
                                    <input
                                        type="number"
                                        name="admissionFee"
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none"
                                        value={formData.amounts.admissionFee}
                                        onChange={handleAmountChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Security Deposit (Refundable)</label>
                                    <input
                                        type="number"
                                        name="securityDeposit"
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none"
                                        value={formData.amounts.securityDeposit}
                                        onChange={handleAmountChange}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 mt-6"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Create Fee Structure
                            </button>
                        </form>
                    </div>
                </div>

                {/* List of Existing Structures */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="bg-white border border-border rounded-xl shadow-sm">
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                                <History className="w-5 h-5" />
                                Active Fee Structures
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 text-left">
                                        <th className="px-6 py-4 text-sm font-semibold text-foreground">Structure Name</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-foreground">Class</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-foreground">Tuition Fee</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-foreground">Total</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-foreground text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {feeStructures.map((fs) => (
                                        <tr key={fs._id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-foreground">{fs.name}</div>
                                                <div className="text-xs text-muted-foreground">{fs.sessionId}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                                    {fs.classId?.name || 'Class Deleted'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-foreground">
                                                Rs. {fs.amounts.tuitionFee.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                Rs. {(fs.amounts.tuitionFee + fs.amounts.admissionFee + fs.amounts.securityDeposit).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDelete(fs._id)}
                                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {feeStructures.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                                                No fee structures defined yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeManagement;

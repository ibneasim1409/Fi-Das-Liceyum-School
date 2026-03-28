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
import { useAuth } from '../hooks/useAuth';

const FeeManagement = () => {
    const { showAlert, showConfirm } = useDialog();
    const { user } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [feeStructures, setFeeStructures] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const [newCategoryName, setNewCategoryName] = useState('');
    const [feePlanCategories, setFeePlanCategories] = useState(['Default Plan']);

    const [billingSettings, setBillingSettings] = useState({
        earlyBirdDiscountPercentage: 10,
        earlyBirdValidityDays: 10,
        siblingDiscountIncrement: 5,
        siblingDiscountCap: 5
    });

    // Generate allowed sessions (Current Year + 5 years ahead)
    const currentYear = new Date().getFullYear();
    const sessions = Array.from({ length: 6 }, (_, i) => {
        const year = currentYear + i;
        const nextYearShort = (year + 1).toString().slice(-2);
        return `${year}-${nextYearShort}`;
    });

    const [formData, setFormData] = useState({
        name: 'Default Plan',
        sessionId: sessions[0],
        classId: '',
        amounts: {
            tuitionFee: 0,
            admissionFee: 0,
            annualExpenses: 0,
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
            const [feeRes, classRes, settingsRes, listRes] = await Promise.all([
                axios.get(`${API_URL}/api/fees`),
                axios.get(`${API_URL}/api/classes`),
                axios.get(`${API_URL}/api/settings`),
                axios.get(`${API_URL}/api/lists/feePlanCategories`).catch(() => ({ data: { items: ['Default Plan'] } }))
            ]);
            setFeeStructures(feeRes.data);
            setClasses(classRes.data);

            if (listRes.data && listRes.data.items && listRes.data.items.length > 0) {
                setFeePlanCategories(listRes.data.items);
            } else {
                setFeePlanCategories(['Default Plan']);
            }

            if (settingsRes.data?.billing) {
                const b = settingsRes.data.billing;
                setBillingSettings({
                    earlyBirdDiscountPercentage: b.earlyBirdDiscountPercentage ?? 10,
                    earlyBirdValidityDays: b.earlyBirdValidityDays ?? 10,
                    siblingDiscountIncrement: b.siblingDiscountIncrement ?? 5,
                    siblingDiscountCap: b.siblingDiscountCap ?? 5
                });
            }
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

    const handleSettingsChange = (e) => {
        const { name, value } = e.target;
        setBillingSettings(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        const conf = await showConfirm('Changes to global billing rules will apply to the NEXT monthly billing cycle. Previously generated challans are Grandfathered and remain unaffected to maintain accounting integrity. Proceed?');
        if (!conf) return;

        if (billingSettings.siblingDiscountCap > 15) {
            showAlert('error', 'Sibling cap cannot exceed 15 (75% maximum discount).');
            return;
        }

        setIsSavingSettings(true);
        try {
            const payload = {
                earlyBirdDiscountPercentage: billingSettings.earlyBirdDiscountPercentage,
                earlyBirdValidityDays: billingSettings.earlyBirdValidityDays,
                siblingDiscountIncrement: billingSettings.siblingDiscountIncrement,
                siblingDiscountCap: billingSettings.siblingDiscountCap
            };
            await axios.put(`${API_URL}/api/settings/billing`, payload);
            showAlert('success', 'Global Billing Rules updated successfully');
        } catch (err) {
            console.error(err);
            showAlert('error', 'Error updating billing settings');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleAddCategory = async () => {
        const name = newCategoryName.trim();
        if (!name || feePlanCategories.includes(name)) return;

        const newCategories = [...feePlanCategories, name];
        try {
            await axios.put(`${API_URL}/api/lists/feePlanCategories`, { items: newCategories });
            setFeePlanCategories(newCategories);
            setNewCategoryName('');
            showAlert('success', 'Category added successfully');
        } catch (err) {
            showAlert('error', err.response?.data?.message || 'Failed to add category');
        }
    };

    const handleDeleteCategory = async (idx) => {
        const catToDelete = feePlanCategories[idx];
        if (catToDelete === 'Default Plan') return;

        const newCategories = feePlanCategories.filter((_, i) => i !== idx);
        try {
            await axios.put(`${API_URL}/api/lists/feePlanCategories`, { items: newCategories });
            setFeePlanCategories(newCategories);
            showAlert('success', 'Category removed successfully');
        } catch (err) {
            showAlert('error', err.response?.data?.message || 'Failed to remove category');
        }
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
                name: 'Default Plan',
                sessionId: sessions[0],
                classId: '',
                amounts: { tuitionFee: 0, admissionFee: 0, annualExpenses: 0, securityDeposit: 0, otherFees: [] },
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

            {/* Enterprise Billing Settings Widget */}
            {user?.role === 'admin' && (
                <div className="bg-gradient-to-br from-primary via-secondary to-primary rounded-xl shadow-lg border border-primary/50 overflow-hidden mb-8">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-white/80" />
                                Global Billing Engine Rules
                            </h2>
                            <p className="text-white/80 text-sm mt-1">Configure automated logic for Early Bird & Sibling deduplications.</p>
                        </div>
                        <button
                            onClick={handleSettingsSubmit}
                            disabled={isSavingSettings}
                            className="bg-white text-primary px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xl shadow-primary/20"
                        >
                            {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Apply Rules
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/10 backdrop-blur-sm">
                        {/* Early Bird Configuration */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-2">
                                <h3 className="text-white/90 font-semibold tracking-wide uppercase text-xs">Early Bird Settings</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-white/80">Discount (%)</label>
                                    <div className="relative">
                                        <input type="number" name="earlyBirdDiscountPercentage" value={billingSettings.earlyBirdDiscountPercentage} onChange={handleSettingsChange} className="w-full bg-white/10 border border-white/30 text-white rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-white/50 focus:outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-white/80">Validity (Days)</label>
                                    <div className="relative">
                                        <input type="number" name="earlyBirdValidityDays" value={billingSettings.earlyBirdValidityDays} onChange={handleSettingsChange} className="w-full bg-white/10 border border-white/30 text-white rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-white/50 focus:outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sibling Scaling Configuration */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4 border-b border-white/20 pb-2">
                                <h3 className="text-white/90 font-semibold tracking-wide uppercase text-xs">Sibling Hierarchy Discounts</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-white/80">Discount per Sibling (%)</label>
                                    <input type="number" name="siblingDiscountIncrement" value={billingSettings.siblingDiscountIncrement} min={0} onChange={handleSettingsChange} className="w-full bg-white/10 border border-white/30 text-white rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-white/50 focus:outline-none" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-white/80">Max Siblings Setup (Cap)</label>
                                    <input type="number" name="siblingDiscountCap" value={billingSettings.siblingDiscountCap} min={0} max={15} onChange={handleSettingsChange} className="w-full bg-white/10 border border-white/30 text-white rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-white/50 focus:outline-none" />
                                </div>
                            </div>
                            <div className="mt-3 p-3 bg-black/20 rounded-md border border-white/5">
                                <p className="text-xs font-mono text-white/70 leading-relaxed">
                                    <span className="text-white/40 block mb-1 uppercase tracking-wider text-[10px]">Mathematical Preview</span>
                                    Child 1: Base (0% off)<br />
                                    Child 2: {billingSettings.siblingDiscountIncrement}% off<br />
                                    Child 3: {billingSettings.siblingDiscountIncrement * 2}% off<br />
                                    {billingSettings.siblingDiscountCap > 3 && `...up to Child ${billingSettings.siblingDiscountCap + 1} (${billingSettings.siblingDiscountIncrement * billingSettings.siblingDiscountCap}% off)`}
                                    {billingSettings.siblingDiscountCap <= 3 && `(Caps at Child ${billingSettings.siblingDiscountCap + 1} with ${billingSettings.siblingDiscountIncrement * billingSettings.siblingDiscountCap}% off)`}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Decoupled Fee Plan Categories Editor - Available to Admins */}
            {user?.role === 'admin' && (
                <div className="bg-white rounded-xl shadow-lg border border-border overflow-hidden mb-8">
                    <div className="p-6 border-b border-border bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Settings className="w-5 h-5 text-primary" />
                                Fee Plan Categories Dictionary
                            </h2>
                            <p className="text-muted-foreground text-sm mt-1">Manage global categorical dropdown options independent of billing logic.</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {feePlanCategories.map((cat, idx) => (
                                <div key={idx} className="flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 text-sm text-primary font-medium">
                                    <span>{cat}</span>
                                    {feePlanCategories.length > 1 && cat !== 'Default Plan' && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteCategory(idx)}
                                            className="p-1 hover:bg-primary/20 rounded-full transition-colors ml-1"
                                            title="Delete Category"
                                        >
                                            <Trash2 className="w-3 h-3 text-primary/70 hover:text-red-500" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 max-w-sm">
                            <input
                                type="text"
                                placeholder="Add new plan name..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="flex-1 bg-white border border-gray-300 text-foreground rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary/50 focus:outline-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCategory();
                                    }
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleAddCategory}
                                className="bg-primary hover:bg-primary/90 text-white px-4 rounded-md font-medium text-sm transition-colors shadow-sm"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                <select
                                    className="w-full px-3 py-2 bg-white border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-md outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                >
                                    {feePlanCategories.map((cat, idx) => (
                                        <option key={idx} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Session</label>
                                    <select
                                        className="w-full px-3 py-2 bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
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
                                        className="w-full px-3 py-2 bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
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
                                        className="w-full px-3 py-2 bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
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
                                        className="w-full px-3 py-2 bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        value={formData.amounts.admissionFee}
                                        onChange={handleAmountChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Annual Expenses</label>
                                    <input
                                        type="number"
                                        name="annualExpenses"
                                        className="w-full px-3 py-2 bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        value={formData.amounts.annualExpenses}
                                        onChange={handleAmountChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Security Deposit (Refundable)</label>
                                    <input
                                        type="number"
                                        name="securityDeposit"
                                        className="w-full px-3 py-2 bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        value={formData.amounts.securityDeposit}
                                        onChange={handleAmountChange}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-primary text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 mt-6"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 text-white" />}
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
                                                Rs. {(fs.amounts.tuitionFee + fs.amounts.admissionFee + (fs.amounts.annualExpenses || 0) + fs.amounts.securityDeposit).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDelete(fs._id)}
                                                    className="p-2 bg-gray-900 text-red-500 hover:bg-black rounded-xl transition-all shadow-sm"
                                                    title="Delete Fee Structure"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    FileText,
    Plus,
    Search,
    Phone,
    User,
    BookOpen,
    Clock,
    CheckCircle,
    XCircle,
    MessageSquare,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../store/DialogContext';

const Inquiries = () => {
    const navigate = useNavigate();
    const { showAlert } = useDialog();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [inquiries, setInquiries] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        parentName: '',
        studentName: '',
        phoneNumber: '',
        classId: '',
        notes: ''
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [inqRes, classRes] = await Promise.all([
                axios.get(`${API_URL}/api/inquiries`),
                axios.get(`${API_URL}/api/classes`)
            ]);
            setInquiries(inqRes.data);
            setClasses(classRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`${API_URL}/api/inquiries`, formData);
            setFormData({ parentName: '', studentName: '', phoneNumber: '', classId: '', notes: '' });
            setShowAddForm(false);
            fetchData();
        } catch (err) {
            showAlert('Submission Failed', err.response?.data?.message || 'Failed to submit inquiry', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.patch(`${API_URL}/api/inquiries/${id}/status`, { status });
            setInquiries(inquiries.map(inq => inq._id === id ? { ...inq, status } : inq));
        } catch (err) {
            console.error(err);
            showAlert('Update Failed', 'Failed to update status', 'error');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'contacted': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'converted': return 'bg-green-100 text-green-700 border-green-200';
            case 'closed': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredInquiries = inquiries.filter(inq =>
        inq.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inq.phoneNumber.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-vh-60">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto mb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <FileText className="mr-3 h-8 w-8 text-primary" />
                        Admission Inquiries
                    </h1>
                    <p className="text-gray-500 mt-1">Manage new leads and potential student registrations.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className={`flex items-center px-6 py-3 rounded-xl shadow-lg transition-all font-bold ${showAddForm ? 'bg-gray-100 text-gray-600' : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                >
                    {showAddForm ? <XCircle className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
                    {showAddForm ? 'Cancel' : 'New Inquiry'}
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-2xl font-bold text-gray-800">{inquiries.length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">New</p>
                    <p className="text-2xl font-bold text-gray-800">{inquiries.filter(i => i.status === 'new').length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">In Progress</p>
                    <p className="text-2xl font-bold text-gray-800">{inquiries.filter(i => i.status === 'contacted').length}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Converted</p>
                    <p className="text-2xl font-bold text-gray-800">{inquiries.filter(i => i.status === 'converted').length}</p>
                </div>
            </div>

            {showAddForm && (
                <div className="mb-8 bg-white p-8 rounded-2xl shadow-xl border border-primary/10 animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <Plus className="mr-2 h-6 w-6 text-primary" />
                        Record New Admission Inquiry
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Parent's Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-300" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder="Full Name"
                                    value={formData.parentName}
                                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Student's Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-300" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder="Student's Name"
                                    value={formData.studentName}
                                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-300" />
                                <input
                                    type="tel"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder="e.g. 03xx-xxxxxxx"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Inquiry for Class</label>
                            <div className="relative">
                                <BookOpen className="absolute left-3 top-3.5 h-5 w-5 text-gray-300" />
                                <select
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none appearance-none bg-white"
                                    value={formData.classId}
                                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Additional Notes</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-300" />
                                <textarea
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                                    rows="1"
                                    placeholder="Enter any follow-up notes..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="md:col-span-1 h-[52px] bg-secondary text-white font-bold rounded-xl shadow-md hover:bg-secondary/90 transition-all flex items-center justify-center disabled:opacity-50"
                        >
                            {submitting ? 'Creating Draft...' : 'Submit Inquiry'}
                        </button>
                    </form>
                    <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex items-center">
                        <Clock size={14} className="mr-2" />
                        This will create a new inquiry record. You can start an admission from this inquiry later.
                    </div>
                </div>
            )}

            {/* List Header & Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="font-bold text-gray-700">Recent Inquiries</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search students or parents..."
                            className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all w-full sm:w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {filteredInquiries.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">No inquiries matching your search.</p>
                        </div>
                    ) : (
                        filteredInquiries.map(inq => (
                            <div key={inq._id} className="p-4 hover:bg-gray-50/50 transition-colors group">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-primary/5 rounded-xl text-primary mt-1">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-800">{inq.studentName}</h4>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusColor(inq.status)}`}>
                                                    {inq.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium">{inq.parentName}</p>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                <div className="flex items-center text-xs text-gray-400">
                                                    <Phone size={12} className="mr-1" />
                                                    {inq.phoneNumber}
                                                </div>
                                                <div className="flex items-center text-xs text-gray-400">
                                                    <BookOpen size={12} className="mr-1" />
                                                    {inq.classId?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 sm:self-center">
                                        <div className="flex bg-gray-100 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => updateStatus(inq._id, 'contacted')}
                                                className={`p-1.5 rounded-md transition-all ${inq.status === 'contacted' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-400 hover:text-amber-500'}`}
                                                title="Mark Contacted"
                                            >
                                                <Phone size={16} />
                                            </button>
                                            <button
                                                onClick={() => updateStatus(inq._id, 'closed')}
                                                className={`p-1.5 rounded-md transition-all ${inq.status === 'closed' ? 'bg-white shadow-sm text-red-600' : 'text-gray-400 hover:text-red-500'}`}
                                                title="Mark Closed"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                            {inq.status !== 'converted' && (
                                                <button
                                                    onClick={() => {
                                                        navigate('/admissions', {
                                                            state: {
                                                                startNewAdmission: true,
                                                                prefillData: {
                                                                    parentName: inq.parentName,
                                                                    studentName: inq.studentName,
                                                                    phoneNumber: inq.phoneNumber,
                                                                    classId: inq.classId?._id || '',
                                                                    linkedInquiryId: inq._id
                                                                }
                                                            }
                                                        });
                                                    }}
                                                    className="p-1.5 rounded-md text-gray-400 hover:text-primary transition-all bg-primary/10"
                                                    title="Start Admission"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <button className="p-2 text-gray-300 hover:text-primary transition-colors">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                                {inq.notes && (
                                    <div className="mt-3 ml-14 p-3 bg-gray-50 rounded-xl text-xs text-gray-500 italic">
                                        "{inq.notes}"
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Inquiries;

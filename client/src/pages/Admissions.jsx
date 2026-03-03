import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    UserCheck,
    Search,
    Edit3,
    Save,
    GraduationCap,
    MapPin,
    CreditCard,
    Hash,
    Users,
    CheckCircle2,
    X,
    Loader2,
    ArrowRight,
    UserPlus,
    Calendar,
    AlertTriangle
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';

const Admissions = () => {
    const { user } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [admissions, setAdmissions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAdmission, setSelectedAdmission] = useState(null);
    const [isFinalizing, setIsFinalizing] = useState(false);

    // Form editing state
    const [editData, setEditData] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [admRes, clsRes] = await Promise.all([
                axios.get(`${API_URL}/api/admissions`),
                axios.get(`${API_URL}/api/classes`)
            ]);
            setAdmissions(admRes.data);
            setClasses(clsRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDraft = (admission) => {
        setSelectedAdmission(admission);
        setEditData({
            ...admission,
            parentCNIC: admission.parentCNIC || '',
            studentCNIC: admission.studentCNIC || '',
            address: admission.address || '',
            sectionId: admission.sectionId?._id || '',
            discount: admission.discount || 0,
            guardianInfo: admission.guardianInfo || { name: '', phone: '', relation: '' }
        });
    };

    const formatCNIC = (value) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 5) return numbers;
        if (numbers.length <= 12) return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
        return `${numbers.slice(0, 5)}-${numbers.slice(5, 12)}-${numbers.slice(12, 13)}`;
    };

    const handleCNICChange = (field, value) => {
        const formatted = formatCNIC(value);
        if (formatted.length <= 15) { // 5 + 1 + 7 + 1 + 1
            setEditData({ ...editData, [field]: formatted });
        }
    };

    const handleSaveUpdate = async () => {
        try {
            const res = await axios.patch(`${API_URL}/api/admissions/${editData._id}`, editData);
            setAdmissions(admissions.map(a => a._id === res.data._id ? res.data : a));
            alert('Progress saved successfully');
        } catch (err) {
            alert('Failed to save progress');
        }
    };

    const handleFinalize = async () => {
        if (!editData.sectionId) return alert('Please assign a section first');
        if (!editData.parentCNIC || editData.parentCNIC.length < 15) return alert('Valid Parent CNIC is required');

        if (!window.confirm('Are you sure? This will finalize the admission and generate a Student ID.')) return;

        setIsFinalizing(true);
        try {
            // First save any updates
            await axios.patch(`${API_URL}/api/admissions/${editData._id}`, editData);

            // Then finalize
            const res = await axios.post(`${API_URL}/api/admissions/${editData._id}/finalize`);
            setAdmissions(admissions.map(a => a._id === res.data._id ? res.data : a));
            setSelectedAdmission(null);
            alert(`Admission Finalized! Student ID: ${res.data.studentId}`);
            fetchData(); // Refresh to get updated class/section counts if needed
        } catch (err) {
            alert(err.response?.data?.message || 'Finalization failed');
        } finally {
            setIsFinalizing(false);
        }
    };

    const filteredAdmissions = admissions.filter(adm =>
        adm.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adm.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adm.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeClass = classes.find(c => c._id === editData.classId?._id || c._id === editData.classId);

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-vh-60">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto mb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <UserCheck className="mr-3 h-8 w-8 text-primary" />
                    Student Admissions
                </h1>
                <p className="text-gray-500 mt-1">Manage registration flow from inquiry drafts to permanent enrollment.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: List of Admissions */}
                <div className={`lg:col-span-4 ${selectedAdmission ? 'hidden lg:block' : 'block'}`}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[700px]">
                        <div className="p-4 border-b border-gray-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search student or ID..."
                                    className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm w-full focus:ring-2 focus:ring-primary outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 p-2 space-y-1">
                            {filteredAdmissions.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">No records found</div>
                            ) : (
                                filteredAdmissions.map(adm => (
                                    <div
                                        key={adm._id}
                                        onClick={() => handleSelectDraft(adm)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all ${selectedAdmission?._id === adm._id
                                                ? 'bg-primary/5 border border-primary/20'
                                                : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-800">{adm.studentName}</h4>
                                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${adm.status === 'admitted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {adm.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 mb-2">
                                            <GraduationCap size={12} className="mr-1" />
                                            {adm.classId?.name} {adm.status === 'admitted' && `• ${adm.studentId}`}
                                        </div>
                                        <div className="flex items-center text-[10px] text-gray-400">
                                            <Calendar size={10} className="mr-1" />
                                            {new Date(adm.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Detailed Form */}
                <div className={`lg:col-span-8 ${selectedAdmission ? 'block' : 'hidden lg:flex lg:items-center lg:justify-center'}`}>
                    {!selectedAdmission ? (
                        <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-gray-200">
                            <UserPlus className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-400">Select a draft to complete registration</h3>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in slide-in-from-right-4 duration-300">
                            <div className="bg-primary/5 p-6 border-b border-primary/10 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary rounded-2xl text-white">
                                        <Edit3 size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-800">Complete Enrollment</h2>
                                        <p className="text-sm text-gray-500">Ref: {selectedAdmission._id.slice(-8)}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedAdmission(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {/* Basic Info Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-8 h-[2px] bg-primary mr-3"></span> Lead Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Parent Name</label>
                                            <p className="font-bold text-gray-700">{selectedAdmission.parentName}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Student Name</label>
                                            <p className="font-bold text-gray-700">{selectedAdmission.studentName}</p>
                                        </div>
                                    </div>
                                </section>

                                {/* CNIC & Address Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-8 h-[2px] bg-primary mr-3"></span> Detailed Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600 ml-1 flex items-center">
                                                <Hash size={14} className="mr-1 text-primary" /> Parent CNIC
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none font-mono"
                                                placeholder="12345-1234567-1"
                                                value={editData.parentCNIC}
                                                onChange={(e) => handleCNICChange('parentCNIC', e.target.value)}
                                                disabled={selectedAdmission.status === 'admitted'}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600 ml-1 flex items-center">
                                                <Hash size={14} className="mr-1 text-primary" /> Student CNIC (B-Form)
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none font-mono"
                                                placeholder="12345-1234567-1"
                                                value={editData.studentCNIC}
                                                onChange={(e) => handleCNICChange('studentCNIC', e.target.value)}
                                                disabled={selectedAdmission.status === 'admitted'}
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-gray-600 ml-1 flex items-center">
                                                <MapPin size={14} className="mr-1 text-primary" /> Residential Address
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                                                rows="2"
                                                value={editData.address}
                                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                                disabled={selectedAdmission.status === 'admitted'}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Assignment Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-8 h-[2px] bg-primary mr-3"></span> Academic Assignment
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center">
                                            <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                                                <GraduationCap className="text-primary" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-400">Class</label>
                                                <p className="font-bold text-gray-800">{activeClass?.name}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600 ml-1 flex items-center">
                                                <Users size={14} className="mr-1 text-primary" /> Assign Section
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-white appearance-none"
                                                value={editData.sectionId}
                                                onChange={(e) => setEditData({ ...editData, sectionId: e.target.value })}
                                                disabled={selectedAdmission.status === 'admitted'}
                                            >
                                                <option value="">Select Section</option>
                                                {activeClass?.sections?.map(s => (
                                                    <option key={s._id} value={s._id}>{s.name} (Cap: {s.capacity})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {/* Financial Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-8 h-[2px] bg-primary mr-3"></span> Fee Management
                                    </h3>
                                    <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">Monthly Tuition (Base)</span>
                                            <span className="font-mono font-bold text-gray-700 underline decoration-primary/30 decoration-2">Rs. {editData.baseFee?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <label className="text-gray-500 font-medium">Discount / Scholarship</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={editData.discount}
                                                    onChange={(e) => setEditData({ ...editData, discount: parseInt(e.target.value) || 0 })}
                                                    className="w-32 px-3 py-1.5 rounded-lg border-none bg-white shadow-sm focus:ring-2 focus:ring-primary text-right font-mono"
                                                    disabled={selectedAdmission.status === 'admitted'}
                                                />
                                                <span className="absolute left-3 top-1.5 text-gray-300 pointer-events-none">Rs.</span>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                                            <span className="text-gray-800 font-bold">Final Payable Monthly</span>
                                            <span className="text-2xl font-bold text-secondary">Rs. {(editData.baseFee - editData.discount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </section>

                                {selectedAdmission.status === 'admitted' && (
                                    <div className="bg-green-50 p-6 rounded-3xl border border-green-100 flex items-start gap-4">
                                        <div className="p-2 bg-green-500 rounded-full text-white">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-green-800">Registration Complete</h4>
                                            <p className="text-sm text-green-600">Student ID **{selectedAdmission.studentId}** has been issued. This record is now permanent.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                                {selectedAdmission.status !== 'admitted' ? (
                                    <>
                                        <button
                                            onClick={handleSaveUpdate}
                                            className="flex-1 px-6 py-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Save size={20} /> Save Progress
                                        </button>
                                        <button
                                            onClick={handleFinalize}
                                            disabled={isFinalizing}
                                            className="flex-[2] px-6 py-4 bg-secondary text-white font-bold rounded-2xl shadow-lg hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isFinalizing ? <Loader2 className="animate-spin" /> : <UserCheck size={20} />}
                                            Finalize & Admit Student
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-full p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 text-amber-700 text-sm">
                                        <AlertTriangle size={18} />
                                        Permanent records cannot be modified through this portal.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Admissions;

import React, { useState, useEffect, useCallback } from 'react';
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
    AlertTriangle,
    Trash2,
    Camera,
    FileText,
    ChevronRight,
    Zap,
    RefreshCw,
    Eye,
    Check
} from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';
import { useDialog } from '../store/DialogContext';

const Admissions = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { showAlert, showConfirm } = useDialog();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [admissions, setAdmissions] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAdmission, setSelectedAdmission] = useState(null);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [feeStructures, setFeeStructures] = useState([]);

    // Form editing state
    const [editData, setEditData] = useState({});
    const [isNewForm, setIsNewForm] = useState(false);
    const [siblingInfo, setSiblingInfo] = useState({ count: 0, loading: false });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [admRes, clsRes, feeRes] = await Promise.all([
                axios.get(`${API_URL}/api/admissions`),
                axios.get(`${API_URL}/api/classes`),
                axios.get(`${API_URL}/api/fees`)
            ]);
            setAdmissions(admRes.data);
            setClasses(clsRes.data);
            setFeeStructures(feeRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => {
        fetchData();

        // Handle incoming state from Inquiries page
        if (location.state?.startNewAdmission && location.state?.prefillData) {
            setIsNewForm(true);
            setEditData({
                ...location.state.prefillData,
                parentCNIC: '',
                studentCNIC: '',
                address: '',
                sectionId: '',
                discount: 0,
                baseFee: 0 // Will update when class is selected
            });
            // Clear the state so it doesn't trigger again on refresh
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, location.pathname, navigate, fetchData]);

    const handleSelectDraft = (admission) => {
        setIsNewForm(false);
        setSelectedAdmission(admission);
        setEditData({
            ...admission,
            parentCNIC: admission.parentCNIC || '',
            studentCNIC: admission.studentCNIC || '',
            address: admission.address || '',
            sectionId: admission.sectionId?._id || '',
            discount: admission.discount || 0,
            guardianInfo: admission.guardianInfo || { name: '', phone: '', relation: '' },
            studentPicture: admission.studentPicture || ''
        });
        setSiblingInfo({ count: 0, loading: false }); // Reset sibling info
    };

    const handleNewRegistration = () => {
        setIsNewForm(true);
        setSelectedAdmission(null);
        setEditData({
            parentName: '',
            studentName: '',
            phoneNumber: '',
            classId: '',
            parentCNIC: '',
            studentCNIC: '',
            address: '',
            sectionId: '',
            discount: 0,
            baseFee: 0,
            guardianInfo: { name: '', phone: '', relation: '' },
            studentPicture: ''
        });
        setSiblingInfo({ count: 0, loading: false });
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

    const checkSiblings = async () => {
        if (!editData.parentCNIC || editData.parentCNIC.length < 15) return;

        setSiblingInfo({ ...siblingInfo, loading: true });
        try {
            const endpoint = `${API_URL}/api/admissions/check-siblings/${editData.parentCNIC}`;
            const queryParam = editData._id && !isNewForm ? `?excludeId=${editData._id}` : '';

            const res = await axios.get(endpoint + queryParam);
            const count = res.data.siblingCount;

            setSiblingInfo({ count, loading: false });

            const autoDiscountPercentage = res.data.discountPercentage || 0;

            // Auto apply discount logic based on sibling count (Enterprise Capped Logic)
            if (activeClass && count > 0) {
                const childOrdinal = count + 1;

                // Apply discount to eligible pool, but only activate it if fee plan is Default
                if ((editData.eligibleDiscountPercentage || 0) === 0 || await showConfirm('Sibling Discount', `Found ${count} sibling(s). This is Child #${childOrdinal}. Apply ${autoDiscountPercentage}% sibling discount?`, 'info', 'Apply Discount', 'No thanks')) {
                    setEditData(prev => {
                        const fs = feeStructures.find(f => f._id === prev.feeStructureId);
                        const isDefault = fs?.name === 'Default Plan';
                        return {
                            ...prev,
                            eligibleDiscountPercentage: autoDiscountPercentage,
                            siblingDiscountPercentage: isDefault ? autoDiscountPercentage : 0
                        };
                    });
                }
            }
        } catch (err) {
            console.error('Failed to check siblings:', err);
            setSiblingInfo({ ...siblingInfo, loading: false });
        }
    };

    const handleSaveUpdate = async () => {
        try {
            if (isNewForm) {
                const res = await axios.post(`${API_URL}/api/admissions`, editData);
                setAdmissions([res.data, ...admissions]);
                setSelectedAdmission(res.data);
                setIsNewForm(false);
                setEditData({ ...editData, _id: res.data._id });
                showAlert('Success', 'Draft admission created successfully!', 'success');
            } else {
                const res = await axios.patch(`${API_URL}/api/admissions/${editData._id}`, editData);
                setAdmissions(admissions.map(a => a._id === res.data._id ? res.data : a));
                showAlert('Success', 'Progress saved successfully', 'success');
            }
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Failed to save progress', 'error');
        }
    };

    const handlePrintChallan = async (admissionId) => {
        try {
            const res = await axios.get(`${API_URL}/api/challans/admission/${admissionId}`);
            if (res.data && res.data._id) {
                navigate(`/challan/${res.data._id}?from=admissions`);
            }
        } catch (err) {
            showAlert('Print Error', err.response?.data?.message || 'Could not find or generate the challan for this admission.', 'error');
        }
    };

    const handleFinalize = async () => {
        if (!editData.sectionId) return showAlert('Action Required', 'Please assign a section first', 'warning');
        if (!editData.parentCNIC || editData.parentCNIC.length < 15) return showAlert('Action Required', 'Valid Parent CNIC is required', 'warning');
        if (!editData.phoneNumber) return showAlert('Action Required', 'Phone number is required', 'warning');

        if (!await showConfirm('Process Admission', 'This will issue the Admission Bill. Official enrollment and Student ID generation will occur automatically once the bill is paid. Continue?', 'info', 'Process & Issue Bill')) return;

        setIsFinalizing(true);
        try {
            let admissionId = editData._id;

            // If it's a new form, we need to create it first before finalizing
            if (isNewForm) {
                const saveRes = await axios.post(`${API_URL}/api/admissions`, editData);
                admissionId = saveRes.data._id;
                // Add to list so UI updates
                setAdmissions([saveRes.data, ...admissions]);
                setIsNewForm(false);
            } else {
                // First save any updates to existing draft
                await axios.patch(`${API_URL}/api/admissions/${admissionId}`, editData);
            }

            // Then finalize using the ID
            const res = await axios.post(`${API_URL}/api/admissions/${admissionId}/finalize`);
            setAdmissions(admissions.map(a => a._id === res.data._id ? res.data : a));
            setSelectedAdmission(res.data);
            showAlert('Success', 'Admission Bill Issued! Enrollment will complete upon payment.', 'success');
            fetchData();
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Finalization failed', 'error');
        } finally {
            setIsFinalizing(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedAdmission) return;

        const confirmMsg = selectedAdmission.status === 'admitted'
            ? 'Are you sure? This is a permanent record. Deleting it will restore class capacity.'
            : 'Are you sure you want to delete this draft?';

        if (!await showConfirm('Delete Admission', confirmMsg, 'error', 'Delete')) return;

        try {
            await axios.delete(`${API_URL}/api/admissions/${selectedAdmission._id}`);
            setAdmissions(admissions.filter(a => a._id !== selectedAdmission._id));
            setSelectedAdmission(null);
            setIsNewForm(false);
            showAlert('Success', 'Admission record deleted', 'success');
        } catch (err) {
            showAlert('Error', err.response?.data?.message || 'Failed to delete record', 'error');
        }
    };

    const filteredAdmissions = admissions.filter(adm =>
        adm.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adm.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adm.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeClass = classes.find(c => c._id === editData.classId?._id || c._id === editData.classId);

    // Update base fee when class changes (handle pre-fill scenario)
    useEffect(() => {
        if (isNewForm && activeClass) {
            // Find default fee structure for this class
            const defaultFS = feeStructures.find(fs => fs.classId === activeClass._id || fs.classId?._id === activeClass._id);
            if (defaultFS && editData.feeStructureId !== defaultFS._id) {
                setEditData(prev => ({
                    ...prev,
                    feeStructureId: defaultFS._id,
                    feeSnapshot: {
                        ...defaultFS.amounts,
                        structureName: `${defaultFS.name} - ${activeClass?.name || ''} (${defaultFS.sessionId || ''})`.trim()
                    }
                }));
            }
        }
    }, [activeClass, isNewForm, feeStructures]);

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center min-vh-60">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto mb-20">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <UserCheck className="mr-3 h-8 w-8 text-primary" />
                        Student Admissions
                    </h1>
                    <p className="text-gray-500 mt-1">Manage registration flow from inquiry drafts to permanent enrollment.</p>
                </div>
                <button
                    onClick={handleNewRegistration}
                    className="flex items-center px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all"
                >
                    <UserPlus className="mr-2 h-5 w-5" />
                    New Registration
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: List of Admissions */}
                <div className={`lg:col-span-4 ${selectedAdmission || isNewForm ? 'hidden lg:block' : 'block'}`}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[700px]">
                        <div className="p-4 border-b border-gray-50 flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search student or ID..."
                                    className="pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm w-full focus:ring-2 focus:ring-primary outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={fetchData}
                                className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-all"
                                title="Refresh List"
                            >
                                <RefreshCw size={18} />
                            </button>
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
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${adm.status === 'admitted'
                                                    ? 'bg-green-100 text-green-700'
                                                    : adm.status === 'pending_admission'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {adm.status.replace('_', ' ')}
                                                </span>
                                                {adm.status === 'draft' && (
                                                    <>
                                                        <button
                                                            title="Delete Draft"
                                                            onClick={(e) => { e.stopPropagation(); setSelectedAdmission(adm); setTimeout(handleDelete, 0); }}
                                                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <button
                                                            title="Process Admission"
                                                            onClick={(e) => { e.stopPropagation(); setSelectedAdmission(adm); setEditData(adm); setTimeout(handleFinalize, 0); }}
                                                            className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors shadow-sm"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                {adm.status !== 'draft' && (
                                                    <button
                                                        title="View Profile"
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/students/${adm._id}`); }}
                                                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 mb-2">
                                            {adm.classId?.name}
                                            {adm.status === 'admitted' && (
                                                <span className="ml-2 bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] font-bold">
                                                    ID: {adm.studentId}
                                                </span>
                                            )}
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
                <div className={`lg:col-span-8 ${selectedAdmission || isNewForm ? 'block' : 'hidden lg:flex lg:items-center lg:justify-center'}`}>
                    {!selectedAdmission && !isNewForm ? (
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
                                        <h2 className="text-xl font-bold text-gray-800">
                                            {isNewForm ? 'New Admission' : selectedAdmission?.status === 'admitted' ? 'Admitted Student' : 'Complete Enrollment'}
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            {isNewForm
                                                ? (editData.linkedInquiryId ? 'from converted inquiry' : 'Direct Registration')
                                                : selectedAdmission?.status === 'admitted'
                                                    ? `Student ID: ${selectedAdmission.studentId}`
                                                    : `Ref: ${selectedAdmission?._id.slice(-8)}`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedAdmission(null); setIsNewForm(false); }} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {/* Profile Picture Section */}
                                <div className="flex flex-col items-center mb-6">
                                    <div className="relative group">
                                        <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gray-100 flex items-center justify-center transition-all group-hover:scale-105">
                                            {editData.studentPicture ? (
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL}${editData.studentPicture}`}
                                                    alt="Student"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="text-gray-300 flex flex-col items-center">
                                                    <Camera size={40} />
                                                    <span className="text-[10px] font-bold mt-1 uppercase">No Photo</span>
                                                </div>
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 p-3 bg-primary text-white rounded-2xl shadow-lg cursor-pointer hover:bg-primary/90 transition-all">
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;

                                                    const formData = new FormData();
                                                    formData.append('studentPicture', file);

                                                    try {
                                                        const res = await axios.post(`${API_URL}/api/admissions/upload-image`, formData, {
                                                            headers: { 'Content-Type': 'multipart/form-data' }
                                                        });
                                                        setEditData({ ...editData, studentPicture: res.data.imageUrl });
                                                        showAlert('Success', 'Picture uploaded successfully', 'success');
                                                    } catch (err) {
                                                        showAlert('Error', err.response?.data?.message || 'Upload failed', 'error');
                                                    }
                                                }}
                                            />
                                            <Camera size={16} />
                                        </label>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-4 tracking-wider">Student Profile Picture</p>
                                </div>

                                {/* Assignment Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-8 h-[2px] bg-primary mr-3"></span> Academic Assignment
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center">
                                            <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                                                <GraduationCap className="text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                {isNewForm ? (
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Select Class</label>
                                                        <select
                                                            className="w-full bg-transparent font-bold text-gray-800 outline-none appearance-none cursor-pointer"
                                                            value={typeof editData.classId === 'object' ? editData.classId?._id : (editData.classId || '')}
                                                            onChange={(e) => setEditData({ ...editData, classId: e.target.value, sectionId: '' })}
                                                            required
                                                        >
                                                            <option value="" disabled>Choose a class</option>
                                                            {classes.map(c => (
                                                                <option key={c._id} value={c._id}>{c.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase">Class</label>
                                                        <p className="font-bold text-gray-800">{activeClass?.name || 'Not Assigned'}</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600 ml-1 flex items-center">
                                                <Users size={14} className="mr-1 text-primary" /> Assign Section
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-white appearance-none"
                                                value={editData.sectionId || ''}
                                                onChange={(e) => setEditData({ ...editData, sectionId: e.target.value })}
                                                disabled={selectedAdmission?.status === 'admitted' || selectedAdmission?.status === 'pending_admission'}
                                            >
                                                <option value="">Select Section</option>
                                                {activeClass?.sections?.map(s => (
                                                    <option key={s._id} value={s._id}>{s.name} (Cap: {s.capacity})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600 ml-1 flex items-center">
                                                <CreditCard size={14} className="mr-1 text-primary" /> Fee Plan
                                            </label>
                                            <select
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none bg-white font-bold"
                                                value={editData.feeStructureId || ''}
                                                onChange={(e) => {
                                                    const fsId = e.target.value;
                                                    const selectedFS = feeStructures.find(f => f._id === fsId);
                                                    if (selectedFS) {
                                                        const isDefaultPlan = selectedFS.name === 'Default Plan';
                                                        setEditData({
                                                            ...editData,
                                                            feeStructureId: fsId,
                                                            feeSnapshot: {
                                                                ...selectedFS.amounts,
                                                                structureName: `${selectedFS.name} - ${activeClass?.name || ''} (${selectedFS.sessionId || ''})`.trim()
                                                            },
                                                            siblingDiscountPercentage: isDefaultPlan ? (editData.eligibleDiscountPercentage || 0) : 0
                                                        });
                                                    }
                                                }}
                                                disabled={selectedAdmission?.status === 'admitted'}
                                            >
                                                <option value="">Select Fee Plan</option>
                                                {feeStructures
                                                    .filter(fs => (fs.classId?._id || fs.classId) === (editData.classId?._id || editData.classId))
                                                    .map(fs => (
                                                        <option key={fs._id} value={fs._id}>{fs.name} ({fs.sessionId})</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                {/* Basic Info Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center mt-6">
                                        <span className="w-8 h-[2px] bg-primary mr-3"></span> Lead Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Parent Name</label>
                                            <input
                                                className="font-bold text-gray-700 bg-transparent w-full outline-none"
                                                value={editData.parentName || ''}
                                                onChange={(e) => setEditData({ ...editData, parentName: e.target.value })}
                                            />
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Student Name</label>
                                            <input
                                                className="font-bold text-gray-700 bg-transparent w-full outline-none"
                                                value={editData.studentName || ''}
                                                onChange={(e) => setEditData({ ...editData, studentName: e.target.value })}
                                            />
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
                                            <input
                                                className="font-bold text-gray-700 bg-transparent w-full outline-none"
                                                value={editData.phoneNumber || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                    setEditData({ ...editData, phoneNumber: val });
                                                }}
                                                placeholder="03xx-xxxxxxx"
                                            />
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
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-gray-600 ml-1 flex items-center">
                                                    <Hash size={14} className="mr-1 text-primary" /> Parent CNIC
                                                </label>
                                                {siblingInfo.loading ? (
                                                    <Loader2 size={12} className="animate-spin text-primary" />
                                                ) : siblingInfo.count > 0 ? (
                                                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                        {siblingInfo.count} Sibling(s) Found
                                                    </span>
                                                ) : null}
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none font-mono"
                                                placeholder="12345-1234567-1"
                                                value={editData.parentCNIC || ''}
                                                onChange={(e) => handleCNICChange('parentCNIC', e.target.value)}
                                                onBlur={checkSiblings}
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
                                                value={editData.studentCNIC || ''}
                                                onChange={(e) => handleCNICChange('studentCNIC', e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-bold text-gray-600 ml-1 flex items-center">
                                                <MapPin size={14} className="mr-1 text-primary" /> Residential Address
                                            </label>
                                            <textarea
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                                                rows="2"
                                                value={editData.address || ''}
                                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Guardian Information Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-8 h-[2px] bg-primary mr-3"></span> Guardian Information (Optional)
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Guardian Name</label>
                                            <input
                                                className="font-bold text-gray-700 bg-transparent w-full outline-none"
                                                value={editData.guardianInfo?.name || ''}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    guardianInfo: { ...editData.guardianInfo, name: e.target.value }
                                                })}
                                                placeholder="Full Name"
                                            />
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Guardian Phone</label>
                                            <input
                                                className="font-bold text-gray-700 bg-transparent w-full outline-none"
                                                value={editData.guardianInfo?.phone || ''}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    guardianInfo: { ...editData.guardianInfo, phone: e.target.value }
                                                })}
                                                placeholder="03xx-xxxxxxx"
                                            />
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Relation</label>
                                            <input
                                                className="font-bold text-gray-700 bg-transparent w-full outline-none"
                                                value={editData.guardianInfo?.relation || ''}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    guardianInfo: { ...editData.guardianInfo, relation: e.target.value }
                                                })}
                                                placeholder="e.g. Uncle"
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Financial Section */}
                                <section>
                                    <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4 flex items-center">
                                        <span className="w-8 h-[2px] bg-primary mr-3"></span> Fee Management
                                    </h3>
                                    <div className="bg-gray-50 p-6 rounded-3xl space-y-4">


                                        <div className="flex justify-between items-center pt-2">
                                            <span className="text-gray-500 font-medium">Monthly Tuition (Active Plan)</span>
                                            <span className="font-mono font-bold text-gray-700 text-lg">Rs. {editData?.feeSnapshot?.tuitionFee?.toLocaleString() || 0}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">Admission Fee (One-time)</span>
                                            <span className="font-mono font-bold text-gray-700">Rs. {editData?.feeSnapshot?.admissionFee?.toLocaleString() || 0}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-medium">Security Deposit (Refundable)</span>
                                            <span className="font-mono font-bold text-gray-700">Rs. {editData?.feeSnapshot?.securityDeposit?.toLocaleString() || 0}</span>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                            <div className="flex-1 flex flex-col items-start gap-1">
                                                <label className="text-gray-500 font-medium flex items-center gap-2">
                                                    Sibling Discount %
                                                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Auto-Calculated</span>
                                                </label>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">Applied to Default Plan only</p>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    disabled
                                                    className="w-32 px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-gray-500 font-bold text-right cursor-not-allowed"
                                                    value={editData.siblingDiscountPercentage || 0}
                                                />
                                                <span className="absolute right-3 top-2 text-gray-400 pointer-events-none text-sm font-bold">%</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-primary/10 flex justify-between items-center">
                                            <div className="flex-1">
                                                <span className="text-gray-800 font-extrabold uppercase text-xs tracking-wider block">Total Admission Payable</span>
                                                <p className="text-[10px] text-primary/60 font-medium">Includes 1st month tuition + one-time fees</p>
                                            </div>
                                            <span className="font-mono font-bold text-primary text-2xl">
                                                Rs. {(
                                                    (editData?.feeSnapshot?.tuitionFee || 0) +
                                                    (editData?.feeSnapshot?.admissionFee || 0) +
                                                    (editData?.feeSnapshot?.securityDeposit || 0) -
                                                    ((editData?.feeSnapshot?.tuitionFee || 0) * ((editData?.siblingDiscountPercentage || 0) / 100))
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-4 bg-secondary/5 rounded-2xl border border-secondary/10 flex justify-between items-center">
                                        <span className="text-secondary font-bold text-sm">Recurring Net Tuition Fee</span>
                                        <span className="text-xl font-black text-secondary">Rs. {Math.max(0, (editData?.feeSnapshot?.tuitionFee || 0) - ((editData?.feeSnapshot?.tuitionFee || 0) * ((editData?.siblingDiscountPercentage || 0) / 100))).toLocaleString()}</span>
                                    </div>
                                </section>

                                {selectedAdmission?.status === 'admitted' && (
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

                                {selectedAdmission?.status === 'pending_admission' && (
                                    <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-start gap-4">
                                        <div className="p-2 bg-amber-500 rounded-full text-white">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-amber-800">Payment Pending</h4>
                                            <p className="text-sm text-amber-600">Admission bill has been issued. Enrollment will be finalized automatically once the challan is marked as **Paid**.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                                {selectedAdmission && (
                                    <button
                                        onClick={handleDelete}
                                        className="px-6 py-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2 border border-red-100"
                                    >
                                        <Trash2 size={20} /> Delete
                                    </button>
                                )}
                                <button
                                    onClick={handleSaveUpdate}
                                    className="flex-1 px-6 py-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save size={20} /> {selectedAdmission?.status === 'admitted' ? 'Update Record' : 'Save Progress'}
                                </button>
                                {(selectedAdmission?.status === 'admitted' || selectedAdmission?.status === 'pending_admission') && (
                                    <button
                                        onClick={() => handlePrintChallan(selectedAdmission._id)}
                                        className="flex-[2] px-6 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FileText size={20} /> Print Admission Challan
                                    </button>
                                )}
                                {(selectedAdmission?.status === 'draft' || !selectedAdmission) && (
                                    <button
                                        onClick={handleFinalize}
                                        disabled={isFinalizing}
                                        className="flex-[2] px-6 py-4 bg-secondary text-white font-bold rounded-2xl shadow-lg hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isFinalizing ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                                        {isFinalizing ? 'Processing...' : 'Process & Issue Bill'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
};

export default Admissions;

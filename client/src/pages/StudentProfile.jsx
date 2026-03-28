import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import {
    ArrowLeft, User, Phone, MapPin,
    CreditCard, BookOpen, AlertCircle,
    MessageSquare, Smartphone, Printer, Edit, Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function StudentProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [waStatus, setWaStatus] = useState({ loading: false, isRegistered: null });

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const res = await axios.get(`${API_URL}/api/admissions/${id}`);
                setStudent(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch student details');
            } finally {
                setLoading(false);
            }
        };
        fetchStudent();
    }, [id, token]);

    // Pre-flight WhatsApp validation once student is loaded
    useEffect(() => {
        if (!student?.phoneNumber) return;
        const checkWhatsApp = async () => {
            setWaStatus({ loading: true, isRegistered: null });
            try {
                const res = await axios.get(`${API_URL}/api/chat/whatsapp/validate/${student.phoneNumber}`);
                setWaStatus({ loading: false, isRegistered: res.data.isRegistered });
            } catch {
                // If WA is disconnected the endpoint returns success:false — treat as unknown
                setWaStatus({ loading: false, isRegistered: null });
            }
        };
        checkWhatsApp();
    }, [student]);

    const handleWhatsAppClick = () => {
        // CRM Integration Point: Navigate to communications with phone number and ref
        navigate(`/communications?phone=${student.phoneNumber}&ref=admission_${student._id}&channel=whatsapp`);
    };

    const handleSMSClick = () => {
        // CRM Integration Point: Navigate to communications with phone number and ref
        navigate(`/communications?phone=${student.phoneNumber}&ref=admission_${student._id}&channel=sms`);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    {error || 'Student not found'}
                </div>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Go Back
                </button>
            </div>
        );
    }

    const badgeColors = {
        draft: 'bg-gray-100 text-gray-700 border-gray-200',
        pending_admission: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        admitted: 'bg-green-100 text-green-800 border-green-200',
        withdrawn: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
            {/* Header & Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">Go Back</span>
                </button>
            </div>

            {/* Main Profile Header Card */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8 items-start md:items-center relative overflow-hidden">
                {/* Decorative background blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                {/* Avatar */}
                <div className="relative z-10">
                    {student.studentPicture ? (
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                            <img
                                src={`${API_URL}${student.studentPicture}`}
                                alt={student.studentName}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-white shadow-lg flex items-center justify-center">
                            <User className="w-10 h-10 md:w-14 md:h-14 text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Core Info */}
                <div className="flex-1 space-y-2 z-10">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-black text-gray-900">{student.studentName}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${badgeColors[student.status]}`}>
                            {student.status.replace('_', ' ')}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {student.studentId && (
                            <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg font-mono font-medium text-gray-800">
                                {student.studentId}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{student.classId?.name || 'Unassigned Class'}</span>
                            {student.sectionId && (
                                <span className="text-gray-400 px-1">• Section {student.sectionId.name}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick CRM Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto z-10 mt-4 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-gray-100">
                    {/* WhatsApp Button — shows availability from pre-flight check */}
                    <button
                        onClick={handleWhatsAppClick}
                        disabled={waStatus.isRegistered === false || waStatus.loading}
                        title={
                            waStatus.loading ? 'Checking WhatsApp availability...' :
                                waStatus.isRegistered === false ? 'This number is not registered on WhatsApp' :
                                    'Start a WhatsApp conversation'
                        }
                        className={`flex items-center justify-center gap-2 w-full md:w-48 text-white px-5 py-2.5 rounded-xl font-medium transition-all ${waStatus.isRegistered === false
                            ? 'bg-gray-300 cursor-not-allowed opacity-60'
                            : 'bg-[#25D366] hover:bg-[#1DA851] shadow-sm shadow-[#25D366]/20'
                            }`}
                    >
                        {waStatus.loading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</>
                            : <><MessageSquare className="w-4 h-4" /> WhatsApp
                                {waStatus.isRegistered === true && <span className="ml-1 text-[10px] bg-white/25 rounded px-1">✓</span>}
                                {waStatus.isRegistered === false && <span className="ml-1 text-[10px] bg-white/25 rounded px-1">✗</span>}
                            </>
                        }
                    </button>
                    <button
                        onClick={handleSMSClick}
                        className="flex items-center justify-center gap-2 w-full md:w-48 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-primary/20"
                    >
                        <Smartphone className="w-4 h-4" /> Message (SMS)
                    </button>
                    <div className="flex gap-3">
                        <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-all">
                            <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-all">
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Column: Biographics & Demographics */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Demographics & Contact</h3>
                        </div>
                        <div className="p-6">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                                        <User className="w-4 h-4" /> Parent / Guardian
                                    </dt>
                                    <dd className="font-medium text-gray-900">{student.parentName}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                                        <Phone className="w-4 h-4" /> Primary Phone
                                    </dt>
                                    <dd className="font-medium text-gray-900 font-mono">{student.phoneNumber}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                                        <MapPin className="w-4 h-4" /> Home Address
                                    </dt>
                                    <dd className="font-medium text-gray-900">{student.address || 'No address provided'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 mb-1">Parent CNIC</dt>
                                    <dd className="font-medium text-gray-900 font-mono tracking-wide">{student.parentCNIC || '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 mb-1">Student B-Form / CNIC</dt>
                                    <dd className="font-medium text-gray-900 font-mono tracking-wide">{student.studentCNIC || '—'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {student.guardianInfo?.name && (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-bold text-gray-900">Emergency Contact (Guardian)</h3>
                            </div>
                            <div className="p-6">
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 mb-1">Name</dt>
                                        <dd className="font-medium text-gray-900">{student.guardianInfo.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 mb-1">Relationship</dt>
                                        <dd className="font-medium text-gray-900">{student.guardianInfo.relation}</dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-gray-500 mb-1">Phone</dt>
                                        <dd className="font-medium text-gray-900 font-mono">{student.guardianInfo.phone}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Financial Configuration */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-gray-400" />
                                Financial Configuration
                            </h3>
                        </div>
                        <div className="p-6 space-y-6">

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Net Monthly Tuition Fee</p>
                                    <p className="text-3xl font-black text-gray-900 tracking-tight mt-1">Rs {student.netTuitionFee?.toLocaleString()}</p>
                                </div>
                                {student.siblingDiscountPercentage > 0 && (
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded-lg inline-block">
                                            {student.siblingDiscountPercentage}% Sibling Discount
                                        </p>
                                        <p className="text-sm font-medium text-gray-400 line-through mt-1">Rs {student.feeSnapshot?.tuitionFee?.toLocaleString()}</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Admission Fee Snapshot</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 border-dashed">
                                        <span className="text-gray-600 text-sm">Fee Structure Name</span>
                                        <span className="font-medium text-gray-900 bg-secondary/10 text-secondary px-2 py-0.5 rounded-lg text-xs">{student.feeSnapshot?.structureName || 'Custom'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 border-dashed">
                                        <span className="text-gray-600 text-sm">Base Tuition Fee</span>
                                        <span className="font-medium text-gray-900">Rs {student.feeSnapshot?.tuitionFee?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 border-dashed">
                                        <span className="text-gray-600 text-sm">Admission Fee (One-time)</span>
                                        <span className="font-medium text-gray-900">Rs {student.feeSnapshot?.admissionFee?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 border-dashed">
                                        <span className="text-gray-600 text-sm">Annual Expenses</span>
                                        <span className="font-medium text-gray-900">Rs {student.feeSnapshot?.annualExpenses?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 border-dashed">
                                        <span className="text-gray-600 text-sm">Security Deposit (Refundable)</span>
                                        <span className="font-medium text-gray-900">Rs {student.feeSnapshot?.securityDeposit?.toLocaleString() || 0}</span>
                                    </div>
                                    {student.feeSnapshot?.otherFees?.map((fee, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 border-dashed">
                                            <span className="text-gray-600 text-sm">{fee.label}</span>
                                            <span className="font-medium text-gray-900">Rs {fee.amount?.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

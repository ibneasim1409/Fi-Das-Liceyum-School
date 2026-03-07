import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Search, Eye, UserCircle, BookOpen } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function StudentDirectory() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const res = await axios.get(`${API_URL}/api/admissions`);
                // Filter only actively admitted students for the directory
                const admitted = res.data.filter(adm => adm.status === 'admitted');
                setStudents(admitted);
            } catch (err) {
                console.error("Failed to fetch student directory");
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [token]);

    const filteredStudents = students.filter(s =>
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.classId?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
                        <UserCircle className="text-primary w-10 h-10" />
                        Student Directory
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">View and manage profiles, financials, and CRM interactions for all active students.</p>
                </div>

                <div className="relative w-full md:w-auto mt-4 md:mt-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        className="w-full md:w-80 pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                                    <th className="p-5 pl-8">Student</th>
                                    <th className="p-5">Student ID</th>
                                    <th className="p-5">Class & Section</th>
                                    <th className="p-5 text-center">Profile</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => (
                                        <tr key={student._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-5 pl-8">
                                                <div className="flex items-center gap-4">
                                                    {student.studentPicture ? (
                                                        <img src={`${API_URL}${student.studentPicture}`} alt={student.studentName} className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary flex items-center justify-center font-bold shadow-sm">
                                                            {student.studentName.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-primary transition-colors text-base">{student.studentName}</p>
                                                        <p className="text-xs text-gray-500 font-medium">C/O {student.parentName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="font-mono text-sm font-medium text-gray-800 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                                    {student.studentId}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                                    <BookOpen className="w-4 h-4 text-gray-400" />
                                                    {student.classId?.name}
                                                    {student.sectionId && (
                                                        <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded-md">Sec {student.sectionId.name}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <button
                                                    onClick={() => navigate(`/students/${student._id}`)}
                                                    className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm inline-flex items-center justify-center gap-1.5"
                                                    title="View Full Profile"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-16 text-center text-gray-500 font-medium">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <UserCircle className="w-12 h-12 text-gray-300" />
                                                <p>No active students found in the directory.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

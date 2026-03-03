import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BookOpen,
    Plus,
    Trash2,
    Layers,
    Users,
    PlusCircle,
    X,
    CheckCircle,
    AlertCircle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useAuth } from '../store/AuthContext';

const Classes = () => {
    const { user } = useAuth();
    const isAdminOrHR = ['admin', 'hr'].includes(user?.role);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states
    const [showAddClass, setShowAddClass] = useState(false);
    const [classForm, setClassForm] = useState({ name: '', baseFee: '' });
    const [sectionForms, setSectionForms] = useState({}); // { classId: { name: '', capacity: 40 } }
    const [expandedClasses, setExpandedClasses] = useState({});

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/classes`);
            setClasses(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch classes');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/classes`, classForm);
            setClassForm({ name: '', baseFee: '' });
            setShowAddClass(false);
            fetchClasses();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create class');
        }
    };

    const handleDeleteClass = async (id) => {
        if (!window.confirm('Are you sure you want to delete this class and all its sections?')) return;
        try {
            await axios.delete(`${API_URL}/api/classes/${id}`);
            setClasses(classes.filter(c => c._id !== id));
        } catch (err) {
            alert('Failed to delete class');
        }
    };

    const handleAddSection = async (classId) => {
        const formData = sectionForms[classId];
        if (!formData || !formData.name) return;

        try {
            const res = await axios.post(`${API_URL}/api/classes/${classId}/sections`, formData);
            setClasses(classes.map(c => c._id === classId ? res.data : c));
            setSectionForms({ ...sectionForms, [classId]: { name: '', capacity: 40 } });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add section');
        }
    };

    const handleDeleteSection = async (sectionId, classId) => {
        if (!window.confirm('Delete this section?')) return;
        try {
            const res = await axios.delete(`${API_URL}/api/classes/sections/${sectionId}`);
            setClasses(classes.map(c => c._id === classId ? res.data : c));
        } catch (err) {
            alert('Failed to delete section');
        }
    };

    const toggleExpand = (id) => {
        setExpandedClasses(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const updateSectionForm = (classId, field, value) => {
        setSectionForms(prev => ({
            ...prev,
            [classId]: { ...(prev[classId] || { name: '', capacity: 40 }), [field]: value }
        }));
    };

    if (loading && classes.length === 0) {
        return (
            <div className="p-6 flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto mb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <BookOpen className="mr-3 h-8 w-8 text-primary" />
                        Classes & Sections
                    </h1>
                    <p className="text-gray-500 mt-1">Manage school levels and their respective batches.</p>
                </div>
                {isAdminOrHR && (
                    <button
                        onClick={() => setShowAddClass(!showAddClass)}
                        className="flex items-center px-6 py-3 bg-primary text-white rounded-xl shadow-lg hover:bg-primary/90 transition-all font-bold"
                    >
                        {showAddClass ? <X className="mr-2 h-5 w-5" /> : <Plus className="mr-2 h-5 w-5" />}
                        {showAddClass ? 'Cancel' : 'Add New Class'}
                    </button>
                )}
            </div>

            {/* Add Class Form */}
            {showAddClass && (
                <div className="mb-8 p-8 bg-white rounded-2xl shadow-xl border border-primary/10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <PlusCircle className="mr-2 h-6 w-6 text-primary" />
                        Create New Class Level
                    </h2>
                    <form onSubmit={handleCreateClass} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Class Name</label>
                            <input
                                type="text"
                                required
                                value={classForm.name}
                                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="e.g. Grade 10, O-Levels"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Monthly Base Fee (Rs.)</label>
                            <input
                                type="number"
                                required
                                value={classForm.baseFee}
                                onChange={(e) => setClassForm({ ...classForm, baseFee: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                placeholder="5000"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full h-[52px] bg-secondary text-white font-bold rounded-xl shadow-md hover:bg-secondary/90 transition-all"
                        >
                            Create Class
                        </button>
                    </form>
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-4 bg-primary/10 rounded-xl mr-4">
                        <Layers className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Classes</p>
                        <p className="text-2xl font-bold text-gray-800">{classes.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-4 bg-secondary/10 rounded-xl mr-4">
                        <Users className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Students (Admitted)</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {classes.reduce((acc, c) => acc + (c.studentCount || 0), 0)}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-4 bg-primary/10 rounded-xl mr-4">
                        <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Avail. Capacity</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {classes.reduce((acc, c) => acc + c.sections?.reduce((sAcc, s) => sAcc + (s.capacity || 0), 0), 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Classes List */}
            <div className="grid grid-cols-1 gap-3">
                {classes.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                        <div className="p-6 bg-gray-50 rounded-full mb-4">
                            <BookOpen className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">No classes found</h3>
                        <p className="text-gray-500 max-w-sm mt-2">Start by creating your first school class level above.</p>
                    </div>
                ) : (
                    classes.map((cls) => (
                        <div key={cls._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center cursor-pointer" onClick={() => toggleExpand(cls._id)}>
                                    <div className="p-3 bg-primary/5 rounded-xl mr-4">
                                        <BookOpen className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{cls.name}</h3>
                                        <p className="text-sm text-gray-500">Base Fee: Rs. {cls.baseFee?.toLocaleString()}</p>
                                    </div>
                                    <button className="ml-4 p-1 text-gray-400 hover:text-primary transition-colors">
                                        {expandedClasses[cls._id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                </div>

                                <div className="flex items-center space-x-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sections</p>
                                        <p className="text-lg font-bold text-gray-700">{cls.sections?.length || 0}</p>
                                    </div>
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Students</p>
                                        <p className="text-lg font-bold text-secondary">{cls.studentCount || 0}</p>
                                    </div>
                                    {isAdminOrHR && (
                                        <button
                                            onClick={() => handleDeleteClass(cls._id)}
                                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            title="Delete Class"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Sections Content */}
                            {expandedClasses[cls._id] && (
                                <div className="bg-gray-50/50 border-t border-gray-100 p-6">
                                    <div className="flex items-center mb-4">
                                        <Layers className="h-5 w-5 text-secondary mr-2" />
                                        <h4 className="font-bold text-gray-700">Class Sections</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                        {cls.sections?.map(section => (
                                            <div key={section._id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary font-bold text-xs mr-3">
                                                        {section.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{section.name}</p>
                                                        <p className="text-xs text-gray-500">Cap: {section.capacity} / Students: {section.studentCount || 0}</p>
                                                    </div>
                                                </div>
                                                {isAdminOrHR && (
                                                    <button
                                                        onClick={() => handleDeleteSection(section._id, cls._id)}
                                                        className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add Section Form Inline */}
                                        {isAdminOrHR && (
                                            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 flex flex-col gap-3">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Sec Name (A, B...)"
                                                        value={sectionForms[cls._id]?.name || ''}
                                                        onChange={(e) => updateSectionForm(cls._id, 'name', e.target.value)}
                                                        className="flex-1 text-xs px-3 py-2 border rounded-lg outline-none focus:ring-1 focus:ring-secondary"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Cap"
                                                        value={sectionForms[cls._id]?.capacity || 40}
                                                        onChange={(e) => updateSectionForm(cls._id, 'capacity', e.target.value)}
                                                        className="w-16 text-xs px-2 py-2 border rounded-lg outline-none focus:ring-1 focus:ring-secondary"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleAddSection(cls._id)}
                                                    className="w-full py-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-white transition-all rounded-lg text-xs font-bold flex items-center justify-center"
                                                >
                                                    <Plus size={14} className="mr-1" /> Add Section
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {!cls.sections?.length && !isAdminOrHR && (
                                        <p className="text-sm text-gray-400 italic">No sections created for this class yet.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Classes;

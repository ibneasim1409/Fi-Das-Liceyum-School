import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useDialog } from '../store/DialogContext';
import { UserPlus, CheckCircle, AlertCircle, Edit, Trash2, X, Save, Users, Eye, EyeOff } from 'lucide-react';

const AdminDashboard = () => {
    const { user: currentUser } = useAuth();
    const { showAlert, showConfirm } = useDialog();
    const isAdmin = currentUser?.role === 'admin';
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // State for user list
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // State for user creation form
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student'
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for editing user
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', email: '', role: '', password: '' });
    const [showPasswords, setShowPasswords] = useState({}); // Track visibility per user

    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const res = await axios.get(`${API_URL}/api/auth`);
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoadingUsers(false);
        }
    }, [API_URL]);

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin, fetchUsers]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });

        try {
            await axios.post(`${API_URL}/api/auth/register`, formData);
            setStatus({ type: 'success', message: 'User created successfully!' });
            setFormData({ name: '', email: '', password: '', role: 'student' });
            fetchUsers(); // Refresh list
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create user'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!await showConfirm('Delete User', 'Are you sure you want to delete this user?', 'error', 'Delete')) return;

        try {
            await axios.delete(`${API_URL}/api/auth/${id}`);
            setUsers(users.filter(u => u._id !== id));
        } catch (err) {
            console.error('Failed to delete user:', err);
            showAlert('Error', 'Failed to delete user', 'error');
        }
    };

    const startEditing = (user) => {
        setEditingUser(user._id);
        setEditFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            password: '' // Keep empty unless changing
        });
    };

    const cancelEditing = () => {
        setEditingUser(null);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const originalUser = users.find(u => u._id === editingUser);
            const dataToUpdate = {};

            if (editFormData.name !== originalUser.name) dataToUpdate.name = editFormData.name;
            if (editFormData.email !== originalUser.email) dataToUpdate.email = editFormData.email;
            if (editFormData.role !== originalUser.role) dataToUpdate.role = editFormData.role;
            if (editFormData.password) dataToUpdate.password = editFormData.password;

            if (Object.keys(dataToUpdate).length === 0) {
                setEditingUser(null);
                return;
            }

            const res = await axios.patch(`${API_URL}/api/auth/${editingUser}`, dataToUpdate);
            setUsers(users.map(u => u._id === editingUser ? res.data : u));
            setEditingUser(null);
        } catch (err) {
            console.error('Update User Frontend Error:', err.response?.data || err.message);
            showAlert('Error', `Failed to update user: ${err.response?.data?.message || err.message}`, 'error');
        }
    };

    const togglePasswordVisibility = (userId) => {
        setShowPasswords(prev => ({
            ...prev,
            [userId]: !prev[userId]
        }));
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {isAdmin ? (
                    <>
                        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary">
                            <h2 className="text-xl font-semibold text-gray-700">Total Users</h2>
                            <p className="text-4xl font-bold text-primary mt-2">{users.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-secondary">
                            <h2 className="text-xl font-semibold text-gray-700">Admins</h2>
                            <p className="text-4xl font-bold text-secondary mt-2">{users.filter(u => u.role === 'admin').length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary/60">
                            <h2 className="text-xl font-semibold text-gray-700">Teachers</h2>
                            <p className="text-4xl font-bold text-primary/80 mt-2">{users.filter(u => u.role === 'teacher').length}</p>
                        </div>
                    </>
                ) : (
                    <div className="col-span-full bg-primary/5 border-l-4 border-primary/40 p-8 rounded-lg">
                        <h2 className="text-2xl font-bold text-primary mb-2">Welcome, {currentUser?.name}!</h2>
                        <p className="text-lg text-primary/80 italic">Advanced statistics and teacher portals are coming soon.</p>
                        <div className="mt-6 p-4 bg-white rounded-md shadow-inner text-gray-400 border border-dashed border-gray-300">
                            Your currently assigned role: <span className="font-bold text-primary uppercase">{currentUser?.role}</span>
                        </div>
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className="space-y-8">
                    {/* User Creation Section */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center">
                            <UserPlus className="h-6 w-6 text-primary mr-2" />
                            <h2 className="text-xl font-bold text-gray-800">Create New User</h2>
                        </div>
                        <div className="p-8">
                            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                                    >
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="hr">HR Manager</option>
                                        <option value="front_desk">Front Desk</option>
                                        <option value="admin">System Admin</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 lg:col-span-4 flex items-center justify-between pt-4">
                                    <div className="flex-1">
                                        {status.message && (
                                            <div className={`flex items-center text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                                {status.type === 'success' ? <CheckCircle className="h-4 w-4 mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                                                {status.message}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Users Table Section */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center">
                                <Users className="h-6 w-6 text-green-600 mr-2" />
                                <h2 className="text-xl font-bold text-gray-800">User List ({users.length})</h2>
                            </div>
                            <button
                                onClick={fetchUsers}
                                className="text-sm text-secondary hover:text-primary font-semibold"
                            >
                                Refresh
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                                        <th className="px-6 py-4 border-b">Name</th>
                                        <th className="px-6 py-4 border-b">Email</th>
                                        <th className="px-6 py-4 border-b">Role</th>
                                        <th className="px-6 py-4 border-b">Password</th>
                                        <th className="px-6 py-4 border-b text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingUsers ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-10 text-gray-500 font-medium">Loading users...</td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-10 text-gray-500 font-medium">No users found.</td>
                                        </tr>
                                    ) : users.map((u) => (
                                        <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 border-b text-gray-900 font-medium">
                                                {editingUser === u._id ? (
                                                    <input
                                                        className="w-full border rounded px-2 py-1 bg-white text-black"
                                                        value={editFormData.name}
                                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                    />
                                                ) : u.name}
                                            </td>
                                            <td className="px-6 py-4 border-b text-gray-700">
                                                {editingUser === u._id ? (
                                                    <input
                                                        className="w-full border rounded px-2 py-1 bg-white text-black"
                                                        value={editFormData.email}
                                                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                                    />
                                                ) : u.email}
                                            </td>
                                            <td className="px-6 py-4 border-b">
                                                {editingUser === u._id ? (
                                                    <select
                                                        className="border rounded px-2 py-1 bg-white text-black"
                                                        value={editFormData.role}
                                                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                                    >
                                                        <option value="student">Student</option>
                                                        <option value="teacher">Teacher</option>
                                                        <option value="hr">HR Manager</option>
                                                        <option value="front_desk">Front Desk</option>
                                                        <option value="admin">System Admin</option>
                                                    </select>
                                                ) : (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-primary text-white' :
                                                        u.role === 'teacher' ? 'bg-secondary/20 text-secondary' :
                                                            u.role === 'hr' ? 'bg-primary/20 text-primary' :
                                                                u.role === 'front_desk' ? 'bg-secondary/10 text-secondary/80' :
                                                                    'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 border-b">
                                                {editingUser === u._id ? (
                                                    <div className="relative">
                                                        <input
                                                            type={showPasswords[u._id] ? "text" : "password"}
                                                            className="w-full border rounded px-2 py-1 pr-8 bg-white text-black"
                                                            placeholder="New Password"
                                                            value={editFormData.password}
                                                            onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                                        />
                                                        <button
                                                            onClick={() => togglePasswordVisibility(u._id)}
                                                            className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600 p-0 border-none bg-transparent"
                                                        >
                                                            {showPasswords[u._id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between group">
                                                        <span className="text-gray-400 font-mono tracking-wider">••••••••</span>
                                                        <button
                                                            onClick={() => {
                                                                startEditing(u);
                                                                togglePasswordVisibility(u._id);
                                                            }}
                                                            className="text-gray-300 hover:text-secondary p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Update Password"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 border-b text-center">
                                                <div className="flex justify-center space-x-2">
                                                    {editingUser === u._id ? (
                                                        <>
                                                            <button onClick={handleUpdateUser} className="p-2 text-primary hover:bg-primary/10 rounded">
                                                                <Save size={18} />
                                                            </button>
                                                            <button onClick={cancelEditing} className="p-2 text-gray-400 hover:bg-gray-100 rounded">
                                                                <X size={18} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => startEditing(u)}
                                                                className="p-2 text-secondary hover:bg-secondary/10 rounded"
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(u._id)}
                                                                disabled={u._id === currentUser.id}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default AdminDashboard;

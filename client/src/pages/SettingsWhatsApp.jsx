import { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Save, Smartphone, Shield, AlertCircle, CheckCircle } from 'lucide-react';

const SettingsWhatsApp = () => {
    const [settings, setSettings] = useState({
        phoneNumberId: '',
        accessToken: '',
        webhookVerifyToken: '',
        isActive: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get('http://localhost:5001/api/settings', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                if (data && data.whatsapp) {
                    setSettings({
                        phoneNumberId: data.whatsapp.phoneNumberId || '',
                        accessToken: data.whatsapp.accessToken || '',
                        webhookVerifyToken: data.whatsapp.webhookVerifyToken || 'liceyum_secure_webhook_123',
                        isActive: data.whatsapp.isActive || false
                    });
                }
            } catch (error) {
                setStatusMsg({ type: 'error', text: 'Failed to load settings from server.' });
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings({
            ...settings,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setStatusMsg({ type: '', text: '' });
        try {
            await axios.put('http://localhost:5001/api/settings/whatsapp', settings, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setStatusMsg({ type: 'success', text: 'WhatsApp Business API settings saved successfully!' });
        } catch (error) {
            setStatusMsg({ type: 'error', text: error.response?.data?.message || 'Failed to save settings' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-6">Loading settings...</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 border-b pb-4 flex items-center gap-2">
                    <Settings className="h-6 w-6 text-indigo-600" />
                    System Settings
                </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-green-500" />
                            Official WhatsApp Business API
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Configure your Meta Cloud API credentials to enable enterprise messaging.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Enable Cloud API</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={settings.isActive}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                    </div>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Phone Number ID
                                </label>
                                <input
                                    type="text"
                                    name="phoneNumberId"
                                    value={settings.phoneNumberId}
                                    onChange={handleChange}
                                    placeholder="e.g. 1029384756"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                                    required={settings.isActive}
                                />
                                <p className="text-xs text-gray-500">Found in Meta App Dashboard &gt; WhatsApp &gt; API Setup</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Webhook Verify Token
                                </label>
                                <input
                                    type="text"
                                    name="webhookVerifyToken"
                                    value={settings.webhookVerifyToken}
                                    onChange={handleChange}
                                    placeholder="Create a strong custom string"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                                    required={settings.isActive}
                                />
                                <p className="text-xs text-gray-500">Paste this exact string into Meta's Webhook Configuration</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Permanent Access Token
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Shield className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    name="accessToken"
                                    value={settings.accessToken}
                                    onChange={handleChange}
                                    placeholder="EAALxxxxxxxxxxxxxxxxxxxxxx..."
                                    className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors font-mono"
                                    required={settings.isActive}
                                />
                            </div>
                            <p className="text-xs text-gray-500">Generate a System User Token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.</p>
                        </div>

                        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 text-sm mt-6 border border-blue-100">
                            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold mb-1">Webhook URL Configuration</p>
                                <p>When configuring your webhook in the Meta Developer Portal, use this endpoint:</p>
                                <code className="block bg-white px-3 py-2 rounded border border-blue-200 mt-2 font-mono text-xs text-gray-800 break-all">
                                    https://your-domain.com/api/chat/whatsapp/webhook
                                </code>
                            </div>
                        </div>

                        {statusMsg.text && (
                            <div className={`p-4 rounded-lg flex items-center gap-3 text-sm border ${statusMsg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
                                }`}>
                                {statusMsg.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
                                <p className="font-medium">{statusMsg.text}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-75"
                            >
                                {isSaving ? (
                                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <Save className="h-5 w-5" />
                                )}
                                {isSaving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsWhatsApp;

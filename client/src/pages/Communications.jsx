import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { format } from 'date-fns';
import {
    Send, Smartphone, MessageSquare, Search,
    MoreVertical, Check, CheckCheck, Loader2, AlertCircle,
    Wifi, WifiOff, RefreshCw, X, ShieldCheck, Info,
    Paperclip, FileText, Image as ImageIcon, LayoutTemplate, Settings
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// ─── Toast Notification System ──────────────────────────────────────────────
const Toast = ({ toasts, onDismiss }) => (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
            <div
                key={t.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium pointer-events-auto transition-all animate-in duration-300
                    ${t.type === 'success' ? 'bg-green-600 text-white' :
                        t.type === 'error' ? 'bg-red-600 text-white' :
                            'bg-gray-900 text-white'}`}
            >
                {t.type === 'success' && <Check className="w-4 h-4 flex-shrink-0" />}
                {t.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {t.type === 'info' && <Info className="w-4 h-4 flex-shrink-0" />}
                <span>{t.message}</span>
                <button onClick={() => onDismiss(t.id)} className="ml-1 opacity-60 hover:opacity-100">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        ))}
    </div>
);

// ─── WhatsApp Status Banner ──────────────────────────────────────────────────
// Always visible at the top of the left sidebar. Shows Cloud API connection state.
const WaBanner = ({ waStatus }) => {
    // Note: The backend getStatus() now returns { isReady, reason, mode: 'cloud_api' }
    if (waStatus.isReady) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-100 text-xs font-bold text-green-700">
                <Wifi className="w-3.5 h-3.5" />
                Meta Cloud API Connected
            </div>
        );
    }

    return (
        <div className="border-b border-red-100">
            <div className="w-full flex items-center gap-2 px-4 py-2 bg-red-50 text-xs font-bold text-red-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                API Not Configured — Go to Settings
            </div>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const Communications = () => {
    const [socket, setSocket] = useState(null);
    const [waStatus, setWaStatus] = useState({ isReady: false, isAuthenticating: false, qr: null });
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [sendChannel, setSendChannel] = useState('whatsapp');
    const [channelSettings, setChannelSettings] = useState({ whatsapp: false, sms: false });
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('hello_world');
    const [deepLinkRef, setDeepLinkRef] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const [toasts, setToasts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const activeChatRef = useRef(activeChat);
    const conversationsRef = useRef(conversations);

    // Keep refs in sync without adding them to effect deps
    useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
    useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

    // ── Toast helpers ───────────────────────────────────────────────────────
    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // ── API helpers ─────────────────────────────────────────────────────────
    const fetchWaStatus = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/chat/whatsapp/status`);
            setWaStatus(res.data);
        } catch {
            // Server might be starting up — silent fail  
        }
    }, []);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/chat/conversations`);
            setConversations(res.data);
        } catch {
            // Silent fail — conversations will load when server responds
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchChannelSettings = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/api/settings`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setChannelSettings({
                whatsapp: res.data?.whatsapp?.isActive || false,
                sms: res.data?.sms?.isActive || false
            });
        } catch {
            // keep defaults
        }
    }, []);

    // ── Socket — mounts once ────────────────────────────────────────────────
    useEffect(() => {
        const sock = io(API_URL, { reconnectionAttempts: 5, reconnectionDelay: 2000 });
        setSocket(sock);

        fetchWaStatus();
        fetchConversations();
        fetchChannelSettings();

        sock.on('whatsapp_ready', () => {
            setWaStatus({ isReady: true, isAuthenticating: false, qr: null, reason: null });
            addToast('WhatsApp Cloud API connected successfully!', 'success');
        });
        sock.on('whatsapp_disconnected', (reason) => {
            setWaStatus({ isReady: false, isAuthenticating: false, qr: null, reason });
            const msg = reason === 'api_not_configured' ? 'Cloud API credentials missing. Go to Settings.' : 'WhatsApp API error.';
            addToast(msg, 'error', 6000);
        });
        sock.on('whatsapp_error', (msg) => {
            addToast(msg, 'error', 8000);
        });
        sock.on('new_message', ({ conversationId, message }) => {
            if (activeChatRef.current?._id === conversationId) {
                setMessages(prev => {
                    if (prev.some(m => m._id === message._id)) return prev;
                    return [...prev, message];
                });
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
            }
            fetchConversations();
        });
        sock.on('message_status_update', ({ externalId, status }) => {
            setMessages(prev => prev.map(m =>
                m.externalId === externalId ? { ...m, status } : m
            ));
        });

        return () => sock.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Auto-scroll ─────────────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Deep-link: ?phone=&channel=&ref= from Student Profile ──────────────
    useEffect(() => {
        const phone = searchParams.get('phone');
        const channel = searchParams.get('channel');
        const ref = searchParams.get('ref');
        if (!phone || loading) return;

        if (ref) setDeepLinkRef({ phone, channel, ref });
        if (channel) setSendChannel(channel);

        const existing = conversationsRef.current.find(c => c.phoneNumber === phone);
        if (existing) {
            handleSelectChat(existing);
        } else {
            let studentId, inquiryId;
            if (ref?.startsWith('admission_')) studentId = ref.replace('admission_', '');
            if (ref?.startsWith('inquiry_')) inquiryId = ref.replace('inquiry_', '');
            setActiveChat({ _id: null, phoneNumber: phone, _isNew: true, studentId, inquiryId });
            setMessages([]);
        }
        setSearchParams({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, loading]);

    // ── Chat selection ──────────────────────────────────────────────────────
    const handleSelectChat = async (conv) => {
        if (!conv?._id) { setActiveChat(conv); setMessages([]); return; }
        setActiveChat(conv);
        try {
            const res = await axios.get(`${API_URL}/api/chat/messages/${conv._id}`);
            setMessages(res.data);
            fetchConversations(); // clear unread badge
        } catch {
            addToast('Could not load messages for this chat.', 'error');
        }
    };

    // ── Send message ────────────────────────────────────────────────────────
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !activeChat) return;

        // Gatekeeper Logic
        if (sendChannel === 'whatsapp' && (!channelSettings.whatsapp || !waStatus.isReady)) {
            addToast('WhatsApp Official API is not configured. Go to Settings.', 'error');
            return;
        }
        if (sendChannel === 'sms' && !channelSettings.sms) {
            addToast('Local SMS Gateway is not properly configured. Go to Settings > SMS.', 'error');
            return;
        }

        setIsSending(true);
        const optimisticMsg = {
            _id: `optimistic_${Date.now()}`,
            sender: 'school',
            content: newMessage || (attachment ? `[Attachment: ${attachment.name}]` : ''),
            hasMedia: !!attachment,
            channel: sendChannel,
            status: 'sending',
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);
        const sentText = newMessage;
        const sentFile = attachment;

        setNewMessage('');
        setAttachment(null);

        try {
            const formData = new FormData();
            formData.append('phoneNumber', activeChat.phoneNumber);
            formData.append('content', sentText);
            formData.append('channel', sendChannel);

            if (sentFile) {
                formData.append('attachment', sentFile);
            }

            if (deepLinkRef && activeChat._isNew) {
                if (deepLinkRef.ref?.startsWith('admission_')) formData.append('studentId', deepLinkRef.ref.replace('admission_', ''));
                if (deepLinkRef.ref?.startsWith('inquiry_')) formData.append('inquiryId', deepLinkRef.ref.replace('inquiry_', ''));
                setDeepLinkRef(null);
            }
            const res = await axios.post(`${API_URL}/api/chat/send`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Replace optimistic bubble with the real saved message, or remove it if socket already delivered the actual message
            setMessages(prev => {
                if (prev.some(m => m._id === res.data.message._id)) {
                    return prev.filter(m => m._id !== optimisticMsg._id);
                }
                return prev.map(m => m._id === optimisticMsg._id ? { ...res.data.message } : m);
            });
            fetchConversations();
        } catch (err) {
            // If the backend saved it as failed, use the real DB message to replace the optimistic bubble
            const realSavedMsg = err.response?.data?.savedMessage;
            setMessages(prev => {
                if (realSavedMsg && prev.some(m => m._id === realSavedMsg._id)) {
                    return prev.filter(m => m._id !== optimisticMsg._id);
                }
                return prev.map(m =>
                    m._id === optimisticMsg._id ? (realSavedMsg ? { ...realSavedMsg } : { ...m, status: 'failed' }) : m
                );
            });

            addToast(
                err.response?.data?.message || 'Failed to send. Check the channel configuration.',
                'error', 6000
            );
        } finally {
            setIsSending(false);
        }
    };

    // ── Send Template Message ───────────────────────────────────────────────
    const handleSendTemplate = async () => {
        if (!activeChat) return;
        setIsSending(true);
        setShowTemplateModal(false);

        const optimisticMsg = {
            _id: `optimistic_${Date.now()}`,
            sender: 'school',
            content: `[Template Built-in: ${selectedTemplate}]`,
            hasMedia: true,
            mediaType: 'template',
            channel: 'whatsapp',
            status: 'sending',
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const formData = new FormData();
            formData.append('phoneNumber', activeChat.phoneNumber);
            formData.append('channel', 'whatsapp');
            formData.append('type', 'template');
            formData.append('templateName', selectedTemplate);

            if (deepLinkRef && activeChat._isNew) {
                if (deepLinkRef.ref?.startsWith('admission_')) formData.append('studentId', deepLinkRef.ref.replace('admission_', ''));
                if (deepLinkRef.ref?.startsWith('inquiry_')) formData.append('inquiryId', deepLinkRef.ref.replace('inquiry_', ''));
                setDeepLinkRef(null);
            }
            const res = await axios.post(`${API_URL}/api/chat/send`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMessages(prev => {
                if (prev.some(m => m._id === res.data.message._id)) {
                    return prev.filter(m => m._id !== optimisticMsg._id);
                }
                return prev.map(m => m._id === optimisticMsg._id ? { ...res.data.message } : m);
            });
            fetchConversations();
        } catch (err) {
            const realSavedMsg = err.response?.data?.savedMessage;
            setMessages(prev => {
                if (realSavedMsg && prev.some(m => m._id === realSavedMsg._id)) {
                    return prev.filter(m => m._id !== optimisticMsg._id);
                }
                return prev.map(m =>
                    m._id === optimisticMsg._id ? (realSavedMsg ? { ...realSavedMsg } : { ...m, status: 'failed' }) : m
                );
            });
            addToast(err.response?.data?.message || 'Failed to send template.', 'error', 6000);
        } finally {
            setIsSending(false);
        }
    };

    // ── Attachment handling ─────────────────────────────────────────────────
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 16 * 1024 * 1024) { // Meta limit is typically 16MB for standard media
            addToast('File too large. Maximum size is 16MB.', 'error');
            return;
        }
        setAttachment(file);
    };

    // ── Render helpers ──────────────────────────────────────────────────────
    const safeFormat = (val, fmt) => {
        try { const d = new Date(val); return isNaN(d) ? '' : format(d, fmt); } catch { return ''; }
    };

    const getContactName = (conv) => {
        if (!conv) return '?';
        if (conv.linkedStudentId?.studentName) return conv.linkedStudentId.studentName;
        if (conv.linkedInquiryId?.studentName) return `${conv.linkedInquiryId.studentName} (Inquiry)`;
        return conv.phoneNumber || '?';
    };

    const filteredConversations = conversations.filter(c => {
        const name = getContactName(c).toLowerCase();
        const num = c.phoneNumber || '';
        return name.includes(searchTerm.toLowerCase()) || num.includes(searchTerm);
    });

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="h-[calc(100vh-100px)] bg-gray-50 flex rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col gap-3 p-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2 pt-1">
                                <div className="h-3 bg-gray-100 rounded w-3/4" />
                                <div className="h-2 bg-gray-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-400 space-y-2">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                        <p className="text-sm font-medium">Loading conversations…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Toast toasts={toasts} onDismiss={dismissToast} />

            <div className="h-[calc(100vh-100px)] bg-gray-50 flex rounded-3xl overflow-hidden border border-gray-200 shadow-sm">

                {/* ── LEFT: Conversation Sidebar ─────────────────────────────── */}
                <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col min-w-0">

                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center flex-shrink-0">
                        <h2 className="text-lg font-black text-gray-900">Chats</h2>
                        <button
                            onClick={fetchConversations}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Refresh conversations"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* WA Status Banner — always visible */}
                    <div className="flex-shrink-0">
                        <WaBanner waStatus={waStatus} />
                    </div>

                    {/* Search */}
                    <div className="p-3 flex-shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search chats…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Conversation list */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                {searchTerm ? 'No chats match your search.' : 'No conversations yet.'}
                            </div>
                        ) : (
                            filteredConversations.map(conv => (
                                <div
                                    key={conv._id}
                                    onClick={() => handleSelectChat(conv)}
                                    className={`p-4 border-b border-gray-50 cursor-pointer transition-colors flex gap-3 hover:bg-gray-50 
                                        ${activeChat?._id === conv._id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-gray-500 font-bold uppercase">
                                        {getContactName(conv)[0] ?? '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h3 className="font-bold text-gray-900 truncate pr-2">{getContactName(conv)}</h3>
                                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                                                {safeFormat(conv.lastMessageAt, 'HH:mm')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{conv.phoneNumber}</p>
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <div className="flex-shrink-0 self-center">
                                            <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                {conv.unreadCount}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Chat Area ─────────────────────────────────────── */}
                <div className="flex-1 flex flex-col bg-[#e5ddd5]/30 min-w-0">
                    {activeChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shadow-sm z-10 flex-shrink-0">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0 mr-4 flex items-center justify-center text-gray-500 font-bold uppercase">
                                    {getContactName(activeChat)[0] ?? '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 truncate">{getContactName(activeChat)}</h3>
                                    <p className="text-xs text-gray-500">{activeChat.phoneNumber}</p>
                                </div>
                                {activeChat._isNew && (
                                    <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold border border-blue-100">
                                        New Contact
                                    </span>
                                )}
                                <button className="p-2 ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>

                            {/* WA disconnected warning strip (inside chat) */}
                            {!waStatus.isReady && sendChannel === 'whatsapp' && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100 text-xs text-red-700 font-medium flex-shrink-0">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    WhatsApp Cloud API is not configured.
                                    <Link
                                        to="/settings/whatsapp"
                                        className="underline font-bold hover:no-underline"
                                    >
                                        Go to Settings
                                    </Link>
                                    &nbsp;or switch to SMS below.
                                </div>
                            )}

                            {/* Chat Mode Gatekeeper */}
                            {sendChannel === 'whatsapp' && !channelSettings.whatsapp ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                        <MessageSquare className="h-10 w-10 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-3">WhatsApp API Not Configured</h2>
                                    <p className="text-gray-500 max-w-md mb-8">
                                        To send official WhatsApp messages to students and parents, you need to connect your Meta Cloud API credentials.
                                    </p>
                                    <Link
                                        to="/settings/whatsapp"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
                                    >
                                        <Settings className="w-5 h-5" />
                                        Configure WhatsApp Settings
                                    </Link>
                                </div>
                            ) : sendChannel === 'sms' && !channelSettings.sms ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                                        <Smartphone className="h-10 w-10 text-blue-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Textbee.dev Gateway Not Configured</h2>
                                    <p className="text-gray-500 max-w-md mb-8">
                                        To send text messages via your local Android phone, you need to link your Textbee Device ID.
                                    </p>
                                    <Link
                                        to="/settings/sms"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition"
                                    >
                                        <Settings className="w-5 h-5" />
                                        Configure SMS Gateway
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    {/* Message History */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                        {messages.length === 0 && (
                                            <div className="text-center text-gray-400 text-sm py-10">
                                                {activeChat._isNew
                                                    ? 'Start the conversation by typing a message below.'
                                                    : 'No messages in this conversation yet.'}
                                            </div>
                                        )}
                                        {messages.map((msg, idx) => {
                                            const isSchool = msg.sender === 'school';
                                            const isFailed = msg.status === 'failed';
                                            const isSendingMsg = msg.status === 'sending';
                                            const isSMS = msg.channel === 'sms';

                                            let bubbleClass = 'bg-white text-[#111b21] rounded-tl-none border border-gray-100'; // Incoming
                                            if (isSchool) {
                                                if (isFailed) bubbleClass = 'bg-red-100 text-red-900 border border-red-200 rounded-tr-none';
                                                else if (isSMS) bubbleClass = `bg-[#2563eb] text-[#e9edef] rounded-tr-none opacity-${isSendingMsg ? '70' : '100'}`;
                                                else bubbleClass = `bg-[#005c4b] text-[#e9edef] rounded-tr-none opacity-${isSendingMsg ? '70' : '100'}`;
                                            }

                                            return (
                                                <div key={msg._id || idx} className={`flex ${isSchool ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${bubbleClass}`}>

                                                        {/* Media / Template Render */}
                                                        {msg.hasMedia && (
                                                            <div className="mb-2">
                                                                {msg.mediaType === 'image' ? (
                                                                    msg.mediaUrl?.startsWith('meta_id:') ? (
                                                                        <div className="mb-2 relative rounded-xl overflow-hidden shadow-sm bg-black/5">
                                                                            <img
                                                                                src={`${API_URL}/api/chat/media/${msg.mediaUrl.split(':')[1]}?token=${localStorage.getItem('token')}`}
                                                                                alt="Attachment"
                                                                                className="w-full max-w-[280px] object-cover"
                                                                                onError={(e) => {
                                                                                    e.target.style.display = 'none';
                                                                                    e.target.nextSibling.style.display = 'flex';
                                                                                }}
                                                                            />
                                                                            <div className="hidden items-center justify-center p-4 text-sm text-gray-500 italic bg-gray-100">
                                                                                <AlertCircle className="w-4 h-4 mr-2 text-red-400" /> Failed to load image
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2 bg-black/10 p-2 rounded-lg text-sm mb-1 italic">
                                                                            <ImageIcon className="w-4 h-4" /> [Image Attachment]
                                                                        </div>
                                                                    )
                                                                ) : msg.mediaType === 'template' ? (
                                                                    <div className="flex items-center gap-2 bg-black/10 p-2 rounded-lg text-sm mb-1">
                                                                        <LayoutTemplate className="w-4 h-4" /> [Meta WhatsApp Template]
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center justify-between gap-3 bg-black/10 p-3 rounded-lg text-sm mb-1">
                                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                                            <FileText className="w-4 h-4 flex-shrink-0" />
                                                                            <span className="truncate max-w-[140px] font-medium opacity-90">Document</span>
                                                                        </div>
                                                                        {msg.mediaUrl?.startsWith('meta_id:') && (
                                                                            <a
                                                                                href={`${API_URL}/api/chat/media/${msg.mediaUrl.split(':')[1]}?token=${localStorage.getItem('token')}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="px-3 py-1.5 bg-white/60 hover:bg-white text-gray-800 rounded-md text-xs font-bold transition-all shadow-sm shrink-0"
                                                                            >
                                                                                Open
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <p className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>

                                                        <div className={`flex items-center justify-end gap-1 mt-1 text-[11px] ${isSchool && !isFailed ? 'text-[#8696a0]' : 'text-[#667781]'}`}>
                                                            {isFailed && (
                                                                <span className="text-[10px] font-bold text-red-600">Failed</span>
                                                            )}
                                                            <span className="text-[10px] uppercase font-bold tracking-wider">
                                                                {msg.channel === 'whatsapp' ? 'WA' : 'SMS'}
                                                            </span>
                                                            <span className="text-[10px]">{safeFormat(msg.createdAt, 'HH:mm')}</span>
                                                            {isSchool && !isFailed && (
                                                                isSendingMsg
                                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                    : msg.status === 'delivered' || msg.status === 'read'
                                                                        ? <CheckCheck className="w-3 h-3" />
                                                                        : <Check className="w-3 h-3" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input Footer */}
                                    <div className="bg-[#f0f2f5] p-3 flex-shrink-0">

                                        {/* Attachment Preview Strip */}
                                        {attachment && (
                                            <div className="mb-3 p-3 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-between animate-in slide-in-from-bottom-2">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
                                                        {attachment.type.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{attachment.name}</p>
                                                        <p className="text-xs text-gray-500">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setAttachment(null)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}

                                        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                                            {/* Channel Toggle */}
                                            <div className="flex bg-white rounded-full p-1 shrink-0 shadow-sm border border-gray-200">
                                                <button
                                                    type="button"
                                                    onClick={() => setSendChannel('whatsapp')}
                                                    className={`flex items-center justify-center p-2 rounded-full transition-all ${sendChannel === 'whatsapp' ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:bg-gray-50'}`}
                                                    title="Send via WhatsApp"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSendChannel('sms')}
                                                    className={`flex items-center justify-center p-2 rounded-full transition-all ${sendChannel === 'sms' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}
                                                    title="Send via SMS (SIM Gateway)"
                                                >
                                                    <Smartphone className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Attachment Button */}
                                            {sendChannel === 'whatsapp' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTemplateModal(true)}
                                                        className="p-3 text-gray-500 hover:bg-gray-200 rounded-full transition-colors"
                                                        title="Send Meta Template"
                                                        disabled={isSending}
                                                    >
                                                        <LayoutTemplate className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="p-3 text-gray-500 hover:bg-gray-200 rounded-full transition-colors -ml-1"
                                                        title="Attach File"
                                                        disabled={isSending}
                                                    >
                                                        <Paperclip className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={handleFileSelect}
                                                accept="image/jpeg,image/png,application/pdf"
                                            />

                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={e => setNewMessage(e.target.value)}
                                                    placeholder={attachment ? 'Add a caption...' : `Type a message via ${sendChannel === 'whatsapp' ? 'WhatsApp' : 'SMS'}…`}
                                                    className="w-full bg-white border-none focus:ring-1 focus:ring-primary rounded-2xl px-4 py-3 outline-none transition-shadow text-[15px] shadow-sm"
                                                    disabled={isSending}
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isSending || (!newMessage.trim() && !attachment)}
                                                className="bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 disabled:cursor-not-allowed text-white w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0"
                                            >
                                                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                                            </button>
                                        </form>
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        /* ── Welcome / Setup Screen ──────────────────────────── */
                        <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 overflow-y-auto">
                            <div className="max-w-3xl w-full space-y-8">
                                <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10 text-center">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-primary">
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 mb-2">Communications Hub</h2>
                                    <p className="text-gray-600 max-w-lg mx-auto text-sm">
                                        Select a conversation from the sidebar, or navigate to a Student/Inquiry Profile and click the WhatsApp or SMS button to start a new conversation.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* WhatsApp Setup Card */}
                                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                                        <div className="bg-green-50 px-6 py-4 flex items-center gap-3 border-b border-green-100">
                                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                                <MessageSquare className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">Official Meta WhatsApp API</h3>
                                                <div className="flex items-center gap-1.5 text-xs font-medium mt-1">
                                                    <span className={`w-2 h-2 rounded-full ${waStatus.isReady ? 'bg-green-500' : 'bg-red-400'}`} />
                                                    <span className={waStatus.isReady ? 'text-green-600' : 'text-red-500'}>
                                                        {waStatus.isReady ? 'API Active & Receiving Webhooks' : 'Not Configured in Settings'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 text-sm text-gray-600 space-y-4">
                                            <p>Enterprise-grade messaging powered by the Official Meta Webhooks API.</p>

                                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">1</div>
                                                    <span className="text-gray-700">Set up <strong>Meta Developer App</strong></span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">2</div>
                                                    <span className="text-gray-700">Register Phone Number ID</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">3</div>
                                                    <span className="text-gray-700">Go to <strong className="text-blue-600">Settings &gt; WhatsApp API</strong> to activate</span>
                                                </div>
                                            </div>

                                            {waStatus.isReady && (
                                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-green-800 text-xs font-medium">
                                                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                                                    Connected. You can send and receive WhatsApp messages.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* SMS Card */}
                                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                                        <div className="bg-blue-50 px-6 py-4 flex items-center gap-3 border-b border-blue-100">
                                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                <Smartphone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">Physical SIM (SMS)</h3>
                                                <p className="text-xs font-medium text-blue-600">Textbee SDK</p>
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 text-sm text-gray-600 space-y-4">
                                            <p>Use your Android phone's unlimited SMS bundles automatically.</p>
                                            <ol className="list-decimal list-inside space-y-2 text-xs">
                                                <li>Create a free account at <strong>textbee.dev</strong>.</li>
                                                <li>Install the Textbee Android app and link your phone.</li>
                                                <li>Copy your Device ID and generate an API key.</li>
                                                <li>Go to <Link to="/settings/sms" className="text-blue-600 font-semibold hover:underline">Settings &gt; SMS Setup</Link> to configure.</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Template Modal ─────────────────────────────────────────────────── */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <LayoutTemplate className="w-6 h-6 text-primary" />
                                Template Messages
                            </h3>
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="text-gray-400 hover:bg-gray-100 hover:text-gray-600 p-2 rounded-full transition-colors text-xl font-bold"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <p className="text-sm text-gray-600">
                                Sending a template opens the 24-hour customer service window allowing you to send free-text messages.
                            </p>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Approved Templates</label>
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 outline-none transition-all text-sm mb-2"
                                >
                                    <option value="hello_world">hello_world (Default Test)</option>
                                    {/* Additional templates would go here. E.g:
                                    <option value="welcome_message">welcome_message</option>
                                    */}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendTemplate}
                                className="px-5 py-2.5 text-sm font-bold bg-primary text-white hover:bg-primary/90 rounded-xl shadow-sm transition-all"
                            >
                                Send Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Communications;

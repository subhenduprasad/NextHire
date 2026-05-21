import React, { useState, useContext, useEffect } from 'react';
import { LoginContext } from '../components/ContextProvider/Context';
import { useTheme } from '../components/ContextProvider/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const Settings = () => {
    const { loginData, logout } = useContext(LoginContext);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('account');
    
    // Delete Account Modal States
    const [deleteModalState, setDeleteModalState] = useState('closed'); // 'closed', 'warning', 'sending', 'otp-form', 'deleting'
    const [delOtp, setDelOtp] = useState("");

    // Dummy states for toggles
    const [emailAlerts, setEmailAlerts] = useState(loginData?.emailAlerts ?? true);

    useEffect(() => {
        if (loginData) {
            setEmailAlerts(loginData.emailAlerts ?? true);
        }
    }, [loginData]);

    const handleEmailAlertsToggle = async () => {
        const newValue = !emailAlerts;
        setEmailAlerts(newValue);
        
        try {
            const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
            const response = await fetch(`${apiUrl}/users/update-user/${loginData._id}`, {
                method: "PUT",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailAlerts: newValue })
            });
            const result = await response.json();
            if (result.success) {
                toast.success("Notification preferences updated");
                // Update local storage user data to persist across refreshes
                const updatedUser = { ...loginData, emailAlerts: newValue };
                localStorage.setItem("user", JSON.stringify(updatedUser));
            } else {
                toast.error("Failed to update preferences");
                setEmailAlerts(!newValue);
            }
        } catch (error) {
            console.error("Settings update error:", error);
            toast.error("Network error. Could not update settings.");
            setEmailAlerts(!newValue);
        }
    };
    const [appNotifications, setAppNotifications] = useState(true);
    const [newsletter, setNewsletter] = useState(false);
    
    const [publicProfile, setPublicProfile] = useState(true);
    const [resumeVisible, setResumeVisible] = useState(true);
    
    // Theme options from Global Context
    const { theme, setTheme } = useTheme();

    // Change Password Modal States
    const [pwdModalState, setPwdModalState] = useState('closed'); // 'closed', 'sending', 'otp-form', 'resetting'
    const [pwdOtp, setPwdOtp] = useState("");
    const [pwdNew, setPwdNew] = useState("");

    const handleSendPwdOtp = async () => {
        setPwdModalState('sending');
        try {
            const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
            const response = await fetch(`${apiUrl}/auth/send-password-reset-otp`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: loginData.userEmail })
            });

            const result = await response.json();
            if (result.success) {
                setPwdModalState('otp-form');
                toast.success("Security code sent to your registered email");
            } else {
                toast.error(result.error || "Failed to send code");
                setPwdModalState('closed');
            }
        } catch (err) {
            console.error('Reset request error:', err);
            toast.error("Unable to connect to server");
            setPwdModalState('closed');
        }
    };

    const handleVerifyPwdChange = async (e) => {
        e.preventDefault();
        if (!pwdOtp || pwdOtp.length < 6) return toast.error("Please enter a valid 6-digit OTP");
        if (pwdNew.length < 6) return toast.error("Password must be at least 6 characters");
        
        setPwdModalState('resetting');
        try {
            const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
            const response = await fetch(`${apiUrl}/auth/reset-password`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: loginData.userEmail, otp: pwdOtp, newPassword: pwdNew })
            });

            const result = await response.json();
            if (result.success) {
                toast.success("Password successfully updated!");
                setPwdModalState('closed');
                setPwdOtp("");
                setPwdNew("");
            } else {
                toast.error(result.error || "Invalid OTP");
                setPwdModalState('otp-form');
            }
        } catch (err) {
            console.error('Password reset error:', err);
            toast.error("Unable to connect to server");
            setPwdModalState('otp-form');
        }
    };

    const handleRequestDelete = () => {
        setDeleteModalState('warning');
    };

    const handleSendDeleteOtp = async () => {
        setDeleteModalState('sending');
        try {
            const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
            const response = await fetch(`${apiUrl}/auth/send-delete-otp`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: loginData.userEmail })
            });

            const result = await response.json();
            if (result.success) {
                setDeleteModalState('otp-form');
                toast.success("Security code sent to your registered email");
            } else {
                toast.error(result.error || "Failed to send code");
                setDeleteModalState('warning');
            }
        } catch (err) {
            console.error('Send delete OTP error:', err);
            toast.error("Unable to connect to server");
            setDeleteModalState('warning');
        }
    };

    const handleVerifyDelete = async (e) => {
        e.preventDefault();
        if (!delOtp || delOtp.length < 6) return toast.error("Please enter a valid 6-digit OTP");
        
        setDeleteModalState('deleting');
        try {
            const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api";
            const response = await fetch(`${apiUrl}/users/delete-user/${loginData._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail: loginData.userEmail, otp: delOtp })
            });

            const result = await response.json();
            if (response.ok && result.success) {
                toast.success("Account permanently deleted");
                logout();
                navigate('/');
            } else {
                toast.error(result.message || "Invalid OTP");
                setDeleteModalState('otp-form');
            }
        } catch (err) {
            console.error('Delete account error:', err);
            toast.error("Unable to connect to server");
            setDeleteModalState('otp-form');
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'account':
                return (
                    <div className="space-y-6 animate-slide-up">
                        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-slate-600/60 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-neutral-800 dark:text-slate-100">Account Profile</h3>
                                <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">Manage your identity and demographic data.</p>
                            </div>
                            <Link to="/profile" className="btn-secondary btn-sm rounded-xl">
                                Edit Profile
                            </Link>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-neutral-50 dark:bg-slate-800/80 p-4 rounded-xl border border-neutral-100 dark:border-slate-700 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-semibold text-neutral-700 dark:text-slate-200">Email Address</p>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400 mt-0.5">{loginData?.userEmail}</p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md font-bold">Verified</span>
                            </div>
                            <div className="bg-neutral-50 dark:bg-slate-800/80 p-4 rounded-xl border border-neutral-100 dark:border-slate-700 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-semibold text-neutral-700 dark:text-slate-200">Account Type</p>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400 mt-0.5 capitalize">{loginData?.role} Account</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 mt-4 border-t border-neutral-200/60 dark:border-slate-700/60">
                            <h3 className="text-lg font-bold text-red-600 dark:text-red-500">Danger Zone</h3>
                            <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1 mb-4">Permanently delete your account and all associated data.</p>
                            <button 
                                onClick={handleRequestDelete}
                                className="px-4 py-2 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                Delete Account
                            </button>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="space-y-6 animate-slide-up">
                        <div className="border-b border-neutral-200/60 dark:border-slate-700/60 pb-4">
                            <h3 className="text-lg font-bold text-neutral-800 dark:text-slate-100">Notification Preferences</h3>
                            <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">Control how and when you want to be alerted.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-slate-700 hover:bg-neutral-50/50 dark:hover:bg-slate-700/30 transition">
                                <div>
                                    <p className="font-semibold text-neutral-700 dark:text-slate-200">Email Job Alerts</p>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Receive emails for new jobs matching your skills.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={emailAlerts} onChange={handleEmailAlertsToggle} />
                                    <div className="w-11 h-6 bg-neutral-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                                </label>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-slate-700 hover:bg-neutral-50/50 dark:hover:bg-slate-700/30 transition">
                                <div>
                                    <p className="font-semibold text-neutral-700 dark:text-slate-200">App Push Notifications</p>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Get alerts in browser when a recruiter views your profile.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={appNotifications} onChange={() => setAppNotifications(!appNotifications)} />
                                    <div className="w-11 h-6 bg-neutral-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-slate-700 hover:bg-neutral-50/50 dark:hover:bg-slate-700/30 transition">
                                <div>
                                    <p className="font-semibold text-neutral-700 dark:text-slate-200">Weekly Newsletter</p>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Platform updates, blog posts, and generic announcements.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={newsletter} onChange={() => setNewsletter(!newsletter)} />
                                    <div className="w-11 h-6 bg-neutral-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 'privacy':
                return (
                    <div className="space-y-6 animate-slide-up">
                        <div className="border-b border-neutral-200/60 dark:border-slate-700/60 pb-4">
                            <h3 className="text-lg font-bold text-neutral-800 dark:text-slate-100">Privacy & Visibility</h3>
                            <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">Control who can see your profile and resume data.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-slate-700 hover:bg-neutral-50/50 dark:hover:bg-slate-700/30 transition">
                                <div>
                                    <p className="font-semibold text-neutral-700 dark:text-slate-200">Public Profile</p>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Allow employers to find you in candidate search.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={publicProfile} onChange={() => setPublicProfile(!publicProfile)} />
                                    <div className="w-11 h-6 bg-neutral-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                                </label>
                            </div>
                            
                            {loginData?.role === 'candidate' && (
                                <div className="flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-slate-700 hover:bg-neutral-50/50 dark:hover:bg-slate-700/30 transition">
                                    <div>
                                        <p className="font-semibold text-neutral-700 dark:text-slate-200">Resume Visibility</p>
                                        <p className="text-sm text-neutral-500 dark:text-slate-400">Allow employers to view and download your resume without applying.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={resumeVisible} onChange={() => setResumeVisible(!resumeVisible)} />
                                        <div className="w-11 h-6 bg-neutral-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-800 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="space-y-6 animate-slide-up">
                        <div className="border-b border-neutral-200/60 dark:border-slate-700/60 pb-4">
                            <h3 className="text-lg font-bold text-neutral-800 dark:text-slate-100">Security</h3>
                            <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">Manage your active sessions and password security.</p>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl border border-neutral-100 dark:border-slate-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <div>
                                    <p className="font-semibold text-neutral-700 dark:text-slate-200">Change Password</p>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Update your password to keep your account secure.</p>
                                </div>
                                <button 
                                    onClick={handleSendPwdOtp}
                                    disabled={pwdModalState === 'sending'}
                                    className="btn btn-sm bg-white dark:bg-slate-700 text-neutral-800 dark:text-slate-100 hover:bg-neutral-100 dark:hover:bg-slate-600 border border-neutral-200 dark:border-slate-600 rounded-xl shadow-sm whitespace-nowrap"
                                >
                                    {pwdModalState === 'sending' ? 'Sending Code...' : 'Update Password'}
                                </button>
                            </div>
                            
                            <div className="p-4 rounded-xl border border-neutral-100 dark:border-slate-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <div>
                                    <p className="font-semibold text-neutral-700 dark:text-slate-200">Two-Factor Authentication (2FA)</p>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Requires an OTP on login. (Currently Active)</p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary-600 dark:text-secondary-400 rounded-md font-bold">Enabled via Email</span>
                            </div>
                        </div>
                    </div>
                );
            case 'appearance':
                return (
                    <div className="space-y-6 animate-slide-up">
                        <div className="border-b border-neutral-200/60 dark:border-slate-700/60 pb-4">
                            <h3 className="text-lg font-bold text-neutral-800 dark:text-slate-100">Appearance</h3>
                            <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">Customize how the application looks on your device.</p>
                        </div>
                        
                        <div className="space-y-6">
                            <div>
                                <p className="font-semibold text-neutral-700 dark:text-slate-200 mb-4">Theme Mode</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {/* Light Mode */}
                                    <div 
                                        onClick={() => setTheme('light')}
                                        className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${theme === 'light' ? 'border-secondary bg-secondary/5' : 'border-neutral-200 dark:border-slate-700 hover:border-secondary/40 dark:hover:border-secondary/40'}`}
                                    >
                                        <div className="h-20 w-full rounded-xl bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-600 shadow-sm flex items-center justify-center mb-3">
                                            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${theme === 'light' ? 'border-secondary bg-secondary' : 'border-neutral-300 dark:border-slate-600'}`}>
                                                {theme === 'light' && <div className="w-1.5 h-1.5 bg-white dark:bg-slate-800 rounded-full"></div>}
                                            </div>
                                            <span className="font-semibold text-neutral-800 dark:text-slate-200 text-sm">Light</span>
                                        </div>
                                    </div>
                                    
                                    {/* Dark Mode */}
                                    <div 
                                        onClick={() => setTheme('dark')}
                                        className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${theme === 'dark' ? 'border-secondary bg-secondary/5' : 'border-neutral-200 dark:border-slate-700 hover:border-secondary/40 dark:hover:border-secondary/40'}`}
                                    >
                                        <div className="h-20 w-full rounded-xl bg-neutral-900 border border-neutral-700 shadow-sm flex items-center justify-center mb-3">
                                            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${theme === 'dark' ? 'border-secondary bg-secondary' : 'border-neutral-300 dark:border-slate-600'}`}>
                                                {theme === 'dark' && <div className="w-1.5 h-1.5 bg-white dark:bg-slate-800 rounded-full"></div>}
                                            </div>
                                            <span className="font-semibold text-neutral-800 dark:text-slate-200 text-sm">Dark</span>
                                        </div>
                                    </div>
                                    
                                    {/* System Sync */}
                                    <div 
                                        onClick={() => setTheme('system')}
                                        className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${theme === 'system' ? 'border-secondary bg-secondary/5' : 'border-neutral-200 dark:border-slate-700 hover:border-secondary/40 dark:hover:border-secondary/40'}`}
                                    >
                                        <div className="h-20 w-full rounded-xl bg-gradient-to-br from-white to-neutral-800 border border-neutral-300 dark:border-slate-600 overflow-hidden shadow-sm flex items-center justify-center mb-3">
                                            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${theme === 'system' ? 'border-secondary bg-secondary' : 'border-neutral-300 dark:border-slate-600'}`}>
                                                {theme === 'system' && <div className="w-1.5 h-1.5 bg-white dark:bg-slate-800 rounded-full"></div>}
                                            </div>
                                            <span className="font-semibold text-neutral-800 dark:text-slate-200 text-sm">System Sync</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'account', label: 'Account Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { id: 'appearance', label: 'Appearance', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
        { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
        { id: 'privacy', label: 'Privacy & Visibility', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
        { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }
    ];

    return (
        <div className="page-wrapper py-12">
            <div className="max-w-6xl mx-auto px-4 md:px-0">
                <div className="page-header mb-8">
                    <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Settings</h1>
                    <p className="text-neutral-500 dark:text-slate-400 mt-1 font-medium">Manage your platform preferences and configurations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Left Sidebar Menu */}
                    <div className="md:col-span-4 lg:col-span-3">
                        <div className="card p-4 border border-white/60 dark:border-slate-700/50 shadow-soft backdrop-blur-xl bg-white/70 dark:bg-slate-800/80 space-y-2 sticky top-24">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                        activeTab === tab.id 
                                            ? 'bg-secondary text-white shadow-md' 
                                            : 'text-neutral-600 dark:text-slate-400 hover:bg-neutral-100 dark:hover:bg-slate-700/50'
                                    }`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={activeTab === tab.id ? "2.5" : "2"} d={tab.icon} />
                                    </svg>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Content Panel */}
                    <div className="md:col-span-8 lg:col-span-9">
                        <div className="card p-8 border border-white/60 dark:border-slate-700/50 shadow-soft backdrop-blur-xl bg-white/70 dark:bg-slate-800/80 relative">
                            {renderContent()}
                        </div>
                    </div>
                </div>

                {/* Change Password Settings Modal */}
                {pwdModalState !== 'closed' && pwdModalState !== 'sending' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl">
                        <div className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-3xl animate-slide-up border border-neutral-200 dark:border-slate-700 shadow-strong relative">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Security Verification</h2>
                            <p className="text-neutral-600 dark:text-slate-400 mb-6 text-sm">
                                Enter the 6-digit OTP sent to <span className="font-semibold">{loginData?.userEmail}</span> to securely change your password.
                            </p>

                            <form onSubmit={handleVerifyPwdChange} className="space-y-4">
                                <div className="form-group">
                                    <label className="label">OTP Verification Code</label>
                                    <input 
                                        type="text" 
                                        value={pwdOtp}
                                        onChange={(e) => setPwdOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="•• •• ••" 
                                        className="input text-center tracking-widest text-lg"
                                        disabled={pwdModalState === 'resetting'}
                                        required
                                        maxLength={6}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label">New Secure Password</label>
                                    <input 
                                        type="password" 
                                        value={pwdNew}
                                        onChange={(e) => setPwdNew(e.target.value)}
                                        placeholder="At least 6 characters" 
                                        className="input"
                                        disabled={pwdModalState === 'resetting'}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-neutral-100 dark:border-slate-700 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setPwdModalState('closed')}
                                        disabled={pwdModalState === 'resetting'}
                                        className="btn-outline flex-1 py-3"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={pwdModalState === 'resetting' || pwdOtp.length !== 6 || pwdNew.length < 6}
                                        className="btn-secondary flex-1 py-3"
                                    >
                                        {pwdModalState === 'resetting' ? 'Saving...' : 'Confirm Change'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Account Deletion Modal */}
                {deleteModalState !== 'closed' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm shadow-2xl">
                        <div className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-3xl animate-scale-in border border-red-200 dark:border-red-900/50 shadow-strong relative">
                            {deleteModalState === 'warning' && (
                                <>
                                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 text-center">Delete Account?</h2>
                                    <p className="text-neutral-600 dark:text-slate-400 mb-6 text-sm text-center">
                                        This action is <span className="font-bold text-red-600">permanent and cannot be reversed</span>. All your data, jobs, and associated resources will be wiped out immediately.
                                    </p>
                                    <div className="flex gap-3 mt-6">
                                        <button 
                                            type="button" 
                                            onClick={() => setDeleteModalState('closed')}
                                            className="btn-outline flex-1 py-3 border-neutral-300 dark:border-slate-600"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleSendDeleteOtp}
                                            className="btn flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold"
                                        >
                                            Yes, Delete
                                        </button>
                                    </div>
                                </>
                            )}
                            
                            {(deleteModalState === 'sending' || deleteModalState === 'otp-form' || deleteModalState === 'deleting') && (
                                <>
                                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Final Verification</h2>
                                    <p className="text-neutral-600 dark:text-slate-400 mb-6 text-sm">
                                        We're sending an OTP to <span className="font-semibold text-neutral-800 dark:text-slate-200">{loginData?.userEmail}</span>. Enter it below to confirm permanent deletion.
                                    </p>
                                    <form onSubmit={handleVerifyDelete} className="space-y-4">
                                        <div className="form-group">
                                            <label className="label">Deletion OTP</label>
                                            <input 
                                                type="text" 
                                                value={delOtp}
                                                onChange={(e) => setDelOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                placeholder="•• •• ••" 
                                                className="input text-center tracking-widest text-lg border-red-300 focus:border-red-500 focus:ring-red-500/20"
                                                disabled={deleteModalState === 'sending' || deleteModalState === 'deleting'}
                                                required
                                                maxLength={6}
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-4 mt-6">
                                            <button 
                                                type="button" 
                                                onClick={() => setDeleteModalState('closed')}
                                                disabled={deleteModalState === 'sending' || deleteModalState === 'deleting'}
                                                className="btn-outline flex-1 py-3"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                disabled={deleteModalState === 'sending' || deleteModalState === 'deleting' || delOtp.length !== 6}
                                                className="btn flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50"
                                            >
                                                {deleteModalState === 'sending' ? 'Sending OTP...' : (deleteModalState === 'deleting' ? 'Deleting...' : 'Permanently Delete')}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

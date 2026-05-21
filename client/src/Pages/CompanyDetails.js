import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { LoginContext } from '../components/ContextProvider/Context';
import { toast } from 'react-toastify';
import logoURL from '../assets/img/logo.jpeg';
import NetworkModal from '../components/NetworkModal';
import PostCard from '../components/Feed/PostCard';
import { formatSalary } from '../utils/formatters';

export const CompanyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { loginData, updateUser } = React.useContext(LoginContext);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionsCount, setConnectionsCount] = useState(0);
    const [employerId, setEmployerId] = useState(null);

    // Company Posts State
    const [companyPosts, setCompanyPosts] = useState([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);

    // Network Modal State
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', type: '', dataList: [] });

    const openNetworkModal = async () => {
        if (!company) return;
        setModalConfig({ isOpen: true, title: 'Connections', type: 'connections', dataList: [] });
        try {
            const endpoint = `${API_BASE_URL}/api/company/${company._id}/network`;
            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("usertoken")}` }
            });
            const data = await response.json();
            
            if (response.ok && data.success) {
                setModalConfig({ isOpen: true, title: 'Connections', type: 'connections', dataList: data.connectedUsers || [] });
            } else {
                toast.error("Failed to load connections.");
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        } catch (error) {
            console.error(error);
            toast.error("Error loading connections.");
            setModalConfig(prev => ({ ...prev, isOpen: false }));
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            setIsLoading(true);
            await fetchCompanyDetails();
            await fetchCompanyJobs();
            setIsLoading(false);
        };
        loadAll();
    }, [id]);

    const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
    const getPhotoUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    const fetchCompanyDetails = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/company/company/${id}`);
            const result = await response.json();
            
            if (response.ok) {
                setCompany(result.data ? result.data : result);
                
                // Check if currently connected
                if (result.data && result.data.connectedUsers) {
                    setConnectionsCount(result.data.connectedUsers.length);
                    if (loginData && result.data.connectedUsers.includes(loginData._id)) {
                        setIsConnected(true);
                    }
                } else if (result.connectedUsers) {
                    setConnectionsCount(result.connectedUsers.length);
                    if (loginData && result.connectedUsers.includes(loginData._id)) {
                        setIsConnected(true);
                    }
                }
            }
            
            // Try fetching company posts with employerId if it exists on result
            let empId = null;
            if (result.data && result.data.employerId) {
                empId = typeof result.data.employerId === 'object' ? result.data.employerId._id : result.data.employerId;
            } else if (result.employerId) {
                empId = typeof result.employerId === 'object' ? result.employerId._id : result.employerId;
            }
            
            if (empId) {
                setEmployerId(empId);
                fetchCompanyPosts(empId);
            }
        } catch (error) {
            console.error('Error fetching company:', error);
        }
    };

    const fetchCompanyPosts = async (employerId) => {
        if (!employerId) return;
        setIsLoadingPosts(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/posts/user/${employerId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("usertoken")}` }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setCompanyPosts(data.posts);
            }
        } catch (error) {
            console.error("Error fetching company posts:", error);
        } finally {
            setIsLoadingPosts(false);
        }
    };


    const fetchCompanyJobs = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/jobs/by-company/${id}`);
            const result = await response.json();
            
            if (response.ok) {
                setJobs(result.data);
            }
        } catch (error) {
            console.error('Error fetching company jobs:', error);
        }
    };

    const handleConnect = async () => {
        if (!loginData) {
            toast.warning("Please login to connect.");
            return;
        }
        
        // Prevent company users from connecting to other companies
        if (loginData.role === 'employer') {
            toast.warning("Employers cannot connect with other companies.");
            return;
        }

        try {
            const endpoint = `${process.env.REACT_APP_API_URL}/company/${id}/connect`;
            const res = await fetch(endpoint, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${localStorage.getItem("usertoken")}`
                },
                body: JSON.stringify({ userId: loginData._id })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setIsConnected(data.isConnected);
                setConnectionsCount(data.connectionsCount);
                
                // Real-time synchronization
                if (data.currentUserConnectedCompanies && typeof updateUser === 'function') {
                    updateUser({ connectedCompanies: data.currentUserConnectedCompanies });
                }
            } else {
                toast.error(data.message || "Failed to connect to company");
            }
        } catch (error) {
            console.error('Error toggling connect:', error);
            toast.error("Error connecting to company");
        }
    };

    const handleMessage = async () => {
        if (!loginData || !employerId) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('usertoken')}`
                },
                body: JSON.stringify({ receiverId: employerId })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                navigate('/chat', { state: { chatId: result.data._id } });
            } else {
                toast.error("Failed to start conversation");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        }
    };

    if (isLoading) {
        return (
            <div className='bg-neutral-50 dark:bg-slate-900 min-h-screen'>
                <div className='bg-gradient-to-r from-primary to-primary-600 py-16'>
                    <div className='container-custom'>
                        <div className='flex items-center gap-6'>
                            <div className='w-24 h-24 bg-white dark:bg-slate-800/20 rounded-2xl animate-pulse' />
                            <div className='space-y-3'>
                                <div className='h-8 bg-white dark:bg-slate-800/20 rounded w-64 animate-pulse' />
                                <div className='h-5 bg-white dark:bg-slate-800/20 rounded w-40 animate-pulse' />
                            </div>
                        </div>
                    </div>
                </div>
                <div className='container-custom py-8'>
                    <div className='card p-6 mb-8'>
                        <div className='space-y-4'>
                            <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse' />
                            <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-3/4' />
                            <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded animate-pulse w-1/2' />
                        </div>
                    </div>
                    <div className='h-6 bg-neutral-200 dark:bg-slate-700 rounded w-40 animate-pulse mb-6' />
                    <div className='space-y-4'>
                        {[1, 2, 3].map(i => (
                            <div key={i} className='card p-6'>
                                <div className='h-6 bg-neutral-200 dark:bg-slate-700 rounded w-1/3 animate-pulse mb-3' />
                                <div className='h-4 bg-neutral-200 dark:bg-slate-700 rounded w-1/2 animate-pulse' />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className='container-custom py-12'>
                <div className='card max-w-xl mx-auto'>
                    <div className='empty-state py-16'>
                        <div className='w-20 h-20 bg-neutral-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6'>
                            <svg className='w-10 h-10 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                            </svg>
                        </div>
                        <h3 className='empty-state-title'>Company Not Found</h3>
                        <p className='empty-state-text'>The company you're looking for doesn't exist or has been removed.</p>
                        <Link to='/companies' className='btn-primary'>
                            Browse Companies
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-neutral-50 dark:bg-slate-900 min-h-screen'>
            <NetworkModal 
                isOpen={modalConfig.isOpen} 
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
                title={modalConfig.title} 
                dataList={modalConfig.dataList} 
                type={modalConfig.type} 
            />
            {/* Header Banner */}
            <div 
                className={`text-white py-16 relative bg-cover bg-center ${!company.bannerPhoto ? 'bg-gradient-to-r from-primary to-primary-600' : ''}`}
                style={{ backgroundImage: company.bannerPhoto ? `url("${getPhotoUrl(company.bannerPhoto)}")` : undefined }}
            >
                {company.bannerPhoto && <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>}
                <div className='container-custom relative z-10'>
                    <Link 
                        to='/companies' 
                        className='inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors'
                    >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M10 19l-7-7m0 0l7-7m-7 7h18' />
                        </svg>
                        Back to Companies
                    </Link>

                    <div className='flex flex-col md:flex-row items-start md:items-center gap-6'>
                        <div className='w-24 h-24 md:w-28 md:h-28 bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-lg flex items-center justify-center'>
                            {company.companyLogo ? (
                                <img 
                                    src={company.companyLogo} 
                                    alt={company.companyName}
                                    className='w-full h-full object-contain rounded-xl'
                                />
                            ) : (
                                <span className='text-4xl font-bold text-primary'>
                                    {company.companyName?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        
                        <div className='flex-1'>
                            <div className='flex flex-col md:flex-row justify-between md:items-start'>
                                <div>
                                    <h1 className='text-3xl md:text-4xl font-bold mb-2 text-white'>{company.companyName}</h1>
                                    {company.userId && (
                                        <div className="mb-2 flex items-center gap-2">
                                            <span 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(company.userId);
                                                    toast.success(`Copied ID: ${company.userId}`);
                                                }}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-white/20 dark:border-slate-700/50 text-xs font-semibold text-white rounded-lg cursor-pointer transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98] select-none group"
                                                title="Click to copy Company ID"
                                            >
                                                <span className="text-[10px] text-white/60 font-bold font-mono">@</span>
                                                <span className="font-mono tracking-wide">{company.userId}</span>
                                                <svg 
                                                    className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:text-white transition-all duration-300" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                </svg>
                                            </span>
                                        </div>
                                    )}
                                    <div className='flex items-center gap-3 mb-4'>
                                        <span className='badge bg-white/20 dark:bg-slate-800/20 text-white'>{company.industry}</span>
                                        <span 
                                            className='text-sm text-white opacity-80 hover:opacity-100 font-medium cursor-pointer transition-colors inline-block'
                                            onClick={openNetworkModal}
                                        >
                                            {connectionsCount} Connections
                                        </span>
                                    </div>
                                </div>
                                
                                {loginData && loginData.role !== 'company' && loginData.role !== 'employer' && (
                                    <div className="mt-4 md:mt-0 flex gap-3">
                                        {isConnected && employerId && (
                                            <button 
                                                onClick={handleMessage}
                                                className="px-6 py-2 rounded-xl transition-all font-semibold flex items-center gap-2 bg-secondary text-white hover:bg-secondary-600 shadow-lg"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                                Message
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleConnect}
                                            className={`px-6 py-2 rounded-xl transition-all font-semibold flex items-center gap-2 ${
                                                isConnected 
                                                    ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30' 
                                                    : 'bg-white text-primary hover:bg-neutral-100 shadow-xl'
                                            }`}
                                        >
                                            {isConnected ? (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Connected
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Connect
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className='flex flex-wrap items-center gap-4 mt-4 text-white opacity-90'>
                                {company.location && (
                                    <span className='flex items-center gap-2'>
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                                        </svg>
                                        {company.location}
                                    </span>
                                )}
                                
                                {company.employeeCount && (
                                    <span className='flex items-center gap-2'>
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                                        </svg>
                                        {company.employeeCount} employees
                                    </span>
                                )}

                                {company.foundedYear && (
                                    <span className='flex items-center gap-2'>
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                                        </svg>
                                        Founded {company.foundedYear}
                                    </span>
                                )}
                                
                                {company.website && (
                                    <a 
                                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                                        target='_blank' 
                                        rel='noopener noreferrer'
                                        className='flex items-center gap-2 text-white hover:text-white hover:opacity-80 transition-colors'
                                    >
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' />
                                        </svg>
                                        Website
                                    </a>
                                )}
                                {company.socialLinks?.linkedin && (
                                    <a href={company.socialLinks.linkedin.startsWith('http') ? company.socialLinks.linkedin : `https://${company.socialLinks.linkedin}`} target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 text-white hover:text-white hover:opacity-80 transition-colors'>
                                        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                                            <path d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'/>
                                        </svg>
                                        LinkedIn
                                    </a>
                                )}
                                {company.socialLinks?.twitter && (
                                    <a href={company.socialLinks.twitter.startsWith('http') ? company.socialLinks.twitter : `https://${company.socialLinks.twitter}`} target='_blank' rel='noopener noreferrer' className='flex items-center gap-2 text-white hover:text-white hover:opacity-80 transition-colors'>
                                        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                                            <path d='M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z'/>
                                        </svg>
                                        Twitter
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='container-custom py-8'>
                <div className='grid lg:grid-cols-3 gap-8'>
                    {/* Main Content */}
                    <div className='lg:col-span-2 space-y-6'>
                        {/* About */}
                        {(company.description || company.missionVision) && (
                            <div className='card p-6 space-y-6'>
                                {company.description && (
                                    <div>
                                        <h2 className='text-xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2'>
                                            <svg className='w-5 h-5 text-secondary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                            </svg>
                                            About {company.companyName}
                                        </h2>
                                        <p className='text-neutral-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap'>
                                            {company.description}
                                        </p>
                                    </div>
                                )}
                                {company.missionVision && (
                                    <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-2xl border border-primary-100 dark:border-slate-700">
                                        <h3 className="font-bold text-primary-800 dark:text-primary-400 mb-2 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Mission & Vision
                                        </h3>
                                        <p className="text-neutral-700 dark:text-slate-300 italic">"{company.missionVision}"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tech Stack & Benefits */}
                        {(company.techStack?.length > 0 || company.benefits?.length > 0) && (
                            <div className='card p-6 grid grid-cols-1 md:grid-cols-2 gap-8'>
                                {company.techStack?.length > 0 && (
                                    <div>
                                        <h3 className='font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2'>
                                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                            Our Tech Stack
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {company.techStack.map((tech, i) => (
                                                <span key={i} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-semibold border border-indigo-100 dark:border-indigo-800">{tech}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {company.benefits?.length > 0 && (
                                    <div>
                                        <h3 className='font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2'>
                                            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                            Benefits & Perks
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {company.benefits.map((perk, i) => (
                                                <span key={i} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-semibold border border-emerald-100 dark:border-emerald-800">{perk}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Awards */}
                        {company.awards?.length > 0 && (
                            <div className='card p-6'>
                                <h3 className='font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2'>
                                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                    Awards & Recognitions
                                </h3>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {company.awards.map((award, i) => (
                                        <li key={i} className="flex items-center gap-3 bg-neutral-50 dark:bg-slate-800 p-3 rounded-xl border border-neutral-100 dark:border-slate-700">
                                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"/>
                                                </svg>
                                            </div>
                                            <span className="font-semibold text-neutral-700 dark:text-slate-200">{award}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Key People */}
                        {company.keyPeople?.length > 0 && (
                            <div className='card p-6'>
                                <h3 className='font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2'>
                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    Key Leadership
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {company.keyPeople.map((person, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-neutral-200 dark:border-slate-700 shadow-sm">
                                            <div>
                                                <h4 className="font-bold text-neutral-900 dark:text-white">{person.name}</h4>
                                                <p className="text-sm text-neutral-500 dark:text-slate-400">{person.role}</p>
                                            </div>
                                            {person.linkedIn && (
                                                <a href={person.linkedIn.startsWith('http') ? person.linkedIn : `https://${person.linkedIn}`} target="_blank" rel="noopener noreferrer" className="text-secondary-600 hover:bg-secondary-50 p-2 rounded-full transition-colors">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                                    </svg>
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Gallery */}
                        {company.gallery?.length > 0 && (
                            <div className='card p-6'>
                                <h3 className='font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2'>
                                    <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Company Gallery
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {company.gallery.map((url, i) => (
                                        <div key={i} className="aspect-square md:aspect-video rounded-xl overflow-hidden group">
                                            <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Open Positions */}
                        <div className='card'>
                            <div className='bg-gradient-to-r from-secondary-600 to-secondary-700 px-6 py-4 flex items-center justify-between'>
                                <h2 className='text-lg font-semibold text-white flex items-center gap-2'>
                                    <svg className='w-5 h-5 text-white/80' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                                    </svg>
                                    Open Positions
                                </h2>
                                <span className='badge bg-white dark:bg-slate-800/20 text-white'>{jobs.length} jobs</span>
                            </div>
                            
                            <div className='p-4'>
                                {jobs.length === 0 ? (
                                    <div className='text-center py-12'>
                                        <div className='w-16 h-16 bg-neutral-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4'>
                                            <svg className='w-8 h-8 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                                            </svg>
                                        </div>
                                        <p className='text-neutral-500 dark:text-slate-400'>No open positions at the moment</p>
                                        <p className='text-sm text-neutral-400 mt-1'>Check back later for new opportunities</p>
                                    </div>
                                ) : (
                                    <div className='space-y-3'>
                                        {jobs.map((job) => (
                                            <Link 
                                                key={job._id} 
                                                to={`/current-job/${job._id}`}
                                                className='block p-4 bg-neutral-50 dark:bg-slate-700/50 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-xl border border-neutral-100 dark:border-slate-600/50 hover:border-secondary-200 dark:hover:border-secondary-500 transition-all group'
                                            >
                                                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                                                    <div className='flex-1'>
                                                        <h3 className='font-semibold text-neutral-900 dark:text-white group-hover:text-secondary-700 dark:group-hover:text-secondary-400 transition-colors mb-2'>
                                                            {job.jobTitle}
                                                        </h3>
                                                        <div className='flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-slate-400'>
                                                            <span className='flex items-center gap-1'>
                                                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                                                                </svg>
                                                                {job.location}
                                                            </span>
                                                            <span className='badge-neutral'>{job.employmentType}</span>
                                                            {(job.salary || job.salaryMin) && (
                                                                <span className='badge-success'>{formatSalary(job)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className='flex items-center gap-2 text-secondary-600 font-medium text-sm'>
                                                        Apply Now
                                                        <svg className='w-4 h-4 group-hover:translate-x-1 transition-transform' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className='space-y-6'>
                        {/* Quick Stats */}
                        <div className='card p-6'>
                            <h3 className='font-semibold text-neutral-900 dark:text-white mb-4'>Quick Stats</h3>
                            <div className='space-y-4'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-neutral-600 dark:text-slate-400'>Open Positions</span>
                                    <span className='font-semibold text-neutral-900 dark:text-white'>{jobs.length}</span>
                                </div>
                                {company.employeeCount && (
                                    <div className='flex items-center justify-between'>
                                        <span className='text-neutral-600 dark:text-slate-400'>Company Size</span>
                                        <span className='font-semibold text-neutral-900 dark:text-white'>{company.employeeCount}</span>
                                    </div>
                                )}
                                {company.foundedYear && (
                                    <div className='flex items-center justify-between'>
                                        <span className='text-neutral-600 dark:text-slate-400'>Founded</span>
                                        <span className='font-semibold text-neutral-900 dark:text-white'>{company.foundedYear}</span>
                                    </div>
                                )}
                                <div className='flex items-center justify-between'>
                                    <span className='text-neutral-600 dark:text-slate-400'>Industry</span>
                                    <span className='font-semibold text-neutral-900 dark:text-white'>{company.industry}</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className='card p-6 bg-gradient-to-br from-secondary-50 to-secondary-100 border-secondary-200'>
                            <h3 className='font-semibold text-secondary-900 mb-2'>Interested in this company?</h3>
                            <p className='text-sm text-secondary-700 mb-4'>
                                Check out their open positions and apply today!
                            </p>
                            <Link to='/all-posted-jobs' className='btn-secondary w-full'>
                                Browse All Jobs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Company Posts Section */}
            {company && (
                <div className="container-custom py-8">
                    <div className="bg-neutral-50 dark:bg-slate-800 mx-auto py-12 md:px-14 px-8 rounded-lg mt-8 mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-primary/10 text-primary p-2 rounded-xl">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" /></svg>
                            </div>
                            <h2 className="text-xl font-bold text-neutral-800 dark:text-white">Recent Updates Feed</h2>
                        </div>

                        {isLoadingPosts ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="spinner border-t-primary w-8 h-8"></div>
                            </div>
                        ) : companyPosts.length > 0 ? (
                            <div className="space-y-6">
                                {companyPosts.map(post => (
                                    <PostCard 
                                        key={post._id} 
                                        post={post} 
                                        currentUserId={loginData?._id}
                                        onPostUpdated={(data, action) => {
                                            if (action === 'delete') {
                                                setCompanyPosts(posts => posts.filter(p => p._id !== data));
                                            } else if (action === 'update') {
                                                setCompanyPosts(posts => posts.map(p => p._id === data._id ? data : p));
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-slate-700/50 rounded-2xl border border-neutral-100 dark:border-slate-600">
                                <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-2">No Updates Yet</h3>
                                <p className="text-sm text-neutral-500 dark:text-slate-400">
                                    This company hasn't posted anything to their feed recently.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDetails;

import React, { useState, useContext, useEffect, useRef } from 'react';
import { LoginContext } from '../components/ContextProvider/Context';
import { toast, ToastContainer } from 'react-toastify';
import { Link } from 'react-router-dom';
import NetworkModal from '../components/NetworkModal';
import { ShareModal } from '../components/ShareModal';

export const Profile = () => {
    const { loginData, updateUser } = useContext(LoginContext);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const fileInputRef = useRef(null);
    const bannerInputRef = useRef(null);

    const isEmployer = loginData?.role === 'employer';
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    const [formData, setFormData] = useState({
        userName: '',
        userEmail: '',
        gender: '',
        address: '',
        bio: '',
        skills: '',
        preferredJobType: '',
        // Company specific
        companyName: '',
        industry: '',
        employeeCount: '',
        foundedYear: '',
        website: '',
        location: '',
        description: '',
        missionVision: '',
        techStack: '',
        benefits: '',
        awards: '',
        linkedin: '',
        twitter: ''
    });

    const [keyPeople, setKeyPeople] = useState([]);
    const [gallery, setGallery] = useState([]);
    const galleryInputRef = useRef(null);
    const [isUploadingGallery, setIsUploadingGallery] = useState(false);

    // Network Modal State
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', type: '', dataList: [] });

    // Share Modal State
    const [isShareOpen, setIsShareOpen] = useState(false);

    const openNetworkModal = async (type, title) => {
        setModalConfig({ isOpen: true, title, type, dataList: [] });
        try {
            const endpoint = isEmployer 
                ? `${API_BASE_URL}/api/company/${loginData.companyId._id}/network`
                : `${API_BASE_URL}/api/users/user/${loginData._id}/network`;
                
            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("usertoken")}` }
            });
            const data = await response.json();
            
            if (response.ok && data.success) {
                let list = [];
                if (isEmployer) {
                    list = data.connectedUsers || [];
                } else {
                    if (type === 'followers') list = data.followers || [];
                    else if (type === 'following') list = data.following || [];
                    else if (type === 'connections') list = data.connectedCompanies || [];
                }
                setModalConfig({ isOpen: true, title, type, dataList: list });
            } else {
                toast.error("Failed to load network data.");
                setModalConfig(prev => ({ ...prev, isOpen: false }));
            }
        } catch (error) {
            console.error(error);
            toast.error("Error loading network data.");
            setModalConfig(prev => ({ ...prev, isOpen: false }));
        }
    };

    useEffect(() => {
        if (loginData) {
            if (isEmployer && loginData.companyId) {
                setFormData({
                    userName: loginData.userName || '',
                    userEmail: loginData.userEmail || '',
                    companyName: loginData.companyId.companyName || '',
                    industry: loginData.companyId.industry || '',
                    employeeCount: loginData.companyId.employeeCount || '1-10',
                    foundedYear: loginData.companyId.foundedYear || '',
                    website: loginData.companyId.website || '',
                    location: loginData.companyId.location || '',
                    description: loginData.companyId.description || '',
                    missionVision: loginData.companyId.missionVision || '',
                    techStack: loginData.companyId.techStack?.join(', ') || '',
                    benefits: loginData.companyId.benefits?.join(', ') || '',
                    awards: loginData.companyId.awards?.join(', ') || '',
                    linkedin: loginData.companyId.socialLinks?.linkedin || '',
                    twitter: loginData.companyId.socialLinks?.twitter || ''
                });
                setKeyPeople(loginData.companyId.keyPeople || []);
                setGallery(loginData.companyId.gallery || []);
            } else {
                setFormData({
                    userName: loginData.userName || '',
                    userEmail: loginData.userEmail || '',
                    gender: loginData.gender || '',
                    address: loginData.address || '',
                    bio: loginData.bio || '',
                    skills: loginData.skills?.join(', ') || '',
                    preferredJobType: loginData.preferredJobType || '',
                    role: loginData.role || 'candidate'
                });
            }
        }
    }, [loginData, isEditing, isEmployer]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleKeyPersonChange = (index, field, value) => {
        const newPeople = [...keyPeople];
        newPeople[index][field] = value;
        setKeyPeople(newPeople);
    };

    const addKeyPerson = () => {
        setKeyPeople([...keyPeople, { name: '', role: '', linkedIn: '' }]);
    };

    const removeKeyPerson = (index) => {
        const newPeople = [...keyPeople];
        newPeople.splice(index, 1);
        setKeyPeople(newPeople);
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setIsUploadingGallery(true);
        const uploadData = new FormData();
        files.forEach(file => uploadData.append('photos', file));

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload/company-gallery/${loginData.companyId._id}`, {
                method: 'POST',
                body: uploadData
            });

            const resData = await response.json();
            if (response.ok && resData.success) {
                toast.success("Gallery updated!");
                setGallery(resData.gallery);
                updateUser({ companyId: { ...loginData.companyId, gallery: resData.gallery } });
            } else {
                throw new Error(resData.message || "Failed to upload gallery photos.");
            }
        } catch (error) {
            toast.error(error.message || "Failed to upload gallery photos.");
        } finally {
            setIsUploadingGallery(false);
        }
    };

    const handleRemoveGalleryPhoto = async (photoUrl) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/upload/company-gallery/${loginData.companyId._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoUrl })
            });

            const resData = await response.json();
            if (response.ok && resData.success) {
                toast.success("Photo removed!");
                setGallery(resData.gallery);
                updateUser({ companyId: { ...loginData.companyId, gallery: resData.gallery } });
            }
        } catch (error) {
            toast.error("Failed to remove photo.");
        }
    };

    const handlePhotoClick = () => {
        if (isEditing) {
            fileInputRef.current.click();
        }
    };

    const handleBannerClick = () => {
        if (isEditing) {
            bannerInputRef.current.click();
        }
    };

    const handleBannerChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            toast.error("Please upload a valid image file (JPEG, PNG, WebP).");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB.");
            return;
        }

        setIsUploadingBanner(true);
        const uploadData = new FormData();
        uploadData.append('banner', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload/banner-photo/${loginData._id}`, {
                method: 'POST',
                body: uploadData
            });

            const resData = await response.json();

            if (response.ok && resData.success) {
                toast.success("Banner photo updated!");
                
                if (isEmployer) {
                    updateUser({ 
                        bannerPhoto: resData.bannerPhoto, 
                        companyId: { ...loginData.companyId, bannerPhoto: resData.bannerPhoto } 
                    });
                } else {
                    updateUser({ bannerPhoto: resData.bannerPhoto });
                }
            } else {
                throw new Error(resData.message || "Failed to upload banner.");
            }
        } catch (error) {
            toast.error(error.message || "Failed to upload banner.");
        } finally {
            setIsUploadingBanner(false);
        }
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            toast.error("Please upload a valid image file (JPEG, PNG, WebP).");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB.");
            return;
        }

        setIsUploading(true);
        const uploadData = new FormData();
        uploadData.append('photo', file);

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload/profile-photo/${loginData._id}`, {
                method: 'POST',
                body: uploadData
            });

            const resData = await response.json();

            if (response.ok && resData.success) {
                toast.success("Profile photo updated!");
                updateUser({ profilePhoto: resData.profilePhoto });
            } else {
                throw new Error(resData.message || "Failed to upload photo.");
            }
        } catch (error) {
            toast.error(error.message || "Failed to upload photo.");
        } finally {
            setIsUploading(false);
        }
    };

    const removePhoto = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users/update-user/${loginData._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profilePhoto: "" })
            });
            const resData = await response.json();
            if (response.ok && resData.success) {
                toast.success("Profile photo removed.");
                updateUser({ profilePhoto: "" });
            }
        } catch (error) {
            toast.error("Failed to remove photo.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let response;
            let reqBody;
            const token = localStorage.getItem("usertoken");

            // Handle standard user update
            if (!isEmployer || !loginData.companyId) {
                const skillsArray = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(s => s !== '') : [];
                reqBody = {
                    userName: formData.userName,
                    gender: formData.gender,
                    address: formData.address,
                    bio: formData.bio,
                    skills: skillsArray,
                    preferredJobType: formData.preferredJobType,
                    role: formData.role
                };
                
                response = await fetch(`${API_BASE_URL}/api/users/update-user/${loginData._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(reqBody)
                });
            } 
            // Handle employer updating company
            else {
                reqBody = {
                    companyName: formData.companyName,
                    industry: formData.industry,
                    employeeCount: formData.employeeCount,
                    foundedYear: formData.foundedYear,
                    website: formData.website,
                    location: formData.location,
                    description: formData.description,
                    missionVision: formData.missionVision,
                    techStack: formData.techStack ? formData.techStack.split(',').map(s => s.trim()).filter(Boolean) : [],
                    benefits: formData.benefits ? formData.benefits.split(',').map(s => s.trim()).filter(Boolean) : [],
                    awards: formData.awards ? formData.awards.split(',').map(s => s.trim()).filter(Boolean) : [],
                    socialLinks: { linkedin: formData.linkedin, twitter: formData.twitter },
                    keyPeople: keyPeople.filter(p => p.name.trim() && p.role.trim())
                };
                
                response = await fetch(`${API_BASE_URL}/api/company/update/${loginData.companyId._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(reqBody)
                });
                
                // If they changed their top-level name, update the user context too
                if (formData.userName && formData.userName !== loginData.userName) {
                    await fetch(`${API_BASE_URL}/api/users/update-user/${loginData._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userName: formData.userName })
                    });
                }
            }

            const resData = await response.json();

            if (response.ok && resData.success) {
                toast.success("Profile updated successfully!");
                if (isEmployer) {
                    // Update user context with new company state
                    const newCompanyData = { ...loginData.companyId, ...resData.data };
                    updateUser({ companyId: newCompanyData, userName: formData.userName });
                } else {
                    updateUser(resData.data);
                }
                setIsEditing(false);
            } else {
                throw new Error("Failed to update profile.");
            }
        } catch (error) {
            toast.error(error.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    const getPhotoUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    const getRoleBadgeColor = (role) => {
        switch(role) {
            case 'employer': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'coordinator': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'recruiter': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'candidate': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-neutral-100 dark:bg-slate-800/50 text-neutral-700 dark:text-slate-300 border-neutral-200 dark:border-slate-600';
        }
    };

    return (
        <div className="page-wrapper py-12">
            <ToastContainer position="top-right" autoClose={3000} />
            <NetworkModal 
                isOpen={modalConfig.isOpen} 
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
                title={modalConfig.title} 
                dataList={modalConfig.dataList} 
                type={modalConfig.type} 
            />
            <div className="max-w-5xl mx-auto space-y-8">
                
                {/* Header / Banner Area */}
                <div className="card border border-white/60 dark:border-slate-700/50 shadow-soft backdrop-blur-xl bg-white/60 dark:bg-slate-800/80 overflow-hidden relative">
                    <div 
                        className={`h-48 relative bg-cover bg-center group ${!(loginData?.companyId?.bannerPhoto || loginData?.bannerPhoto) ? 'bg-gradient-to-r from-secondary-400 via-primary-500 to-secondary-600' : ''}`}
                        style={{ backgroundImage: (loginData?.companyId?.bannerPhoto || loginData?.bannerPhoto) ? `url("${getPhotoUrl(loginData?.companyId?.bannerPhoto || loginData?.bannerPhoto)}")` : undefined }}
                        onClick={handleBannerClick}
                    >
                        <div className={`absolute inset-0 transition-opacity ${isEditing ? 'bg-black/40 cursor-pointer hover:bg-black/50' : 'bg-black/20'} backdrop-blur-[2px]`}></div>
                        {isEditing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span className="text-[10px] text-white font-semibold uppercase tracking-wider">Update Banner</span>
                            </div>
                        )}
                        {isUploadingBanner && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                <div className="spinner border-t-white w-8 h-8"></div>
                            </div>
                        )}
                        
                        <input type="file" ref={bannerInputRef} onChange={handleBannerChange} className="hidden" accept="image/jpeg,image/png,image/jpg,image/webp" />

                        {/* Interactive Edit Button mapped to Header right corner */}
                        <div className="absolute top-4 right-4 z-10 flex flex-wrap justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {loginData?.role === 'candidate' && !isEditing && (
                                <Link to="/candidate/dashboard" className="btn-primary btn-sm flex items-center gap-2 whitespace-nowrap shadow-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                    Dashboard
                                </Link>
                            )}
                            {!isEditing && (
                                <>
                                    <button 
                                        onClick={() => setIsShareOpen(true)}
                                        className="btn btn-sm bg-white dark:bg-slate-800/80 text-neutral-800 dark:text-slate-100 hover:bg-neutral-100 dark:hover:bg-slate-700 backdrop-blur flex items-center gap-2 whitespace-nowrap shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <svg className="w-4 h-4 text-neutral-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        Share Profile
                                    </button>
                                    <Link to="/activity" className="btn btn-sm bg-white dark:bg-slate-800/80 text-neutral-800 dark:text-slate-100 hover:bg-neutral-100 dark:hover:bg-slate-700 backdrop-blur flex items-center gap-2 whitespace-nowrap shadow-sm">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        My Activity
                                    </Link>
                                </>
                            )}
                            {isEditing ? (
                                <button onClick={() => setIsEditing(false)} className="btn btn-sm bg-white dark:bg-slate-800/80 text-neutral-800 dark:text-slate-100 hover:bg-neutral-100 dark:hover:bg-slate-700 backdrop-blur flex items-center gap-2 whitespace-nowrap shadow-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    Cancel
                                </button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="btn btn-sm bg-white dark:bg-slate-800/80 text-neutral-800 dark:text-slate-100 hover:bg-neutral-100 dark:hover:bg-slate-700 backdrop-blur flex items-center gap-2 whitespace-nowrap shadow-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="px-8 pb-8 relative">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* Avatar Layered Over Banner */}
                            <div className="-mt-20 relative group">
                                <div 
                                    className={`w-36 h-36 rounded-full border-4 border-white dark:border-slate-800 shadow-strong overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center relative ${isEditing ? 'cursor-pointer' : ''}`}
                                    onClick={handlePhotoClick}
                                >
                                    {loginData?.profilePhoto ? (
                                        <img src={getPhotoUrl(loginData.profilePhoto)} alt="Avatar" className="w-full h-full object-cover transition duration-300" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-secondary to-secondary-700 flex items-center justify-center text-white text-5xl font-bold">
                                            {loginData?.userName?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                    
                                    {isEditing && (
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                                            <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                                            <span className="text-[10px] text-white font-semibold uppercase tracking-wider">Update Photo</span>
                                        </div>
                                    )}
                                </div>
                                {isUploading && (
                                    <div className="absolute inset-0 bg-white dark:bg-slate-800/60 rounded-full flex items-center justify-center -mt-20 border-4 border-white">
                                        <div className="spinner border-t-primary w-8 h-8"></div>
                                    </div>
                                )}
                                {isEditing && loginData?.profilePhoto && (
                                    <button onClick={removePhoto} className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-red-500 bg-red-50 px-3 py-1 rounded-full whitespace-nowrap opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity border border-red-100 font-bold shadow-sm">
                                        Remove
                                    </button>
                                )}
                            </div>
                            
                            <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/jpeg,image/png,image/jpg,image/webp" />

                            <div className="mt-4 md:mt-2 flex-1 relative top-[-10px]">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                                        {loginData?.userName}
                                    </h1>
                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wide inline-flex items-center shadow-sm ${getRoleBadgeColor(loginData?.role)}`}>
                                        {loginData?.role}
                                    </span>
                                </div>
                                {loginData?.userId && (
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <span 
                                            onClick={() => {
                                                navigator.clipboard.writeText(loginData.userId);
                                                toast.success(`Copied ID: ${loginData.userId}`);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50/50 hover:bg-primary-100/60 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-primary-100/50 dark:border-slate-700/50 text-xs font-semibold text-primary dark:text-primary-400 rounded-lg cursor-pointer transition-all duration-300 shadow-sm hover:scale-[1.02] active:scale-[0.98] select-none group"
                                            title="Click to copy User ID"
                                        >
                                            <span className="text-[10px] text-primary-400 dark:text-primary-500 font-bold font-mono">@</span>
                                            <span className="font-mono tracking-wide">{loginData.userId}</span>
                                            <svg 
                                                className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-all duration-300" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                            </svg>
                                        </span>
                                    </div>
                                )}
                                <p className="text-sm md:text-base text-neutral-600 dark:text-slate-400 mt-1 font-medium">{loginData?.bio || "No bio added yet."}</p>
                                
                                <div className="flex flex-wrap gap-4 mt-3 text-sm text-neutral-500 dark:text-slate-400 font-medium">
                                    {loginData?.companyId?.companyName && (
                                        <span className="flex items-center gap-1.5 py-1 px-3 bg-neutral-50 dark:bg-slate-700/50 rounded-full border border-neutral-100 dark:border-slate-700 shadow-sm whitespace-nowrap text-neutral-700 dark:text-slate-200">
                                            <svg className="w-4 h-4 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> 
                                            {loginData.companyId.companyName}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> {loginData?.userEmail}</span>
                                    {loginData?.address && (
                                        <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> {loginData.address}</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-neutral-200 dark:border-slate-700/60 text-sm">
                                    {isEmployer ? (
                                        <div className="flex flex-col cursor-pointer group" onClick={() => openNetworkModal('connections', 'Connections')}>
                                            <span className="font-bold text-neutral-800 dark:text-slate-200 text-lg group-hover:text-primary transition-colors">{loginData?.companyId?.connectedUsers?.length || 0}</span>
                                            <span className="text-neutral-500 dark:text-slate-400 font-medium tracking-wide group-hover:text-primary-600 transition-colors">Connections</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-col cursor-pointer group" onClick={() => openNetworkModal('followers', 'Followers')}>
                                                <span className="font-bold text-neutral-800 dark:text-slate-200 text-lg group-hover:text-primary transition-colors">{loginData?.followers?.length || 0}</span>
                                                <span className="text-neutral-500 dark:text-slate-400 font-medium tracking-wide group-hover:text-primary-600 transition-colors">Followers</span>
                                            </div>
                                            <div className="flex flex-col cursor-pointer group" onClick={() => openNetworkModal('following', 'Following')}>
                                                <span className="font-bold text-neutral-800 dark:text-slate-200 text-lg group-hover:text-primary transition-colors">{loginData?.following?.length || 0}</span>
                                                <span className="text-neutral-500 dark:text-slate-400 font-medium tracking-wide group-hover:text-primary-600 transition-colors">Following</span>
                                            </div>
                                            <div className="flex flex-col cursor-pointer group" onClick={() => openNetworkModal('connections', 'Connected Companies')}>
                                                <span className="font-bold text-neutral-800 dark:text-slate-200 text-lg group-hover:text-primary transition-colors">{loginData?.connectedCompanies?.length || 0}</span>
                                                <span className="text-neutral-500 dark:text-slate-400 font-medium tracking-wide group-hover:text-primary-600 transition-colors">Connections</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Sub Panel Grids */}
                {isEditing ? (
                    <div className="card p-8 border border-white/60 dark:border-slate-700/50 shadow-soft backdrop-blur-xl bg-white/70 dark:bg-slate-800/80 animate-slide-up">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h2 className="text-xl font-bold text-neutral-800 dark:text-slate-100 border-b border-neutral-200/60 dark:border-slate-700/60 pb-3 mb-6">Edit Profile Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-group space-y-1.5 opacity-70">
                                    <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Email Address (Locked)</label>
                                    <input type="email" name="userEmail" value={formData.userEmail} className="input bg-neutral-100 dark:bg-slate-700 cursor-not-allowed shadow-sm rounded-xl" disabled />
                                </div>
                                
                                {isEmployer ? (
                                    <>
                                        <div className="form-group space-y-1.5">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Company Name</label>
                                            <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl" required />
                                        </div>
                                        <div className="form-group space-y-1.5">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Industry</label>
                                            <select name="industry" value={formData.industry} onChange={handleInputChange} className="select bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 shadow-sm rounded-xl" required>
                                                <option value="">Select an Industry</option>
                                                <option value="Technology">Technology</option>
                                                <option value="Finance">Finance</option>
                                                <option value="Healthcare">Healthcare</option>
                                                <option value="Education">Education</option>
                                                <option value="Manufacturing">Manufacturing</option>
                                                <option value="Retail">Retail</option>
                                                <option value="Real Estate">Real Estate</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group space-y-1.5">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Employee Count</label>
                                            <select name="employeeCount" value={formData.employeeCount} onChange={handleInputChange} className="select bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 shadow-sm rounded-xl">
                                                <option value="1-10">1-10</option>
                                                <option value="11-50">11-50</option>
                                                <option value="51-200">51-200</option>
                                                <option value="201-500">201-500</option>
                                                <option value="501-1000">501-1000</option>
                                                <option value="1000+">1000+</option>
                                            </select>
                                        </div>
                                        <div className="form-group space-y-1.5">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Founded Year</label>
                                            <input type="number" name="foundedYear" value={formData.foundedYear} onChange={handleInputChange} className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl" />
                                        </div>
                                        <div className="form-group space-y-1.5">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Website</label>
                                            <input type="url" name="website" value={formData.website} onChange={handleInputChange} className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl" />
                                        </div>
                                        <div className="form-group space-y-1.5 xl:col-span-1">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Company Location</label>
                                            <textarea name="location" value={formData.location} onChange={handleInputChange} rows="2" className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl resize-none" required></textarea>
                                        </div>
                                        <div className="form-group space-y-1.5 md:col-span-2">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Company Description</label>
                                            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" placeholder="Describe your company..." className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl resize-none"></textarea>
                                        </div>
                                        <div className="form-group space-y-1.5 md:col-span-2 mt-4 pt-4 border-t border-neutral-200 dark:border-slate-600/50">
                                            <h4 className="font-bold text-neutral-800 dark:text-slate-200">Additional Company Details</h4>
                                        </div>
                                        <div className="form-group space-y-1.5 md:col-span-2">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Mission & Vision</label>
                                            <textarea name="missionVision" value={formData.missionVision} onChange={handleInputChange} rows="3" placeholder="What drives your company?" className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl resize-none"></textarea>
                                        </div>
                                        <div className="form-group space-y-1.5 xl:col-span-1">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Tech Stack (Comma-separated)</label>
                                            <input type="text" name="techStack" value={formData.techStack} onChange={handleInputChange} placeholder="e.g. React, Node.js, AWS" className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl" />
                                        </div>
                                        <div className="form-group space-y-1.5 xl:col-span-1">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Benefits & Perks (Comma-separated)</label>
                                            <input type="text" name="benefits" value={formData.benefits} onChange={handleInputChange} placeholder="e.g. Health Insurance, Remote Work" className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl" />
                                        </div>
                                        <div className="form-group space-y-1.5 xl:col-span-1">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Awards & Recognitions (Comma-separated)</label>
                                            <input type="text" name="awards" value={formData.awards} onChange={handleInputChange} placeholder="e.g. Top Startup 2023, Great Place to Work" className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl" />
                                        </div>
                                        <div className="form-group space-y-1.5 xl:col-span-1">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Social Links</label>
                                            <div className="space-y-2">
                                                <input type="url" name="linkedin" value={formData.linkedin} onChange={handleInputChange} placeholder="LinkedIn URL" className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl text-sm" />
                                                <input type="url" name="twitter" value={formData.twitter} onChange={handleInputChange} placeholder="Twitter / X URL" className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl text-sm" />
                                            </div>
                                        </div>
                                        {/* Key People */}
                                        <div className="form-group space-y-2 md:col-span-2 mt-4 pt-4 border-t border-neutral-200 dark:border-slate-600/50">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Key Leadership / People</label>
                                            {keyPeople.map((person, index) => (
                                                <div key={index} className="flex flex-wrap md:flex-nowrap gap-2 items-center mb-2">
                                                    <input type="text" placeholder="Name" value={person.name} onChange={(e) => handleKeyPersonChange(index, "name", e.target.value)} className="input flex-1 min-w-[150px] bg-white dark:bg-slate-800/50 rounded-xl" />
                                                    <input type="text" placeholder="Role (e.g. CEO)" value={person.role} onChange={(e) => handleKeyPersonChange(index, "role", e.target.value)} className="input flex-1 min-w-[150px] bg-white dark:bg-slate-800/50 rounded-xl" />
                                                    <input type="url" placeholder="LinkedIn URL" value={person.linkedIn} onChange={(e) => handleKeyPersonChange(index, "linkedIn", e.target.value)} className="input flex-1 min-w-[150px] bg-white dark:bg-slate-800/50 rounded-xl" />
                                                    <button type="button" onClick={() => removeKeyPerson(index)} className="btn-secondary btn-sm rounded-xl px-3 border-red-200 text-red-600 hover:bg-red-50">Remove</button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={addKeyPerson} className="text-sm font-semibold text-secondary-600 hover:text-secondary-800">+ Add Person</button>
                                        </div>
                                        {/* Company Gallery */}
                                        <div className="form-group space-y-2 md:col-span-2 mt-4 pt-4 border-t border-neutral-200 dark:border-slate-600/50">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-neutral-800 dark:text-slate-200">Company Gallery</h4>
                                                    <p className="text-xs text-neutral-500 dark:text-slate-400">Upload office photos or team outings.</p>
                                                </div>
                                                <button type="button" onClick={() => galleryInputRef.current.click()} className="btn-secondary btn-sm rounded-xl">
                                                    {isUploadingGallery ? "Uploading..." : "Upload Photos"}
                                                </button>
                                                <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} multiple accept="image/*" className="hidden" />
                                            </div>
                                            {gallery.length > 0 && (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                                    {gallery.map((url, i) => (
                                                        <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-neutral-200 dark:border-slate-600 shadow-sm">
                                                            <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <button type="button" onClick={(e) => { e.preventDefault(); handleRemoveGalleryPhoto(url); }} className="text-xs text-white bg-red-500 rounded-lg px-3 py-1 font-bold shadow-sm">Remove</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group space-y-1.5">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Full Name</label>
                                            <input type="text" name="userName" value={formData.userName} onChange={handleInputChange} className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl" required />
                                        </div>
                                        <div className="form-group space-y-1.5 md:col-span-2">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Bio</label>
                                            <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="2" placeholder="Write a short sub-headline about yourself..." className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl resize-none"></textarea>
                                        </div>
                                        <div className="form-group space-y-1.5">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Role</label>
                                            <select name="role" value={formData.role} onChange={handleInputChange} className="select bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 shadow-sm rounded-xl" required>
                                                <option value="candidate">Candidate</option>
                                                <option value="recruiter">Recruiter</option>
                                                <option value="coordinator">Coordinator</option>
                                            </select>
                                        </div>
                                        <div className="form-group space-y-1.5">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Gender</label>
                                            <select name="gender" value={formData.gender} onChange={handleInputChange} className="select bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 shadow-sm rounded-xl" required>
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group space-y-1.5">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Preferred Job Type</label>
                                            <select name="preferredJobType" value={formData.preferredJobType} onChange={handleInputChange} className="select bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 shadow-sm rounded-xl">
                                                <option value="">Select Job Type</option>
                                                <option value="Full-time">Full-time</option>
                                                <option value="Part-time">Part-time</option>
                                                <option value="Contract">Contract</option>
                                                <option value="Internship">Internship</option>
                                                <option value="Freelance">Freelance</option>
                                            </select>
                                        </div>
                                        <div className="form-group space-y-1.5 xl:col-span-1">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Location / Address</label>
                                            <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2" className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl resize-none" required></textarea>
                                        </div>
                                        <div className="form-group space-y-1.5 xl:col-span-1">
                                            <label className="label text-neutral-700 dark:text-slate-300 font-semibold mb-0">Skills (Comma-separated)</label>
                                            <textarea name="skills" value={formData.skills} onChange={handleInputChange} rows="2" placeholder="e.g. React, Node.js, Python, Marketing" className="input bg-white dark:bg-slate-800/50 backdrop-blur-sm focus:bg-white dark:bg-slate-800 transition-all shadow-sm rounded-xl resize-none"></textarea>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="pt-6 border-t border-neutral-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row justify-end gap-4 mt-6">
                                <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary rounded-xl px-10 border border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 hover:bg-neutral-50 dark:hover:bg-slate-700 shadow-sm text-neutral-700 dark:text-slate-200 transition">Cancel</button>
                                <button type="submit" disabled={isLoading} className="btn-primary rounded-xl px-10 shadow-medium hover:shadow-strong transition-all relative">
                                    {isLoading ? <span className="flex items-center gap-2 px-4"><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>Saving...</span> : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8 animate-slide-up">
                            <div className="card p-8 border border-white/60 dark:border-slate-700/50 shadow-soft backdrop-blur-xl bg-white/70 dark:bg-slate-800/80">
                                <h3 className="text-xl font-bold text-neutral-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                                    {isEmployer ? (
                                        <><svg className="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> Company Description</>
                                    ) : (
                                        <><svg className="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Skills & Expertise</>
                                    )}
                                </h3>
                                {isEmployer ? (
                                    <>
                                        <p className="text-neutral-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                            {loginData?.companyId?.description || <span className="text-neutral-400 italic">No description provided yet. Edit profile to add.</span>}
                                        </p>
                                        
                                        {/* Mission & Vision */}
                                        {loginData?.companyId?.missionVision && (
                                            <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-2xl border border-primary-100 dark:border-slate-700 mt-6">
                                                <h3 className="font-bold text-primary-800 dark:text-primary-400 mb-2 flex items-center gap-2">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    Mission & Vision
                                                </h3>
                                                <p className="text-neutral-700 dark:text-slate-300 italic">"{loginData.companyId.missionVision}"</p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    loginData?.skills && loginData.skills.length > 0 ? (
                                        <div className="flex flex-wrap gap-2.5">
                                            {loginData.skills.map((skill, index) => (
                                                <span key={index} className="px-4 py-2 bg-gradient-to-r from-secondary-50 to-primary-50 dark:from-slate-700 dark:to-slate-700/80 text-neutral-700 dark:text-slate-200 border border-neutral-200/60 dark:border-slate-600/60 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-shadow cursor-default">{skill}</span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-neutral-500 dark:text-slate-400 italic p-4 bg-neutral-50 dark:bg-slate-800/80 rounded-xl border border-dashed border-neutral-200 dark:border-slate-600 text-sm">No skills added yet.</p>
                                    )
                                )}
                            </div>

                            {/* Key People */}
                            {isEmployer && loginData?.companyId?.keyPeople?.length > 0 && (
                                <div className="card p-8 border border-white/60 dark:border-slate-700/50 shadow-soft backdrop-blur-xl bg-white/70 dark:bg-slate-800/80">
                                    <h3 className="text-xl font-bold text-neutral-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> Key Leadership
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {loginData.companyId.keyPeople.map((person, i) => (
                                            <div key={i} className="flex items-center gap-4 bg-neutral-50 dark:bg-slate-800/50 p-4 rounded-xl border border-neutral-100 dark:border-slate-700">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0 text-xl font-bold text-primary-700 dark:text-slate-300">
                                                    {person.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-neutral-800 dark:text-slate-100">{person.name}</h4>
                                                    <p className="text-sm text-neutral-500 dark:text-slate-400">{person.role}</p>
                                                    {person.linkedIn && (
                                                        <a href={person.linkedIn} target="_blank" rel="noopener noreferrer" className="text-xs text-secondary-600 hover:text-secondary-800 mt-1 inline-block">View LinkedIn</a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Company Gallery */}

                            {isEmployer && (
                                <div className="card p-8 border border-white/60 dark:border-slate-700/50 shadow-soft backdrop-blur-xl bg-white/70 dark:bg-slate-800/80">
                                    <h3 className="text-xl font-bold text-neutral-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Company Gallery
                                    </h3>
                                    {loginData?.companyId?.gallery?.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {loginData.companyId.gallery.map((url, i) => (
                                                <div key={i} className="aspect-square md:aspect-video rounded-xl overflow-hidden group border border-neutral-200 dark:border-slate-700">
                                                    <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-200 dark:border-slate-700 rounded-xl bg-neutral-50/50 dark:bg-slate-800/50 text-center">
                                            <svg className="w-12 h-12 text-neutral-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            <p className="text-neutral-500 dark:text-slate-400 font-medium tracking-wide">No company photos added yet.</p>
                                            <button onClick={() => setIsEditing(true)} className="mt-3 text-sm font-bold text-secondary-600 bg-secondary-50 px-4 py-1.5 rounded-lg hover:bg-secondary-100 transition-colors">
                                                Edit Profile to Upload
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isEmployer && (
                                <div className="card p-8 border border-white/60 dark:border-slate-700/50 shadow-soft backdrop-blur-xl bg-white/70 dark:bg-slate-800/80">
                                    <h3 className="text-xl font-bold text-neutral-800 dark:text-slate-100 mb-6 flex items-center gap-2"><svg className="w-5 h-5 text-primary dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Professional Goals</h3>
                                    <div className="bg-neutral-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-neutral-100 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm text-neutral-500 dark:text-slate-400 mb-1 font-semibold">Preferred Job Type</p>
                                            <p className="font-bold text-neutral-800 dark:text-slate-100 text-lg">{loginData?.preferredJobType || "Not specified"}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="md:col-span-1 space-y-8 animate-slide-up" style={{animationDelay: '100ms'}}>
                            <div className="card p-6 border border-white/60 dark:border-slate-700/50 shadow-soft backdrop-blur-xl bg-white/70 dark:bg-slate-800/80">
                                <h3 className="font-bold text-neutral-800 dark:text-slate-100 mb-4 pb-3 border-b border-neutral-100 dark:border-slate-700/60">Quick Facts</h3>
                                <ul className="space-y-4">
                                    {isEmployer ? (
                                        <>
                                            <li>
                                                <p className="text-[10px] text-neutral-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5">Industry</p>
                                                <p className="font-medium text-neutral-700 dark:text-slate-200">{loginData?.companyId?.industry || "—"}</p>
                                            </li>
                                            <li>
                                                <p className="text-[10px] text-neutral-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5">Company Size</p>
                                                <p className="font-medium text-neutral-700 dark:text-slate-200">{loginData?.companyId?.employeeCount || "—"} Employees</p>
                                            </li>
                                            <li>
                                                <p className="text-[10px] text-neutral-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5">Founded</p>
                                                <p className="font-medium text-neutral-700 dark:text-slate-200">{loginData?.companyId?.foundedYear || "—"}</p>
                                            </li>
                                            <li>
                                                <p className="text-[10px] text-neutral-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5">Website</p>
                                                {loginData?.companyId?.website ? (
                                                    <a href={loginData.companyId.website.startsWith('http') ? loginData.companyId.website : `http://${loginData.companyId.website}`} target="_blank" rel="noopener noreferrer" className="font-medium text-secondary-600 hover:text-secondary-700 flex items-center gap-1 group">
                                                        Visit URL <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                    </a>
                                                ) : <p className="font-medium text-neutral-500 dark:text-slate-400">—</p>}
                                            </li>

                                            {(loginData?.companyId?.socialLinks?.linkedin || loginData?.companyId?.socialLinks?.twitter) && (
                                                <li className="pt-3 border-t border-neutral-100 dark:border-slate-700">
                                                    <p className="text-[10px] text-neutral-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-2">Social Profiles</p>
                                                    <div className="flex gap-3">
                                                        {loginData.companyId.socialLinks.linkedin && (
                                                            <a href={loginData.companyId.socialLinks.linkedin.startsWith('http') ? loginData.companyId.socialLinks.linkedin : `https://${loginData.companyId.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg transition-colors">
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                                            </a>
                                                        )}
                                                        {loginData.companyId.socialLinks.twitter && (
                                                            <a href={loginData.companyId.socialLinks.twitter.startsWith('http') ? loginData.companyId.socialLinks.twitter : `https://${loginData.companyId.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-slate-300 hover:text-blue-500 rounded-lg transition-colors">
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                                                            </a>
                                                        )}
                                                    </div>
                                                </li>
                                            )}
                                        </>
                                    ) : (
                                        <li>
                                            <p className="text-[10px] text-neutral-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5">Gender</p>
                                            <p className="font-medium text-neutral-700 dark:text-slate-200">{loginData?.gender || "—"}</p>
                                        </li>
                                    )}
                                    <li>
                                        <p className="text-[10px] text-neutral-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5">Account Status</p>
                                        <p className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5 text-sm">
                                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span> Active
                                        </p>
                                    </li>
                                    <li className="pt-3 border-t border-neutral-100 dark:border-slate-700/60">
                                        <p className="text-[10px] text-neutral-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5">Member Since</p>
                                        <p className="font-medium text-neutral-700 dark:text-slate-200">
                                            {loginData?.createdAt ? new Date(loginData.createdAt).toLocaleDateString('en-GB') : "—"}
                                        </p>
                                    </li>
                                </ul>
                            </div>

                            {/* Tech Stack & Benefits (Right Side) */}
                            {isEmployer && (loginData?.companyId?.techStack?.length > 0 || loginData?.companyId?.benefits?.length > 0) && (
                                <div className="card p-6 border border-white/60 dark:border-slate-700/50 shadow-soft backdrop-blur-xl bg-white/70 dark:bg-slate-800/80 space-y-6">
                                    {loginData.companyId.techStack?.length > 0 && (
                                        <div>
                                            <h3 className="font-bold text-neutral-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                                Tech Stack
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {loginData.companyId.techStack.map((tech, i) => (
                                                    <span key={i} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold border border-indigo-100 dark:border-indigo-800">{tech}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {loginData.companyId.benefits?.length > 0 && (
                                        <div>
                                            <h3 className="font-bold text-neutral-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                                Benefits & Perks
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {loginData.companyId.benefits.map((perk, i) => (
                                                    <span key={i} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-100 dark:border-emerald-800">{perk}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Awards (Right Side) */}
                            {isEmployer && loginData?.companyId?.awards?.length > 0 && (
                                <div className="card p-6 border border-white/60 dark:border-slate-700/50 shadow-soft backdrop-blur-xl bg-white/70 dark:bg-slate-800/80">
                                    <h3 className="font-bold text-neutral-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                        Awards
                                    </h3>
                                    <ul className="space-y-2">
                                        {loginData.companyId.awards.map((award, i) => (
                                            <li key={i} className="flex items-start gap-2 bg-neutral-50 dark:bg-slate-800/50 p-3 rounded-xl border border-neutral-100 dark:border-slate-700">
                                                <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"/></svg>
                                                <span className="text-sm font-semibold text-neutral-700 dark:text-slate-300">{award}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            <ShareModal 
                isOpen={isShareOpen} 
                onClose={() => setIsShareOpen(false)} 
                shareUrl={loginData?.role === 'employer' 
                    ? `${window.location.origin}/company/${loginData?.companyId?._id || loginData?._id}` 
                    : `${window.location.origin}/profile/${loginData?._id}`
                } 
                userName={loginData?.userName} 
            />
        </div>
    </div>
);
};

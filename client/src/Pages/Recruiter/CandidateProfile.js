import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from "react-hook-form"
import { toast } from 'react-toastify'
import NetworkModal from '../../components/NetworkModal'
import PostCard from '../../components/Feed/PostCard'
import { formatSalary } from '../../utils/formatters';

// Resume viewer component
const ResumeViewer = ({ applicationId }) => {
    const [resumeUrl, setResumeUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkResume = async () => {
            try {
                const url = `${process.env.REACT_APP_API_URL}/upload/resume-url/${applicationId}`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (response.ok && data.success && data.url) {
                    setResumeUrl(data.url);
                    setIsLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Error checking resume:", err);
            }
            setError('Resume not found');
            setIsLoading(false);
        };

        if (applicationId) {
            checkResume();
        }
    }, [applicationId]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-gray-500">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Checking resume...</span>
            </div>
        );
    }

    if (error || !resumeUrl) {
        return (
            <div className="text-gray-500 text-sm">
                No resume uploaded
            </div>
        );
    }

    const handleDownload = async () => {
        try {
            const response = await fetch(resumeUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Resume_${applicationId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Download failed, falling back to open", e);
            window.open(resumeUrl, '_blank');
        }
    };

    return (
        <div className="flex items-center gap-3 mt-2">
            <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors border border-blue-200 dark:border-blue-800"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
            </a>
            <button
                onClick={handleDownload}
                type="button"
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
            </button>
        </div>
    );
};


export const CandidateProfile = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        
    } = useForm({
        defaultValues: {
            _id: "",
            candidateID: "",
            jobID: "",
            applicationStatus: "",
            applicationForm: [{
                question: "",
                answer: ""
            }],
            candidateFeedback: [{
                question: "",
                answer: ""
            }]
        }
    })

    const { id } = useParams(); // This is the application ID
    const navigate = useNavigate();
    const [application, setApplicaton] = useState();
    const [candidate, setCandidate] = useState();
    const [recruiter, setRecruiter] = useState();
    const [job, setJob] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const [loginData, setLoginData] = useState();
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);

    // Candidate Posts State
    const [userPosts, setUserPosts] = useState([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(false);

    // Match Modal Config format from Profile
    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', type: '', dataList: [] });

    const openNetworkModal = async (type, title) => {
        if (!candidate) return;
        setModalConfig({ isOpen: true, title, type, dataList: [] });
        try {
            const endpoint = `${process.env.REACT_APP_API_URL}/users/user/${candidate._id}/network`;
            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("usertoken")}` }
            });
            const data = await response.json();
            
            if (response.ok && data.success) {
                let list = [];
                if (type === 'followers') list = data.followers || [];
                else if (type === 'following') list = data.following || [];
                else if (type === 'connections') list = data.connectedCompanies || [];
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

    // Get logged in recruiter's data
    useEffect(() => {
        let token = localStorage.getItem("user");
        if (token) {
            const user = JSON.parse(token);
            setLoginData(user);
        }
    }, []);

    // Fetch candidate posts
    useEffect(() => {
        const fetchUserPosts = async () => {
            if (!candidate?._id) return;
            setIsLoadingPosts(true);
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/posts/user/${candidate._id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem("usertoken")}` }
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    setUserPosts(data.posts);
                }
            } catch (error) {
                console.error("Error fetching candidate posts:", error);
            } finally {
                setIsLoadingPosts(false);
            }
        };
        fetchUserPosts();
    }, [candidate]);

    // Fetch application data by ID
    useEffect(() => {
        const fetchApplicationData = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/application/get-application/${id}`);
                const data = await response.json();
                if (data) {
                    setApplicaton(data);
                }
            } catch (error) {
                console.error('Error fetching application:', error);
            }
        };
        fetchApplicationData();
    }, [id]);

    // Fetch candidate data once we have the application
    useEffect(() => {
        if (application && application.candidateID) {
            const fetchCandidateData = async () => {
                try {
                    let candId = application.candidateID;
                    if (typeof candId === 'object' && candId !== null) candId = candId._id;
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/users/user/${candId}`);
                    const data = await response.json();
                    setCandidate(data);
                    if (data.followers) {
                        setFollowersCount(data.followers.length);
                        // The user who is checking the profile is logged in (loginData)
                        // but useEffect might run before loginData is fetched.
                        // We will check and update in a separate effect or just here
                    }
                } catch (error) {
                    console.error('Error fetching candidate:', error);
                }
            };
            fetchCandidateData();
        }
    }, [application]);

    useEffect(() => {
        if (candidate && loginData && candidate.followers) {
            if (candidate.followers.includes(loginData._id)) {
                setIsFollowing(true);
            } else {
                setIsFollowing(false);
            }
        }
    }, [candidate, loginData]);

    // Fetch job data once we have the application
    useEffect(() => {
        if (application && application.jobID) {
            const fetchJobData = async () => {
                try {
                    let appJobId = application.jobID;
                    if (typeof appJobId === 'object' && appJobId !== null) appJobId = appJobId._id;
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/jobs/current-job/${appJobId}`);
                    const data = await response.json();
                    setJob(data);
                } catch (error) {
                    console.error('Error fetching job:', error);
                }
            };
            fetchJobData();
        }
    }, [application]);

    // Fetch recruiter assignment for this job
    useEffect(() => {
        if (application && application.jobID && loginData) {
            const fetchRecruiterData = async () => {
                try {
                    let appJobId = application.jobID;
                    if (typeof appJobId === 'object' && appJobId !== null) appJobId = appJobId._id;
                    
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/recruiter/all-recruiter`);
                    const data = await response.json();
                    // Find recruiter assignment for this job (compare normalized IDs)
                    const recruiterData = data.find(rec => {
                        let recJobId = rec.jobID;
                        if (typeof recJobId === 'object' && recJobId !== null) recJobId = recJobId._id;
                        return recJobId === appJobId;
                    });
                    if (recruiterData) {
                        setRecruiter(recruiterData);
                    }
                    setIsLoading(false);
                } catch (error) {
                    console.error('Error fetching recruiter:', error);
                    setIsLoading(false);
                }
            };
            fetchRecruiterData();
        }
    }, [application, loginData]);
    
    const onSubmit = (data) => {
        if (!application || !candidate || !job) {
            toast.error('Application data not loaded yet');
            return;
        }

        // Build candidate feedback if recruiter has a feedback form
        let candidateFeedback = [];
        if (recruiter && recruiter.feedbackForm && recruiter.feedbackForm.length > 0) {
            candidateFeedback = recruiter.feedbackForm.map((q, index) => ({
                question: q,
                answer: data.candidateFeedback?.[index]?.answer || ''
            }));
        }

        const newData = {
            _id: application._id,
            candidateID: candidate._id,
            jobID: job._id,
            applicationStatus: data.applicationStatus,
            applicationForm: application.applicationForm,
            candidateFeedback: candidateFeedback,
            messageToCandidate: data.messageToCandidate || ''
        };

        fetch(`${process.env.REACT_APP_API_URL}/application/post-application`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(newData),
        })
            .then((res) => res.json())
            .then((result) => {
                if (result.success) {
                    toast.success(`Candidate ${data.applicationStatus === 'shortlist' ? 'shortlisted' : data.applicationStatus === 'rejected' ? 'rejected' : 'status updated'} successfully!`);
                    navigate('/recruiter/review');
                } else {
                    toast.error(result.message || 'Failed to update application');
                }
            })
            .catch((error) => {
                console.error(error);
                toast.error('An error occurred while updating the application');
            });
    }




    const handleFollow = async () => {
        if (!loginData || !candidate) return;
        try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/users/user/${candidate._id}/follow`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentUserId: loginData._id, targetUserId: candidate._id })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setIsFollowing(data.isFollowing);
                setFollowersCount(data.followersCount);
                
                // Real-time synchronization
                if (data.currentUserFollowing) {
                    const updatedUser = { ...loginData, following: data.currentUserFollowing };
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    setLoginData(updatedUser);
                }
            } else {
                toast.error(data.message || "Failed to follow user");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error following candidate");
        }
    };

    return (
        <div className='max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans'>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Application Review</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Review candidate details, application form, and provide your feedback.</p>
                </div>
                <button type="button" onClick={() => navigate('/recruiter/review')} className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    Back to List
                </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                    
                    {/* LEFT COLUMN: Candidate & Application */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {candidate && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">Candidate Profile</h2>
                                <div className="flex flex-col sm:flex-row items-start gap-6">
                                    <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-bold uppercase shrink-0">
                                        {candidate.userName ? candidate.userName.charAt(0) : '?'}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{candidate.userName}</h3>
                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                                                <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                                {candidate.userEmail}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                                                <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                                {candidate.gender || 'Not specified'}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                                                <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                {candidate.location || 'Not specified'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">Attached Resume</h2>
                            <ResumeViewer applicationId={application?._id} />
                        </div>

                        {application && application.applicationForm && application.applicationForm.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">Application Form (R1)</h2>
                                <div className="space-y-4">
                                    {application.applicationForm.map((question, index) => (
                                        <div key={index} className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                            <p className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                                                <span className="text-blue-600 dark:text-blue-400 font-bold mr-2">Q{index + 1}.</span> 
                                                {question.question}
                                            </p>
                                            <div className="flex items-start gap-2 text-sm text-gray-900 dark:text-white">
                                                <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                <span className="font-semibold">{question.answer}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* RIGHT COLUMN: Job Details & Recruiter Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {job && (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">Job Details</h2>
                                <div className="mb-4">
                                    <h3 className="font-bold text-blue-600 dark:text-blue-400 text-lg">{job.jobTitle}</h3>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            {job.employmentType}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300">
                                            {job.location}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center py-2 border-t border-gray-100 dark:border-slate-700">
                                        <span className="text-gray-500 dark:text-slate-400">Salary</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{formatSalary(job)}</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
                                        <span className="text-gray-500 dark:text-slate-400 block mb-1">Description</span>
                                        <p className="text-gray-700 dark:text-slate-300 line-clamp-3 text-xs leading-relaxed">
                                            {job.description ? job.description.replace(/<[^>]*>?/gm, '') : 'No description provided.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">Recruiter Evaluation</h2>
                            
                            {isLoading ? (
                                <div className="flex justify-center py-6">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : recruiter && recruiter.feedbackForm && recruiter.feedbackForm.length > 0 ? (
                                <div className="space-y-4">
                                    {recruiter.feedbackForm.map((question, index) => (
                                        <div key={index} className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-100 dark:border-slate-600">
                                            <label className="block text-sm font-medium text-gray-900 dark:text-slate-200 mb-3 leading-tight">
                                                {index + 1}. {question}
                                            </label>
                                            <div className="flex items-center gap-6 px-2">
                                                <label className="inline-flex items-center cursor-pointer group">
                                                    <input {...register(`candidateFeedback.${index}.answer`)} type="radio" value="Yes" className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                                                    <span className="ml-2 text-sm text-gray-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Yes</span>
                                                </label>
                                                <label className="inline-flex items-center cursor-pointer group">
                                                    <input {...register(`candidateFeedback.${index}.answer`)} type="radio" value="No" className="w-4 h-4 text-red-600 bg-white border-gray-300 focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                                                    <span className="ml-2 text-sm text-gray-700 dark:text-slate-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">No</span>
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">No Evaluation Form</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">You can still make a decision without a formal checklist.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOTTOM ACTION AREA */}
                    <div className="lg:col-span-3 mt-4">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 sm:p-8">
                            <div className="max-w-3xl mx-auto">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">Final Decision</h2>
                                <p className="text-center text-sm text-gray-500 dark:text-slate-400 mb-6">Review the application carefully before submitting your final decision.</p>
                                
                                <div className="mb-8">
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-slate-200 mb-2">Message to Candidate (Optional)</label>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">Provide feedback, interview instructions, or a reason for rejection. This will be emailed to the candidate.</p>
                                    <textarea 
                                        {...register("messageToCandidate")} 
                                        className="w-full p-4 min-h-[120px] bg-gray-50 border border-gray-200 dark:border-slate-600 rounded-xl dark:bg-slate-900/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y" 
                                        placeholder="Type your message here..."
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button 
                                        type="submit" 
                                        onClick={() => setValue("applicationStatus", "rejected")}
                                        className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 font-semibold transition-all dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/40"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        Reject Application
                                    </button>
                                    <button 
                                        type="submit" 
                                        onClick={() => setValue("applicationStatus", "shortlist")}
                                        className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white bg-green-600 hover:bg-green-700 shadow-sm font-semibold transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        Shortlist Candidate
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    )
}

import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { LoginContext } from '../../components/ContextProvider/Context';
import { FiBriefcase, FiMapPin, FiClock, FiCalendar, FiChevronDown, FiChevronUp, FiCheckCircle, FiXCircle, FiLoader, FiFileText, FiExternalLink, FiActivity } from 'react-icons/fi';

export const MyJobs = () => {
    const { loginData } = useContext(LoginContext);
    const [applications, setApplications] = useState([]);
    const [jobs, setJobs] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loginData?._id) return;

        const fetchApplications = async () => {
            try {
                const token = localStorage.getItem('usertoken');
                let data = null;
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_URL}/application/my-applications`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        data = await response.json();
                    } else {
                        console.warn('my-applications failed, falling back to all-application');
                    }
                } catch (err) {
                    console.warn('my-applications request error, falling back to all-application', err);
                }

                if (!Array.isArray(data)) {
                    const responseAll = await fetch(`${process.env.REACT_APP_API_URL}/application/all-application`);
                    data = await responseAll.json();
                }
                const userApplications = data.filter(app => {
                    if (typeof app.candidateID === 'object' && app.candidateID !== null) {
                        return app.candidateID._id === loginData._id;
                    }
                    return app.candidateID === loginData._id;
                }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setApplications(userApplications);
                const jobsData = {};
                for (const app of userApplications) {
                    let jobId = app.jobID;
                    if (typeof jobId === 'object' && jobId !== null) jobId = jobId._id;
                    if (jobId && !jobsData[jobId]) {
                        const jobRes = await fetch(`${process.env.REACT_APP_API_URL}/jobs/current-job/${jobId}`);
                        const jobData = await jobRes.json();
                        jobsData[jobId] = jobData;
                    }
                }
                setJobs(jobsData);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching applications:', error);
                setIsLoading(false);
            }
        };

        fetchApplications();
    }, [loginData]);

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { class: 'badge-accent', label: 'Active' },
            shortlist: { class: 'badge-success', label: 'Shortlisted' },
            rejected: { class: 'badge-error', label: 'Rejected' },
            pending: { class: 'badge-warning', label: 'Pending' },
        };
        const config = statusConfig[status] || { class: 'badge-neutral', label: status };
        return <span className={config.class}>{config.label}</span>;
    };

    const LoadingSkeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                            <div className="skeleton h-6 w-3/4 rounded-lg"></div>
                            <div className="flex gap-4">
                                <div className="skeleton h-4 w-24 rounded"></div>
                                <div className="skeleton h-4 w-32 rounded"></div>
                            </div>
                        </div>
                        <div className="skeleton h-7 w-24 rounded-full"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No Applications Yet</h3>
            <p className="empty-state-text">
                You haven't applied to any jobs yet. Start exploring opportunities and take the first step toward your dream career.
            </p>
            <Link to="/all-posted-jobs" className="btn-primary">
                <FiBriefcase className="mr-2" />
                Browse Jobs
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 py-8 md:py-12">
            <div className="container-custom">
                <div className="page-header mb-8">
                    <h1 className="flex items-center gap-3 text-neutral-900 dark:text-white">
                        <span className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl">
                            <FiBriefcase className="text-secondary-600 dark:text-secondary-400 text-xl" />
                        </span>
                        My Applications
                    </h1>
                    <p className="mt-2 text-neutral-600 dark:text-slate-400">Track the status of all your job applications</p>
                </div>

                {!isLoading && applications.length > 0 && (
                    <div className="flex items-center gap-4 mb-6">
                        <div className="card px-4 py-3 bg-white dark:bg-slate-800/80">
                            <span className="text-sm text-neutral-500 dark:text-slate-400">Total Applications</span>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{applications.length}</p>
                        </div>
                    </div>
                )}

                <div className="card">
                    <div className="p-6 border-b border-neutral-100 dark:border-slate-700 bg-gradient-to-r from-primary to-primary-600">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FiClock className="text-white/80" />
                            Application History
                        </h2>
                    </div>

                    <div className="p-6">
                        {isLoading ? (
                            <LoadingSkeleton />
                        ) : applications.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="space-y-4">
                                {applications.map((application, key) => {
                                    let jobId = application.jobID;
                                    if (typeof jobId === 'object' && jobId !== null) jobId = jobId._id;
                                    const job = jobs[jobId];
                                    return (
                                        <ApplicationCard 
                                            key={key} 
                                            application={application} 
                                            job={job}
                                            getStatusBadge={getStatusBadge}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

function ApplicationCard({ application, job, getStatusBadge }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [resumeUrl, setResumeUrl] = useState(null);
    const [isLoadingResume, setIsLoadingResume] = useState(false);
    const [resumeError, setResumeError] = useState(null);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    useEffect(() => {
        if (!isExpanded || resumeUrl || isLoadingResume) return;

        const fetchResumeUrl = async () => {
            setIsLoadingResume(true);
            try {
                const url = `${process.env.REACT_APP_API_URL}/upload/resume-url/${application._id}`;
                const response = await fetch(url);
                const data = await response.json();
                if (response.ok && data.success && data.url) {
                    setResumeUrl(data.url);
                } else {
                    setResumeError('Resume not found');
                }
            } catch (err) {
                console.error("Error fetching resume URL:", err);
                setResumeError('Failed to load resume');
            } finally {
                setIsLoadingResume(false);
            }
        };

        fetchResumeUrl();
    }, [isExpanded, application._id, resumeUrl, isLoadingResume]);

    const status = application.applicationStatus;
    const stages = [
        {
            id: 'applied',
            title: "Application Submitted Successfully",
            description: "Your application and questionnaire responses have been received by the recruiting team.",
            time: `${formatDate(application.createdAt)} at ${formatTime(application.createdAt)}`,
            status: 'completed',
        },
        {
            id: 'review',
            title: (status === 'shortlist' || status === 'rejected') ? "Profile Review Completed" : "Profile Under Review",
            description: (status === 'shortlist' || status === 'rejected')
                ? "The coordinator has completed reviewing your qualifications."
                : "A hiring coordinator or recruiter is evaluating your resume and profile.",
            time: (status === 'shortlist' || status === 'rejected')
                ? `${formatDate(application.updatedAt)} at ${formatTime(application.updatedAt)}`
                : "In Progress",
            status: (status === 'shortlist' || status === 'rejected') ? 'completed' : 'active',
        },
        {
            id: 'decision',
            title: status === 'shortlist'
                ? "Shortlisted for Interview!"
                : status === 'rejected'
                    ? "Application Declined"
                    : "Final Decision Pending",
            description: status === 'shortlist'
                ? "Congratulations! Your profile meets the qualifications, and you have been shortlisted. The recruitment team will reach out with the next steps."
                : status === 'rejected'
                    ? "We appreciate your interest in NextHire. While your qualifications are impressive, we've decided to move forward with other candidates at this time."
                    : "The recruitment team will notify you of their final decision as soon as the review is complete.",
            time: (status === 'shortlist' || status === 'rejected')
                ? `${formatDate(application.updatedAt)} at ${formatTime(application.updatedAt)}`
                : "Waiting on Review",
            status: status === 'shortlist' ? 'success' : status === 'rejected' ? 'declined' : 'upcoming',
        }
    ];

    return (
        <div className={`card overflow-hidden transition-all duration-500 border border-neutral-100 dark:border-slate-700/50 ${
            isExpanded ? 'shadow-lg shadow-primary/5 bg-white dark:bg-slate-800 ring-1 ring-primary/10 dark:ring-secondary-500/15' : 'hover:shadow-card-hover hover:border-neutral-200 dark:hover:border-slate-600 hover:-translate-y-0.5'
        }`}>
            {/* Card Header Section */}
            <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                            <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl flex-shrink-0">
                                <FiBriefcase className="text-secondary-600 dark:text-secondary-400 text-xl" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
                                    {job?.jobTitle || 'Loading...'}
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-slate-400 mt-0.5 font-medium">
                                    {job?.companyName || 'Company'}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-neutral-500 dark:text-slate-400">
                                    {job?.employmentType && (
                                        <span className="flex items-center gap-1.5 bg-neutral-50 dark:bg-slate-900/50 py-1 px-2.5 rounded-lg border border-neutral-100 dark:border-slate-800">
                                            <FiClock className="text-neutral-400" />
                                            {job.employmentType}
                                        </span>
                                    )}
                                    {job?.location && (
                                        <span className="flex items-center gap-1.5 bg-neutral-50 dark:bg-slate-900/50 py-1 px-2.5 rounded-lg border border-neutral-100 dark:border-slate-800">
                                            <FiMapPin className="text-neutral-400" />
                                            {job.location}
                                        </span>
                                    )}
                                    {application.createdAt && (
                                        <span className="flex items-center gap-1.5 bg-neutral-50 dark:bg-slate-900/50 py-1 px-2.5 rounded-lg border border-neutral-100 dark:border-slate-800">
                                            <FiCalendar className="text-neutral-400" />
                                            Applied {formatDate(application.createdAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Action buttons and Status Badge */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 md:flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-neutral-50 dark:border-slate-700/30">
                        {getStatusBadge(application.applicationStatus)}
                        
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 rounded-lg border transition-all duration-300 ${
                                isExpanded
                                    ? 'bg-secondary-50 dark:bg-secondary-900/30 border-secondary-200 dark:border-secondary-800 text-secondary-600 dark:text-secondary-400'
                                    : 'bg-white dark:bg-slate-800 border-neutral-200 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-300'
                            }`}
                        >
                            <FiActivity className={isExpanded ? 'animate-pulse' : ''} />
                            <span>Track</span>
                            {isExpanded ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                </div>

                {/* Collapsible Panel */}
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-[1200px] opacity-100 mt-6 pt-6 border-t border-neutral-100 dark:border-slate-700/50' : 'max-h-0 opacity-0'
                }`}>
                    {/* Detailed Timeline and Questionnaire Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Vertical Status Timeline */}
                        <div className="lg:col-span-7 space-y-6">
                            <h4 className="text-xs font-bold text-neutral-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                <FiActivity className="text-secondary-500 dark:text-secondary-400 text-sm animate-pulse" />
                                Live Status Timeline
                            </h4>
                            
                            <div className="relative pl-4 pr-2 space-y-2">
                                {stages.map((stage, idx) => {
                                    const isLast = idx === stages.length - 1;
                                    
                                    let icon = null;
                                    let nodeStyle = "";
                                    let lineStyle = "";
                                    
                                    if (stage.status === 'completed') {
                                        icon = <FiCheckCircle className="w-5 h-5 text-white animate-fade-in" />;
                                        nodeStyle = "bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-500/20 text-white shadow-md shadow-emerald-500/10";
                                        lineStyle = "bg-emerald-500";
                                    } else if (stage.status === 'active') {
                                        icon = (
                                            <div className="relative flex items-center justify-center">
                                                <FiLoader className="w-5 h-5 text-white animate-spin absolute" />
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                            </div>
                                        );
                                        nodeStyle = "bg-secondary-500 dark:bg-secondary-400 ring-4 ring-secondary-100 dark:ring-secondary-500/25 text-white shadow-lg shadow-secondary-500/25";
                                        lineStyle = "bg-gradient-to-b from-secondary-500 to-slate-200 dark:to-slate-700";
                                    } else if (stage.status === 'success') {
                                        icon = <FiCheckCircle className="w-5 h-5 text-white" />;
                                        nodeStyle = "bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-500/20 text-white shadow-lg shadow-emerald-500/25";
                                        lineStyle = "bg-emerald-500";
                                    } else if (stage.status === 'declined') {
                                        icon = <FiXCircle className="w-5 h-5 text-white" />;
                                        nodeStyle = "bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-500/20 text-white shadow-lg shadow-rose-500/25";
                                        lineStyle = "bg-rose-500";
                                    } else {
                                        icon = <FiClock className="w-4 h-4 text-slate-400 dark:text-slate-500" />;
                                        nodeStyle = "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500";
                                        lineStyle = "bg-slate-200 dark:bg-slate-700";
                                    }
                                    
                                    return (
                                        <div key={stage.id} className="relative flex items-start gap-5 pb-8 group last:pb-0">
                                            {/* Connector line segment */}
                                            {!isLast && (
                                                <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${lineStyle} transition-all duration-500`} />
                                            )}
                                            
                                            {/* Circle node wrapper with optional glow */}
                                            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full z-10 transition-all duration-500 ${nodeStyle}`}>
                                                {icon}
                                            </div>
                                            
                                            {/* Step information text content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                                    <h5 className="font-bold text-neutral-900 dark:text-white text-sm sm:text-base tracking-tight">
                                                        {stage.title}
                                                    </h5>
                                                    <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full self-start sm:self-center transition-colors ${
                                                        stage.status === 'completed' || stage.status === 'success'
                                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                            : stage.status === 'active'
                                                                ? 'bg-secondary-50 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400 animate-pulse'
                                                                : stage.status === 'declined'
                                                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'
                                                                    : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                        {stage.time}
                                                    </span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-neutral-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xl">
                                                    {stage.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Right Column: Submitted details and Questionnaire */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="bg-neutral-50/50 dark:bg-slate-800/40 backdrop-blur-md rounded-xl p-5 border border-neutral-100 dark:border-slate-700/50 space-y-5 shadow-inner">
                                <h4 className="text-xs font-bold text-neutral-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-neutral-100 dark:border-slate-700/50 pb-3">
                                    <FiFileText className="text-secondary-500 text-sm" />
                                    Submitted Questionnaire
                                </h4>
                                
                                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                                    {application.applicationForm && application.applicationForm.length > 0 ? (
                                        application.applicationForm.map((item, index) => (
                                            <div key={index} className="space-y-1">
                                                <p className="text-xs font-semibold text-neutral-500 dark:text-slate-400">
                                                    Q{index + 1}. {item.question}
                                                </p>
                                                <p className="text-sm font-semibold text-neutral-800 dark:text-slate-200 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-neutral-100 dark:border-slate-700/30">
                                                    {item.answer || 'No answer provided'}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-neutral-400 dark:text-slate-500 italic text-center py-4">
                                            No questionnaire screening questions were required for this position.
                                        </p>
                                    )}
                                </div>
                                
                                {/* Submitted Resume link box */}
                                <div className="pt-4 border-t border-neutral-100 dark:border-slate-700/50 space-y-3">
                                    <h5 className="text-xs font-bold text-neutral-400 dark:text-slate-400 uppercase tracking-widest">
                                        Submitted Resume
                                    </h5>
                                    
                                    {isLoadingResume ? (
                                        <div className="flex items-center gap-2 text-slate-500 text-xs py-2">
                                            <FiLoader className="animate-spin text-primary" />
                                            <span>Locating resume link...</span>
                                        </div>
                                    ) : resumeError || !resumeUrl ? (
                                        <div className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                                            No resume document uploaded for this application.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col sm:flex-row items-center gap-2.5">
                                            <a
                                                href={resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-secondary-50 dark:bg-secondary-900/20 hover:bg-secondary-100 dark:hover:bg-secondary-900/40 text-secondary-600 dark:text-secondary-400 border border-secondary-200 dark:border-secondary-800/80 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm"
                                            >
                                                <FiExternalLink className="w-3.5 h-3.5" />
                                                View PDF
                                            </a>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const response = await fetch(resumeUrl);
                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.style.display = 'none';
                                                        a.href = url;
                                                        a.download = `Resume_${application._id}.pdf`;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        window.URL.revokeObjectURL(url);
                                                    } catch (e) {
                                                        window.open(resumeUrl, '_blank');
                                                    }
                                                }}
                                                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm shadow-secondary/10"
                                            >
                                                <FiFileText className="w-3.5 h-3.5" />
                                                Download PDF
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

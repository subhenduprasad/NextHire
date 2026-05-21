import React, { useEffect, useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { LoginContext } from '../../components/ContextProvider/Context'
import { formatSalary } from '../../utils/formatters';

export const CoordinatorDashboard = () => {
    const { loginData } = useContext(LoginContext);

    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [recruiterAssignments, setRecruiterAssignments] = useState([]);
    const [company, setCompany] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notAssigned, setNotAssigned] = useState(false);
    const [stats, setStats] = useState({
        totalJobs: 0,
        totalApplications: 0,
        pendingAssignments: 0,
        shortlisted: 0
    });

    useEffect(() => {
        if (loginData) {
            fetchDashboardData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginData]);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('usertoken');
            
            // Get company data
            let companyData = null;
            
            // Check if coordinator has companyId directly
            if (loginData.companyId) {
                const companyId = typeof loginData.companyId === 'object' 
                    ? loginData.companyId._id 
                    : loginData.companyId;
                
                const companyRes = await fetch(`${process.env.REACT_APP_API_URL}/company/company/${companyId}`);
                const result = await companyRes.json();
                
                if (result.success && result.data) {
                    companyData = result.data;
                } else if (result._id) {
                    companyData = result;
                }
            }
            
            // If no companyId, try my-company endpoint
            if (!companyData) {
                try {
                    const companyRes = await fetch(`${process.env.REACT_APP_API_URL}/company/my-company`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await companyRes.json();
                    if (result.success && result.data) {
                        companyData = result.data;
                    }
                } catch (err) {
                    console.error('my-company fetch failed:', err);
                }
            }
            
            if (!companyData) {
                setNotAssigned(true);
                setIsLoading(false);
                return;
            }
            
            setCompany(companyData);
            
            // Fetch jobs for this company
            const jobsRes = await fetch(`${process.env.REACT_APP_API_URL}/jobs/by-company/${companyData._id}`);
            const jobsResult = await jobsRes.json();
            const jobsArray = jobsResult.data || jobsResult || [];
            setJobs(Array.isArray(jobsArray) ? jobsArray : []);
            
            // Fetch all applications
            const appsRes = await fetch(`${process.env.REACT_APP_API_URL}/application/all-application`);
            const allApps = await appsRes.json();
            
            // Filter applications for this company's jobs
            const jobIds = jobsArray.map(j => j._id);
            const companyApps = (Array.isArray(allApps) ? allApps : []).filter(app => {
                let appJobId = app.jobID;
                if (typeof appJobId === 'object' && appJobId !== null) appJobId = appJobId._id;
                return jobIds.includes(appJobId);
            });
            setApplications(companyApps);
            
            // Fetch recruiter assignments
            const recruiterRes = await fetch(`${process.env.REACT_APP_API_URL}/recruiter/all-recruiter`);
            const allRecruiters = await recruiterRes.json();
            const companyAssignments = (Array.isArray(allRecruiters) ? allRecruiters : []).filter(rec => {
                let recJobId = rec.jobID;
                if (typeof recJobId === 'object' && recJobId !== null) recJobId = recJobId._id;
                return jobIds.includes(recJobId);
            });
            setRecruiterAssignments(companyAssignments);
            
            // Calculate stats
            const pendingJobs = jobsArray.filter(job => {
                const hasAssignment = companyAssignments.some(rec => {
                    let recJobId = rec.jobID;
                    if (typeof recJobId === 'object' && recJobId !== null) recJobId = recJobId._id;
                    return recJobId === job._id;
                });
                return !hasAssignment;
            });
            
            const shortlistedApps = companyApps.filter(app => app.applicationStatus === 'shortlist');
            
            setStats({
                totalJobs: jobsArray.length,
                totalApplications: companyApps.length,
                pendingAssignments: pendingJobs.length,
                shortlisted: shortlistedApps.length
            });
            
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setNotAssigned(true);
        } finally {
            setIsLoading(false);
        }
    };

    // Check if job has recruiter assigned
    const getJobAssignment = (jobId) => {
        return recruiterAssignments.find(rec => {
            let recJobId = rec.jobID;
            if (typeof recJobId === 'object' && recJobId !== null) recJobId = recJobId._id;
            return recJobId === jobId;
        });
    };

    // Get application count for a job
    const getApplicationCount = (jobId) => {
        return applications.filter(app => {
            let appJobId = app.jobID;
            if (typeof appJobId === 'object' && appJobId !== null) appJobId = appJobId._id;
            return appJobId === jobId;
        }).length;
    };

    // Loading state with skeleton
    if (isLoading) {
        return (
            <div className="container-custom py-8 md:py-12">
                {/* Header skeleton */}
                <div className="page-header mb-10">
                    <div className="skeleton h-9 w-80 mb-3"></div>
                    <div className="skeleton h-5 w-64"></div>
                </div>

                {/* Stats skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-12 w-12 rounded-xl mb-4"></div>
                            <div className="skeleton h-8 w-16 mb-2"></div>
                            <div className="skeleton h-4 w-24"></div>
                        </div>
                    ))}
                </div>

                {/* Actions skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="skeleton h-20 rounded-2xl"></div>
                    ))}
                </div>

                {/* Table skeleton */}
                <div className="card">
                    <div className="skeleton h-16 rounded-none"></div>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-6 border-t border-neutral-100 dark:border-slate-700">
                            <div className="flex justify-between items-center">
                                <div className="flex-1">
                                    <div className="skeleton h-6 w-48 mb-3"></div>
                                    <div className="skeleton h-4 w-72"></div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="skeleton h-8 w-32 rounded-full"></div>
                                    <div className="skeleton h-10 w-20 rounded-xl"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Not assigned to any company
    if (notAssigned) {
        return (
            <div className="container-custom py-12 md:py-20">
                <div className="card max-w-lg mx-auto">
                    <div className="p-8 md:p-12 text-center">
                        <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">Not Assigned to a Company</h2>
                        <p className="text-neutral-600 dark:text-slate-400 mb-8">
                            You haven't been added to any company yet. Please contact an employer to add you to their hiring team.
                        </p>
                        <div className="bg-accent-50 border border-accent-200 rounded-xl p-5">
                            <div className="text-sm text-accent-800 space-y-1">
                                <p><span className="font-semibold">Your Role:</span> HR Coordinator</p>
                                <p><span className="font-semibold">Email:</span> {loginData?.userEmail}</p>
                            </div>
                            <p className="text-xs text-accent-600 mt-3">
                                Share this email with your employer so they can add you to their team.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-custom py-8 md:py-12">
            {/* Header */}
            <div className="page-header mb-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">HR Coordinator Dashboard</h1>
                        <p className="text-neutral-600 dark:text-slate-400 mt-1">
                            {company ? `Managing hiring for ${company.companyName}` : 'Welcome to your dashboard'}
                        </p>
                    </div>
                    {company && (
                        <Link to={`/company/${company._id}`} className="btn-outline btn-sm">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            View Company
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                <div className="card p-6 border-l-4 border-l-accent">
                    <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <div className="stat-value text-neutral-900 dark:text-white">{stats.totalJobs}</div>
                    <div className="stat-label">Total Jobs</div>
                </div>

                <div className="card p-6 border-l-4 border-l-amber-500">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-value text-neutral-900 dark:text-white">{stats.pendingAssignments}</div>
                    <div className="stat-label">Need Recruiter</div>
                </div>

                <div className="card p-6 border-l-4 border-l-secondary">
                    <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div className="stat-value text-neutral-900 dark:text-white">{stats.totalApplications}</div>
                    <div className="stat-label">Applications</div>
                </div>

                <div className="card p-6 border-l-4 border-l-green-500">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-value text-neutral-900 dark:text-white">{stats.shortlisted}</div>
                    <div className="stat-label">Shortlisted</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
                <Link to="/shortlist" className="card-hover group p-5 text-center">
                    <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                        <svg className="w-7 h-7 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary transition-colors">View Candidates</h3>
                    <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">Review shortlisted</p>
                </Link>

                <Link to="/" className="card-hover group p-5 text-center">
                    <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-secondary group-hover:scale-110 transition-all duration-300">
                        <svg className="w-7 h-7 text-secondary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-secondary transition-colors">Home</h3>
                    <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">Back to main page</p>
                </Link>

                <Link to="/shortlist" className="card-hover group p-5 text-center col-span-2 md:col-span-1">
                    <div className="w-14 h-14 bg-accent-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                        <svg className="w-7 h-7 text-accent group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-accent transition-colors">Analytics</h3>
                    <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">View hiring stats</p>
                </Link>
            </div>

            {/* Jobs List */}
            <div className="card">
                <div className="bg-gradient-to-r from-secondary to-secondary-700 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-white">Jobs - Assign Recruiters</h2>
                        <p className="text-sm text-white/80">Assign recruiters to review applications for each job</p>
                    </div>
                    <span className="badge bg-white dark:bg-slate-800/20 text-white border border-white/30">
                        {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'}
                    </span>
                </div>

                {jobs.length === 0 ? (
                    <div className="empty-state py-16">
                        <div className="w-20 h-20 bg-neutral-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="empty-state-title">No Jobs Found</h3>
                        <p className="empty-state-text">No jobs have been posted for your company yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100">
                        {jobs.map((job) => {
                            const assignment = getJobAssignment(job._id);
                            const appCount = getApplicationCount(job._id);
                            
                            return (
                                <div 
                                    key={job._id} 
                                    className="p-5 md:p-6 hover:bg-neutral-50 dark:bg-slate-900 transition-colors"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-white truncate">
                                                        {job.jobTitle}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-neutral-500 dark:text-slate-400">
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            {job.location}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                            </svg>
                                                            {job.employmentType}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {formatSalary(job)}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                            {appCount} applicants
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {assignment ? (
                                                <span className="badge-success">
                                                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Recruiter Assigned
                                                </span>
                                            ) : (
                                                <span className="badge-warning">
                                                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Needs Recruiter
                                                </span>
                                            )}
                                            
                                            <Link to={`/assign-recruiter/${job._id}`}>
                                                <button className="btn-primary btn-sm">
                                                    {assignment ? 'Change' : 'Assign'}
                                                </button>
                                            </Link>
                                            
                                            <Link to={`/current-job/${job._id}`}>
                                                <button className="btn-outline btn-sm">
                                                    View
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Tips Section */}
            <div className="mt-10 card bg-gradient-to-br from-primary via-primary-600 to-accent-700 border-0">
                <div className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800/20 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white">Coordinator Tips</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-800/10 backdrop-blur-sm rounded-xl p-5">
                            <h4 className="font-semibold text-white mb-2">Assign Quickly</h4>
                            <p className="text-sm text-white/80">Assign recruiters promptly to keep the hiring process moving smoothly</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800/10 backdrop-blur-sm rounded-xl p-5">
                            <h4 className="font-semibold text-white mb-2">Create Good Feedback Forms</h4>
                            <p className="text-sm text-white/80">Clear yes/no questions help recruiters evaluate consistently</p>
                        </div>
                        <div className="bg-white dark:bg-slate-800/10 backdrop-blur-sm rounded-xl p-5">
                            <h4 className="font-semibold text-white mb-2">Monitor Progress</h4>
                            <p className="text-sm text-white/80">Check shortlisted candidates regularly to ensure timely follow-ups</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CoordinatorDashboard;

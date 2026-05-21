import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { LoginContext } from '../../components/ContextProvider/Context';

export const RecruiterDashboard = () => {
    const { loginData } = useContext(LoginContext);

    const [isLoading, setIsLoading] = useState(true);
    const [notAssigned, setNotAssigned] = useState(false);
    const [noJobAssigned, setNoJobAssigned] = useState(false);
    const [company, setCompany] = useState(null);

    // Support multiple assigned jobs
    const [assignedJobs, setAssignedJobs] = useState([]);
    const [applications, setApplications] = useState([]);

    // Check if recruiter is assigned to a company
    useEffect(() => {
        if (!loginData) return;
        
        const checkCompanyAssignment = async () => {
            try {
                // Check if recruiter has a company assigned
                if (!loginData.companyId) {
                    setNotAssigned(true);
                    setIsLoading(false);
                    return;
                }

                // Ensure companyId is a string (ObjectId)
                const companyId = typeof loginData.companyId === 'object' ? loginData.companyId._id : loginData.companyId;
                const companyRes = await fetch(`${process.env.REACT_APP_API_URL}/company/company/${companyId}`);
                const companyData = await companyRes.json();
                
                    if (companyData.success && companyData.data) {
                        setCompany(companyData.data);
                        await checkJobAssignment();
                    } else {
                    setNotAssigned(true);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Error checking company:', error);
                setNotAssigned(true);
                setIsLoading(false);
            }
        };

        checkCompanyAssignment();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginData]);

    // Check if recruiter is assigned to a specific job
    const checkJobAssignment = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/recruiter/all-recruiter`);
            const data = await response.json();

            // Find all recruiter assignments for this user
            const assignments = data.filter(rec => rec.recruiterID === loginData._id);
            if (!assignments || assignments.length === 0) {
                setNoJobAssigned(true);
                setIsLoading(false);
                return;
            }

            // Fetch job details for each assignment
            const jobsData = await Promise.all(assignments.map(async (a) => {
                try {
                    const jobRes = await fetch(`${process.env.REACT_APP_API_URL}/jobs/current-job/${a.jobID}`);
                    return await jobRes.json();
                } catch (err) {
                    return null;
                }
            }));

            const validJobs = jobsData.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAssignedJobs(validJobs);

            const jobIds = validJobs.map(j => j._id).filter(Boolean);
            await fetchApplications(jobIds);
        } catch (error) {
            console.error('Error fetching recruiter assignment:', error);
            setNoJobAssigned(true);
            setIsLoading(false);
        }
    };

    // Fetch applications for the assigned job
    const fetchApplications = async (jobIds) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/application/all-application`);
            const data = await response.json();

            // Normalize and filter applications for these jobs
            const jobApplications = data.filter(app => {
                let appJobId = app.jobID;
                if (typeof appJobId === 'object' && appJobId !== null) appJobId = appJobId._id;
                return jobIds.includes(appJobId);
            });

            setApplications(jobApplications);

            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching applications:', error);
            setIsLoading(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="container-custom py-12">
                <div className="page-header mb-8">
                    <div className="skeleton h-8 w-64 mb-2"></div>
                    <div className="skeleton h-4 w-96"></div>
                </div>
                
                <div className="card p-6 mb-8">
                    <div className="skeleton h-6 w-80"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-10 w-16 mx-auto mb-3"></div>
                            <div className="skeleton h-4 w-24 mx-auto"></div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <div className="p-6 border-b border-neutral-100 dark:border-slate-700">
                        <div className="skeleton h-6 w-48"></div>
                    </div>
                    <div className="p-6 space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="skeleton h-10 w-10 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="skeleton h-4 w-40 mb-2"></div>
                                    <div className="skeleton h-3 w-56"></div>
                                </div>
                                <div className="skeleton h-8 w-20 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Not assigned to any company
    if (notAssigned) {
        return (
            <div className="container-custom py-16">
                <div className="max-w-lg mx-auto">
                    <div className="card p-8 md:p-12 text-center">
                        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">Not Assigned to a Company</h2>
                        <p className="text-neutral-600 dark:text-slate-400 mb-8">
                            You haven't been added to any company yet. Please contact an employer to add you to their hiring team.
                        </p>
                        <div className="bg-secondary-50 rounded-xl p-6 text-left">
                            <h4 className="font-semibold text-secondary-800 mb-3">Your Account Details</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-secondary-600">Role</span>
                                    <span className="badge-secondary">Recruiter</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-secondary-600">Email</span>
                                    <span className="font-medium text-secondary-800">{loginData?.userEmail}</span>
                                </div>
                            </div>
                            <p className="text-sm text-secondary-600 mt-4 pt-4 border-t border-secondary-200">
                                Share this email with your employer so they can add you to their team.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Assigned to company but no job assigned yet
    if (noJobAssigned) {
        return (
            <div className="container-custom py-16">
                <div className="max-w-lg mx-auto">
                    <div className="card p-8 md:p-12 text-center">
                        <div className="w-20 h-20 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">No Job Assigned Yet</h2>
                        <p className="text-neutral-600 dark:text-slate-400 mb-8">
                            You're part of <span className="font-semibold text-neutral-800 dark:text-slate-200">{company?.companyName || 'a company'}</span>, but no job has been assigned to you yet.
                        </p>
                        <div className="alert-info">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm">A coordinator will assign you to review applications for a specific job opening.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate stats
    const pendingCount = applications.filter(app => app.applicationStatus === 'pending').length;
    const activeCount = applications.filter(app => app.applicationStatus === 'active').length;

    return (
        <div className="container-custom py-8 md:py-12">
            {/* Page Header */}
            <div className="page-header">
                <h1>Recruiter Dashboard</h1>
                <p>Review and manage candidate applications assigned to you</p>
            </div>

            {/* Company & Assigned Jobs Banner */}
            {company && assignedJobs && assignedJobs.length > 0 && (
                <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-slate-800 dark:to-slate-700/80 border-none mb-8">
                    <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-soft flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600 dark:text-slate-400">Company</p>
                                <p className="font-semibold text-neutral-900 dark:text-white">{company.companyName}</p>
                            </div>
                        </div>
                        <div className="hidden md:block w-px h-12 bg-neutral-200 dark:bg-slate-700"></div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-soft flex items-center justify-center">
                                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm text-neutral-600 dark:text-slate-400">Assigned Job(s)</p>
                                <p className="font-semibold text-neutral-900 dark:text-white">{assignedJobs.map(j => j.jobTitle).join(', ')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="stat-card card-hover">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div className="stat-value">{applications.length}</div>
                    <div className="stat-label">Total Applications</div>
                </div>

                <div className="stat-card card-hover">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-value">{pendingCount}</div>
                    <div className="stat-label">Pending Review</div>
                </div>

                <div className="stat-card card-hover">
                    <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-value">{activeCount}</div>
                    <div className="stat-label">Active Applications</div>
                </div>
            </div>

            {/* Jobs List */}
            <div className="card">
                <div className="bg-gradient-to-r from-primary to-primary-600 px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-white">Jobs Assigned to You</h2>
                        <p className="text-sm text-white/80">Select a job to review its candidates</p>
                    </div>
                    <span className="badge bg-white dark:bg-slate-800/20 text-white border border-white/30">
                        {assignedJobs.length} {assignedJobs.length === 1 ? 'Job' : 'Jobs'}
                    </span>
                </div>

                {assignedJobs.length === 0 ? (
                    <div className="empty-state py-16">
                        <div className="w-20 h-20 bg-neutral-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="empty-state-title">No Jobs Found</h3>
                        <p className="empty-state-text">You haven't been assigned to any jobs yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-slate-700">
                        {assignedJobs.map((job) => {
                            const jobApps = applications.filter(app => {
                                let appJobId = app.jobID;
                                if (typeof appJobId === 'object' && appJobId !== null) appJobId = appJobId._id;
                                return appJobId === job._id;
                            });
                            const activeAndPendingApps = jobApps.filter(app => 
                                app.applicationStatus !== 'shortlist' && app.applicationStatus !== 'rejected'
                            );
                            const pendingCount = jobApps.filter(app => app.applicationStatus === 'pending').length;

                            return (
                                <div key={job._id} className="p-5 md:p-6 hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
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
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                            </svg>
                                                            {activeAndPendingApps.length} active applications
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            {pendingCount > 0 && (
                                                <span className="badge-warning">
                                                    {pendingCount} Pending Review
                                                </span>
                                            )}
                                            <Link to={`/recruiter/job/${job._id}/applications`}>
                                                <button className="btn-primary btn-sm">
                                                    View Candidates
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
        </div>
    );
}

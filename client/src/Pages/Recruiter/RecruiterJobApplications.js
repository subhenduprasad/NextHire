import React, { useEffect, useState, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { LoginContext } from '../../components/ContextProvider/Context';

export const RecruiterJobApplications = () => {
    const { id: jobId } = useParams();
    const navigate = useNavigate();
    const { loginData } = useContext(LoginContext);

    const [isLoading, setIsLoading] = useState(true);
    const [jobDetails, setJobDetails] = useState(null);
    const [applications, setApplications] = useState([]);
    const [candidates, setCandidates] = useState({});
    const [showShortlisted, setShowShortlisted] = useState(false);

    useEffect(() => {
        if (!loginData || !jobId) return;

        const fetchData = async () => {
            try {
                // Fetch job details
                const jobRes = await fetch(`${process.env.REACT_APP_API_URL}/jobs/current-job/${jobId}`);
                const jobData = await jobRes.json();
                setJobDetails(jobData);

                // Fetch applications
                const appRes = await fetch(`${process.env.REACT_APP_API_URL}/application/all-application`);
                const appData = await appRes.json();

                // Filter applications for this specific job
                const jobApplications = appData.filter(app => {
                    let appJobId = app.jobID;
                    if (typeof appJobId === 'object' && appJobId !== null) appJobId = appJobId._id;
                    return appJobId === jobId;
                });

                setApplications(jobApplications);

                // Fetch candidates for ALL applications (active, pending, AND shortlisted)
                const relevantApps = jobApplications.filter(app => 
                    app.applicationStatus !== 'rejected'
                );

                // Fetch candidates details
                const candidateData = {};
                for (const app of relevantApps) {
                    let candId = app.candidateID;
                    if (typeof candId === 'object' && candId !== null) candId = candId._id;
                    if (candId && !candidateData[candId]) {
                        try {
                            const userRes = await fetch(`${process.env.REACT_APP_API_URL}/users/user/${candId}`);
                            const userData = await userRes.json();
                            candidateData[candId] = userData;
                        } catch (err) {
                            console.error('Error fetching candidate:', err);
                        }
                    }
                }
                setCandidates(candidateData);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching data: ", error);
                setIsLoading(false);
            }
        };

        fetchData();
    }, [loginData, jobId]);

    // Shortlisted applications
    const shortlistedApps = applications.filter(app => app.applicationStatus === 'shortlist');

    if (isLoading) {
        return (
            <div className="container-custom py-12">
                <div className="page-header mb-8">
                    <div className="skeleton h-8 w-64 mb-2"></div>
                    <div className="skeleton h-4 w-96"></div>
                </div>
                <div className="card p-6 space-y-4">
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
        );
    }

    return (
        <div className="container-custom py-8 md:py-12">
            <div className="mb-6 flex items-center gap-4">
                <button onClick={() => navigate('/recruiter/review')} className="btn-outline btn-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                </button>
            </div>
            
            <div className="page-header mb-8">
                <h1>Review Candidates</h1>
                <p>Review and manage candidates for <span className="font-semibold text-primary">{jobDetails?.jobTitle}</span></p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                    <div className="stat-value">{applications.filter(app => app.applicationStatus === 'pending').length}</div>
                    <div className="stat-label">Pending Review</div>
                </div>

                <div className="stat-card card-hover">
                    <div className="w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-value">{applications.filter(app => app.applicationStatus === 'active').length}</div>
                    <div className="stat-label">Active Applications</div>
                </div>

                {/* Selected/Shortlisted Card - Clickable */}
                <div 
                    className="stat-card card-hover cursor-pointer" 
                    onClick={() => setShowShortlisted(!showShortlisted)}
                    style={{ 
                        border: showShortlisted ? '2px solid #10b981' : undefined,
                        boxShadow: showShortlisted ? '0 0 0 3px rgba(16, 185, 129, 0.15)' : undefined
                    }}
                    title="Click to view shortlisted candidates"
                    id="shortlisted-stat-card"
                >
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div className="stat-value text-emerald-600 dark:text-emerald-400">{shortlistedApps.length}</div>
                    <div className="stat-label">Selected / Shortlisted</div>
                    <p className="text-xs text-neutral-400 dark:text-slate-500 mt-2">
                        {showShortlisted ? '▲ Click to hide list' : '▼ Click to view list'}
                    </p>
                </div>
            </div>

            {/* Shortlisted Candidates Section - Toggled by clicking the stat card */}
            {showShortlisted && (
                <div className="card mb-8" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-t-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Selected / Shortlisted Candidates</h3>
                                <p className="text-sm text-white/80">Candidates who have been shortlisted for this position</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="badge bg-white/20 text-white border border-white/30">
                                {shortlistedApps.length} {shortlistedApps.length === 1 ? 'Candidate' : 'Candidates'}
                            </span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowShortlisted(false); }}
                                className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                                title="Close"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {shortlistedApps.length === 0 ? (
                        <div className="empty-state py-12">
                            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h4 className="empty-state-title">No Shortlisted Candidates Yet</h4>
                            <p className="empty-state-text">Candidates you shortlist will appear here.</p>
                        </div>
                    ) : (
                        <div className="table-container border-0 rounded-none">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Candidate</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shortlistedApps.map((app, index) => {
                                        let candId = app.candidateID;
                                        if (typeof candId === 'object' && candId !== null) candId = candId._id;
                                        const candidate = candidates[candId];
                                        return (
                                            <tr key={app._id} className="group">
                                                <td className="text-neutral-500 dark:text-slate-400 font-medium">
                                                    {index + 1}
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                                            {candidate?.userName?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <span className="font-medium text-neutral-900 dark:text-white">
                                                            {candidate?.userName || 'Loading...'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="text-neutral-600 dark:text-slate-400">
                                                    {candidate?.userEmail || '-'}
                                                </td>
                                                <td>
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Shortlisted
                                                    </span>
                                                </td>
                                                <td className="text-right">
                                                    <Link to={`/candidate/${app._id}`}>
                                                        <button className="btn-sm" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}>
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            View Profile
                                                        </button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div className="card">
                <div className="p-6 border-b border-neutral-100 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Active Applications</h3>
                            <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">Candidates awaiting your review</p>
                        </div>
                        <span className="badge-primary">{applications.filter(app => app.applicationStatus !== 'shortlist' && app.applicationStatus !== 'rejected').length} candidates</span>
                    </div>

                </div>

                {applications.filter(app => app.applicationStatus !== 'shortlist' && app.applicationStatus !== 'rejected').length === 0 ? (
                    <div className="empty-state">
                        <div className="w-20 h-20 bg-neutral-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h4 className="empty-state-title">No Pending Applications</h4>
                        <p className="empty-state-text">There are no applications awaiting your review for this job at the moment.</p>
                    </div>
                ) : (
                    <div className="table-container border-0 rounded-none">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.filter(app => app.applicationStatus !== 'shortlist' && app.applicationStatus !== 'rejected').map((app, key) => {
                                    let candId = app.candidateID;
                                    if (typeof candId === 'object' && candId !== null) candId = candId._id;
                                    return (
                                        <RenderTableRows 
                                            key={key} 
                                            application={app} 
                                            candidate={candidates[candId]}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

function RenderTableRows({ application, candidate }) {
    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return 'badge-accent';
            case 'pending':
                return 'badge-warning';
            default:
                return 'badge-neutral';
        }
    };

    return (
        <tr className="group">
            <td>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {candidate?.userName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span className="font-medium text-neutral-900 dark:text-white">
                        {candidate?.userName || 'Loading...'}
                    </span>
                </div>
            </td>
            <td className="text-neutral-600 dark:text-slate-400">
                {candidate?.userEmail || '-'}
            </td>
            <td>
                <span className={getStatusBadge(application.applicationStatus)}>
                    {application.applicationStatus}
                </span>
            </td>
            <td className="text-right">
                <Link to={`/candidate/${application._id}`}>
                    <button className="btn-primary btn-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Review
                    </button>
                </Link>
            </td>
        </tr>
    );
}

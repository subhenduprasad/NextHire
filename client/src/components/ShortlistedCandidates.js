import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
import { FiUser, FiBriefcase, FiEye, FiUsers, FiCheckCircle } from 'react-icons/fi';

export const ShortlistedCandidates = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [shortlistData, setShortlistData] = useState([]);

    useEffect(() => {
        const fetchShortlistData = async () => {
            try {
                // Fetch all shortlisted applications
                const appRes = await fetch(`${process.env.REACT_APP_API_URL}/application/all-application`);
                const applications = await appRes.json();
                const shortlistedApps = applications.filter(item => item.applicationStatus === "shortlist");

                if (shortlistedApps.length === 0) {
                    setShortlistData([]);
                    setIsLoading(false);
                    return;
                }

                // Fetch all users
                const usersRes = await fetch(`${process.env.REACT_APP_API_URL}/users/all-users`);
                const users = await usersRes.json();

                // Fetch all jobs
                const jobsRes = await fetch(`${process.env.REACT_APP_API_URL}/jobs/all-jobs`);
                const jobs = await jobsRes.json();

                // Create combined data for each shortlisted application
                const combinedData = shortlistedApps.map(app => {
                    let candId = app.candidateID;
                    if (typeof candId === 'object' && candId !== null) candId = candId._id;
                    let appJobId = app.jobID;
                    if (typeof appJobId === 'object' && appJobId !== null) appJobId = appJobId._id;
                    
                    const candidate = users.find(u => u._id === candId);
                    const job = jobs.find(j => j._id === appJobId);
                    return {
                        application: app,
                        candidate: candidate,
                        job: job
                    };
                }).filter(item => item.candidate && item.job); // Only include valid entries

                setShortlistData(combinedData);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching shortlist data:', error);
                setIsLoading(false);
            }
        };

        fetchShortlistData();
    }, []);

    return (
        <div className='container-custom py-8 md:py-12'>
            {/* Page Header */}
            <div className='page-header mb-8'>
                <div className='flex items-center gap-3 mb-2'>
                    <div className='w-12 h-12 bg-secondary-100 rounded-xl flex items-center justify-center'>
                        <FiCheckCircle className='w-6 h-6 text-secondary-600' />
                    </div>
                    <div>
                        <h1 className='text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white'>Shortlisted Candidates</h1>
                        <p className='text-neutral-500 dark:text-slate-400'>Candidates selected for further consideration</p>
                    </div>
                </div>
            </div>

            {/* Stats Card */}
            {!isLoading && shortlistData.length > 0 && (
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8'>
                    <div className='stat-card card-hover'>
                        <div className='flex items-center justify-center w-12 h-12 bg-secondary-100 rounded-xl mx-auto mb-3'>
                            <FiUsers className='w-6 h-6 text-secondary-600' />
                        </div>
                        <div className='stat-value text-secondary-600'>{shortlistData.length}</div>
                        <div className='stat-label'>Total Shortlisted</div>
                    </div>
                    <div className='stat-card card-hover'>
                        <div className='flex items-center justify-center w-12 h-12 bg-accent-100 rounded-xl mx-auto mb-3'>
                            <FiBriefcase className='w-6 h-6 text-accent-600' />
                        </div>
                        <div className='stat-value text-accent-600'>
                            {new Set(shortlistData.map(item => item.job?._id)).size}
                        </div>
                        <div className='stat-label'>Unique Positions</div>
                    </div>
                    <div className='stat-card card-hover'>
                        <div className='flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mx-auto mb-3'>
                            <FiUser className='w-6 h-6 text-primary-600' />
                        </div>
                        <div className='stat-value text-primary-600'>
                            {new Set(shortlistData.map(item => item.candidate?._id)).size}
                        </div>
                        <div className='stat-label'>Unique Candidates</div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className='card'>
                {/* Header */}
                <div className='bg-gradient-to-r from-secondary-600 to-secondary-700 px-6 py-5'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                            <FiCheckCircle className='w-5 h-5 text-white/80' />
                            <h2 className='text-lg font-semibold text-white'>Candidate List</h2>
                        </div>
                        {!isLoading && (
                            <span className='badge bg-white/20 text-white'>
                                {shortlistData.length} {shortlistData.length === 1 ? 'candidate' : 'candidates'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className='p-0'>
                    {isLoading ? (
                        <LoadingSkeleton />
                    ) : shortlistData.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className='hidden md:block'>
                                <div className='table-container border-0 rounded-none'>
                                    <table className='table'>
                                        <thead>
                                            <tr>
                                                <th>Candidate</th>
                                                <th>Position Applied</th>
                                                <th>Status</th>
                                                <th className='text-right'>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shortlistData.map((item, key) => (
                                                <CandidateTableRow 
                                                    key={key} 
                                                    candidate={item.candidate} 
                                                    job={item.job}
                                                    application={item.application}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile Card View */}
                            <div className='md:hidden divide-y divide-neutral-100'>
                                {shortlistData.map((item, key) => (
                                    <CandidateCard 
                                        key={key} 
                                        candidate={item.candidate} 
                                        job={item.job}
                                        application={item.application}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function CandidateTableRow({ candidate, job, application }) {
    if (!candidate || !job) return null;
    
    return (
        <tr className='hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors'>
            <td>
                <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0'>
                        <span className='text-primary-700 dark:text-primary-400 font-semibold text-sm'>
                            {candidate.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div>
                        <p className='font-medium text-neutral-900 dark:text-white'>{candidate.userName}</p>
                        <p className='text-sm text-neutral-500 dark:text-slate-400'>{candidate.userEmail || 'No email'}</p>
                    </div>
                </div>
            </td>
            <td>
                <div className='flex items-center gap-2'>
                    <FiBriefcase className='w-4 h-4 text-neutral-400 dark:text-slate-500' />
                    <span className='text-neutral-700 dark:text-slate-300'>{job.jobTitle}</span>
                </div>
            </td>
            <td>
                <span className='badge-success'>
                    <FiCheckCircle className='w-3 h-3 mr-1' />
                    Shortlisted
                </span>
            </td>
            <td>
                <div className='flex items-center justify-end gap-2'>
                    <Link 
                        to={`/shortlist/details/${candidate._id}/${job._id}`}
                        className='btn-primary btn-sm gap-2'
                    >
                        <FiEye className='w-4 h-4' />
                        View Details
                    </Link>
                </div>
            </td>
        </tr>
    )
}

function CandidateCard({ candidate, job, application }) {
    if (!candidate || !job) return null;
    
    return (
        <div className='p-4 hover:bg-neutral-50 dark:hover:bg-slate-800 transition-colors'>
            <div className='flex items-start gap-3'>
                <div className='w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0'>
                    <span className='text-primary-700 dark:text-primary-400 font-semibold'>
                        {candidate.userName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                </div>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2 mb-2'>
                        <div>
                            <p className='font-semibold text-neutral-900 dark:text-white'>{candidate.userName}</p>
                            <p className='text-sm text-neutral-500 dark:text-slate-400 truncate'>{candidate.userEmail || 'No email'}</p>
                        </div>
                        <span className='badge-success flex-shrink-0'>
                            <FiCheckCircle className='w-3 h-3 mr-1' />
                            Shortlisted
                        </span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-neutral-600 dark:text-slate-300 mb-3'>
                        <FiBriefcase className='w-4 h-4 text-neutral-400 dark:text-slate-500' />
                        <span>{job.jobTitle}</span>
                    </div>
                    <Link 
                        to={`/shortlist/details/${candidate._id}/${job._id}`}
                        className='btn-primary btn-sm w-full gap-2'
                    >
                        <FiEye className='w-4 h-4' />
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className='p-6 space-y-4'>
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className='flex items-center gap-4 animate-pulse'>
                    <div className='w-12 h-12 bg-neutral-200 rounded-full' />
                    <div className='flex-1 space-y-2'>
                        <div className='h-4 bg-neutral-200 rounded w-1/3' />
                        <div className='h-3 bg-neutral-200 rounded w-1/4' />
                    </div>
                    <div className='hidden md:block'>
                        <div className='h-4 bg-neutral-200 rounded w-32' />
                    </div>
                    <div className='hidden md:block'>
                        <div className='h-6 bg-neutral-200 rounded-full w-24' />
                    </div>
                    <div className='h-9 bg-neutral-200 rounded-lg w-28' />
                </div>
            ))}
        </div>
    )
}

function EmptyState() {
    return (
        <div className='empty-state py-16'>
            <div className='w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6'>
                <FiUsers className='w-10 h-10 text-neutral-400' />
            </div>
            <h3 className='empty-state-title'>No Shortlisted Candidates</h3>
            <p className='empty-state-text'>
                Candidates who are shortlisted for positions will appear here. Start reviewing applications to shortlist potential hires.
            </p>
            <Link to='/all-posted-jobs' className='btn-primary'>
                <FiBriefcase className='w-4 h-4 mr-2' />
                Browse Jobs
            </Link>
        </div>
    )
}

import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { LoginContext } from '../../components/ContextProvider/Context';
import { toast } from 'react-toastify';
import { HiOutlineBriefcase, HiOutlineDocumentText, HiOutlineClock, HiOutlineCheckCircle, HiOutlinePlus, HiOutlineUsers, HiOutlineChartBar, HiOutlineOfficeBuilding, HiOutlineLocationMarker, HiOutlineCurrencyRupee, HiOutlineArrowRight, HiOutlineUser } from 'react-icons/hi';
import { formatSalary } from '../../utils/formatters';

export const EmployerDashboard = () => {
    const { loginData } = useContext(LoginContext);
    
    const [isLoading, setIsLoading] = useState(true);
    const [company, setCompany] = useState(null);
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0,
        pendingReview: 0,
        shortlisted: 0,
        coordinators: 0,
        recruiters: 0
    });
    const [recentJobs, setRecentJobs] = useState([]);
    const [recentDrafts, setRecentDrafts] = useState([]);
    const [recentApplications, setRecentApplications] = useState([]);

    useEffect(() => {
        if (loginData?._id) {
            fetchDashboardData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginData]);

    const fetchDashboardData = async () => {
        try {
            // Fetch company
            const companyRes = await fetch(
                `${process.env.REACT_APP_API_URL}/company/by-employer/${loginData._id}`
            );
            const companyResult = await companyRes.json();
            const companyData = companyResult.data || companyResult;
            
            if (!companyData?._id) {
                setIsLoading(false);
                return;
            }
            
            setCompany(companyData);

            // Fetch jobs
            const jobsRes = await fetch(
                `${process.env.REACT_APP_API_URL}/jobs/by-company/${companyData._id}`
            );
            const jobsResult = await jobsRes.json();
            const jobs = jobsResult.data || jobsResult || [];

            // Fetch all applications
            const appsRes = await fetch(`${process.env.REACT_APP_API_URL}/application/all-application`);
            const allApps = await appsRes.json();
            
            const publishedJobs = jobs.filter(j => j.status !== 'draft');
            const draftJobs = jobs.filter(j => j.status === 'draft');

            // Filter applications for company jobs (handle populated jobID)
            const jobIds = publishedJobs.map(j => j._id);
            const companyApps = allApps.filter(app => {
                let appJobId = app.jobID;
                if (typeof appJobId === 'object' && appJobId !== null) appJobId = appJobId._id;
                return jobIds.includes(appJobId);
            });

            // Calculate stats
            const pendingApps = companyApps.filter(app => 
                app.applicationStatus !== 'shortlist' && app.applicationStatus !== 'rejected'
            );
            const shortlistedApps = companyApps.filter(app => app.applicationStatus === 'shortlist');

            setStats({
                totalJobs: publishedJobs.length,
                activeJobs: publishedJobs.filter(j => j.isActive !== false).length,
                totalApplications: companyApps.length,
                pendingReview: pendingApps.length,
                shortlisted: shortlistedApps.length,
                coordinators: companyData.coordinators?.length || 0,
                recruiters: companyData.recruiters?.length || 0
            });

            // Get recent jobs (last 5)
            setRecentJobs(publishedJobs.slice(0, 5));
            setRecentDrafts(draftJobs.slice(0, 5));

            // Get recent applications with candidate details
            const recentApps = companyApps.slice(0, 5);
            const appsWithDetails = await Promise.all(
                recentApps.map(async (app) => {
                    try {
                        let candId = app.candidateID;
                        if (typeof candId === 'object' && candId !== null) candId = candId._id;
                        let appJobId = app.jobID;
                        if (typeof appJobId === 'object' && appJobId !== null) appJobId = appJobId._id;
                        
                        const userRes = await fetch(`${process.env.REACT_APP_API_URL}/users/user/${candId}`);
                        const user = await userRes.json();
                        const job = jobs.find(j => j._id === appJobId);
                        return { ...app, candidate: user, job };
                    } catch {
                        return { ...app, candidate: null, job: null };
                    }
                })
            );
            setRecentApplications(appsWithDetails.filter(a => a.candidate && a.job));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className='container-custom py-8'>
                {/* Header Skeleton */}
                <div className='page-header mb-8'>
                    <div className='skeleton h-10 w-64 mb-2'></div>
                    <div className='skeleton h-5 w-96'></div>
                </div>

                {/* Stats Skeleton */}
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8'>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className='card p-6'>
                            <div className='skeleton h-12 w-12 rounded-xl mb-4'></div>
                            <div className='skeleton h-8 w-16 mb-2'></div>
                            <div className='skeleton h-4 w-24'></div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions Skeleton */}
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8'>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className='skeleton h-20 rounded-2xl'></div>
                    ))}
                </div>

                {/* Content Skeleton */}
                <div className='grid lg:grid-cols-2 gap-6'>
                    <div className='card p-6'>
                        <div className='skeleton h-6 w-32 mb-6'></div>
                        <div className='space-y-4'>
                            {[1, 2, 3].map(i => (
                                <div key={i} className='skeleton h-20 rounded-xl'></div>
                            ))}
                        </div>
                    </div>
                    <div className='card p-6'>
                        <div className='skeleton h-6 w-40 mb-6'></div>
                        <div className='space-y-4'>
                            {[1, 2, 3].map(i => (
                                <div key={i} className='skeleton h-20 rounded-xl'></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className='container-custom py-12'>
                <div className='card max-w-xl mx-auto'>
                    <div className='empty-state'>
                        <div className='w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6'>
                            <HiOutlineOfficeBuilding className='w-10 h-10 text-primary' />
                        </div>
                        <h2 className='empty-state-title'>No Company Found</h2>
                        <p className='empty-state-text'>
                            Create your company profile to start posting jobs and building your team.
                        </p>
                        <Link to='/create-company' className='btn-primary'>
                            <HiOutlinePlus className='w-5 h-5 mr-2' />
                            Create Company
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='container-custom py-8'>
            {/* Header */}
            <div className='page-header mb-8'>
                <h1 className='text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white'>Welcome back!</h1>
                <p className='text-neutral-600 dark:text-slate-400 mt-1'>
                    Here's what's happening at <span className='font-semibold text-primary'>{company.companyName}</span>
                </p>
            </div>

            {/* Stats Cards */}
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8'>
                <StatCard 
                    icon={HiOutlineBriefcase}
                    title="Total Jobs" 
                    value={stats.totalJobs} 
                    iconBg="bg-accent-100"
                    iconColor="text-accent-600"
                    link="/all-jobs"
                />
                <StatCard 
                    icon={HiOutlineDocumentText}
                    title="Applications" 
                    value={stats.totalApplications} 
                    iconBg="bg-secondary-100"
                    iconColor="text-secondary-600"
                    link="/shortlist"
                />
                <StatCard 
                    icon={HiOutlineClock}
                    title="Pending Review" 
                    value={stats.pendingReview} 
                    iconBg="bg-amber-100"
                    iconColor="text-amber-600"
                />
                <StatCard 
                    icon={HiOutlineCheckCircle}
                    title="Shortlisted" 
                    value={stats.shortlisted} 
                    iconBg="bg-green-100"
                    iconColor="text-green-600"
                    link="/shortlist"
                />
            </div>

            {/* Quick Actions */}
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8'>
                <QuickAction 
                    icon={HiOutlinePlus}
                    title="Post New Job" 
                    link="/post-job" 
                    variant="primary"
                />
                <QuickAction 
                    icon={HiOutlineUsers}
                    title="Manage Team" 
                    link="/team" 
                    variant="secondary"
                />
                <QuickAction 
                    icon={HiOutlineChartBar}
                    title="View All Jobs" 
                    link="/all-jobs" 
                    variant="dark"
                />
                <QuickAction 
                    icon={HiOutlineOfficeBuilding}
                    title="Company Profile" 
                    link={`/company/${company._id}`} 
                    variant="accent"
                />
            </div>

            {/* Team Overview */}
            <div className='card p-6 md:p-8 mb-8'>
                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
                    <h2 className='text-xl font-bold text-neutral-900 dark:text-white'>Team Overview</h2>
                    <Link to='/team' className='text-secondary-600 hover:text-secondary-700 text-sm font-medium flex items-center gap-1 group'>
                        Manage Team 
                        <HiOutlineArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                    </Link>
                </div>
                <div className='grid grid-cols-2 gap-4 md:gap-6'>
                    <div className='bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl p-6 border border-primary-100'>
                        <div className='flex items-center gap-4'>
                            <div className='w-12 h-12 bg-primary-200/50 rounded-xl flex items-center justify-center'>
                                <HiOutlineUsers className='w-6 h-6 text-primary-700' />
                            </div>
                            <div>
                                <div className='text-3xl font-bold text-primary-900'>{stats.coordinators}</div>
                                <div className='text-primary-700 text-sm font-medium'>Coordinators</div>
                            </div>
                        </div>
                    </div>
                    <div className='bg-gradient-to-br from-secondary-50 to-secondary-100/50 rounded-xl p-6 border border-secondary-100'>
                        <div className='flex items-center gap-4'>
                            <div className='w-12 h-12 bg-secondary-200/50 rounded-xl flex items-center justify-center'>
                                <HiOutlineUser className='w-6 h-6 text-secondary-700' />
                            </div>
                            <div>
                                <div className='text-3xl font-bold text-secondary-900'>{stats.recruiters}</div>
                                <div className='text-secondary-700 text-sm font-medium'>Recruiters</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className='grid lg:grid-cols-2 gap-6 md:gap-8'>
                {/* Recent Jobs */}
                <div className='card p-6 md:p-8'>
                    <div className='flex items-center justify-between mb-6'>
                        <h2 className='text-xl font-bold text-neutral-900 dark:text-white'>Recent Jobs</h2>
                        <Link to='/all-jobs' className='text-secondary-600 hover:text-secondary-700 text-sm font-medium flex items-center gap-1 group'>
                            View All 
                            <HiOutlineArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                        </Link>
                    </div>
                    {recentJobs.length === 0 ? (
                        <div className='empty-state py-8'>
                            <div className='w-16 h-16 bg-neutral-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                                <HiOutlineBriefcase className='w-8 h-8 text-neutral-400' />
                            </div>
                            <p className='empty-state-title text-base'>No jobs posted yet</p>
                            <p className='empty-state-text text-sm'>Create your first job posting to attract candidates</p>
                            <Link to='/post-job' className='btn-secondary btn-sm'>
                                <HiOutlinePlus className='w-4 h-4 mr-1' />
                                Post a Job
                            </Link>
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {recentJobs.map(job => (
                                <Link 
                                    key={job._id} 
                                    to={`/current-job/${job._id}`}
                                    className='block p-4 bg-neutral-50 dark:bg-slate-900 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-xl border border-neutral-100 dark:border-slate-700 hover:border-neutral-200 dark:border-slate-600 transition-all group'
                                >
                                    <div className='flex items-start justify-between gap-3'>
                                        <div className='flex-1 min-w-0'>
                                            <h3 className='font-semibold text-neutral-900 dark:text-white group-hover:text-primary transition-colors truncate'>
                                                {job.jobTitle}
                                            </h3>
                                            <div className='flex flex-wrap items-center gap-3 mt-2 text-sm text-neutral-500 dark:text-slate-400'>
                                                <span className='flex items-center gap-1'>
                                                    <HiOutlineLocationMarker className='w-4 h-4' />
                                                    {job.location}
                                                </span>
                                                <span className='flex items-center gap-1'>
                                                    <HiOutlineCurrencyRupee className='w-4 h-4' />
                                                    {formatSalary(job)}
                                                </span>
                                            </div>
                                        </div>
                                        <HiOutlineArrowRight className='w-5 h-5 text-neutral-400 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1' />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Applications */}
                <div className='card p-6 md:p-8'>
                    <div className='flex items-center justify-between mb-6'>
                        <h2 className='text-xl font-bold text-neutral-900 dark:text-white'>Recent Applications</h2>
                        <Link to='/shortlist' className='text-secondary-600 hover:text-secondary-700 text-sm font-medium flex items-center gap-1 group'>
                            View All 
                            <HiOutlineArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                        </Link>
                    </div>
                    {recentApplications.length === 0 ? (
                        <div className='empty-state py-8'>
                            <div className='w-16 h-16 bg-neutral-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                                <HiOutlineDocumentText className='w-8 h-8 text-neutral-400' />
                            </div>
                            <p className='empty-state-title text-base'>No applications yet</p>
                            <p className='empty-state-text text-sm'>Applications will appear here once candidates apply</p>
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {recentApplications.map(app => (
                                <div key={app._id} className='p-4 bg-neutral-50 dark:bg-slate-900 rounded-xl border border-neutral-100 dark:border-slate-700'>
                                    <div className='flex items-start justify-between gap-3'>
                                        <div className='flex items-center gap-3'>
                                            <div className='w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0'>
                                                <span className='text-primary-700 font-semibold text-sm'>
                                                    {app.candidate?.userName?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div className='min-w-0'>
                                                <h3 className='font-semibold text-neutral-900 dark:text-white truncate'>
                                                    {app.candidate?.userName || 'Unknown'}
                                                </h3>
                                                <p className='text-sm text-neutral-500 dark:text-slate-400 truncate'>
                                                    Applied for: {app.job?.jobTitle}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`flex-shrink-0 ${
                                            app.applicationStatus === 'shortlist' 
                                                ? 'badge-success'
                                                : app.applicationStatus === 'rejected'
                                                    ? 'badge-error'
                                                    : 'badge-warning'
                                        }`}>
                                            {app.applicationStatus === 'shortlist' ? 'Shortlisted' 
                                                : app.applicationStatus === 'rejected' ? 'Rejected' 
                                                : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Drafts */}
            {recentDrafts.length > 0 && (
                <div className='mt-6 md:mt-8 card p-6 md:p-8'>
                    <div className='flex items-center justify-between mb-6'>
                        <h2 className='text-xl font-bold text-neutral-900 dark:text-white'>Recent Drafts</h2>
                        <Link to='/all-jobs?tab=drafts' className='text-secondary-600 hover:text-secondary-700 text-sm font-medium flex items-center gap-1 group'>
                            View All 
                            <HiOutlineArrowRight className='w-4 h-4 group-hover:translate-x-1 transition-transform' />
                        </Link>
                    </div>
                    <div className='grid md:grid-cols-2 gap-4'>
                        {recentDrafts.map(draft => (
                            <div key={draft._id} className='p-4 bg-neutral-50 dark:bg-slate-900 rounded-xl border border-neutral-100 dark:border-slate-700 flex items-center justify-between'>
                                <div className='min-w-0 flex-1 pr-4'>
                                    <h3 className='font-semibold text-neutral-900 dark:text-white truncate mb-1'>
                                        {draft.jobTitle || 'Untitled Draft'}
                                    </h3>
                                    <p className='text-xs text-neutral-500 dark:text-slate-400 truncate'>
                                        Last updated: {new Date(draft.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <Link 
                                    to={`/post-job?edit=${draft._id}`}
                                    className='px-4 py-2 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-600 rounded-lg text-sm font-medium text-neutral-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors flex-shrink-0'
                                >
                                    Edit Draft
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, iconBg, iconColor, link }) => {
    const content = (
        <div className='card-hover p-5 md:p-6 group cursor-pointer'>
            <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className='stat-value'>{value}</div>
            <div className='stat-label'>{title}</div>
        </div>
    );

    return link ? <Link to={link}>{content}</Link> : content;
};

// Quick Action Component
const QuickAction = ({ icon: Icon, title, link, variant }) => {
    const variants = {
        primary: 'bg-primary hover:bg-primary-600 text-white',
        secondary: 'bg-secondary hover:bg-secondary-700 text-white',
        dark: 'bg-neutral-800 hover:bg-neutral-900 text-white',
        accent: 'bg-accent-600 hover:bg-accent-700 text-white'
    };

    return (
        <Link 
            to={link} 
            className={`${variants[variant]} rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-center shadow-soft hover:shadow-medium transition-all hover:-translate-y-0.5 group`}
        >
            <Icon className='w-6 h-6 mb-2 group-hover:scale-110 transition-transform' />
            <span className='font-semibold text-sm'>{title}</span>
        </Link>
    );
};

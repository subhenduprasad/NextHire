import React from 'react'
import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiUser, FiMail, FiMapPin, FiBriefcase, FiDollarSign, FiFileText, FiArrowLeft, FiMessageSquare } from 'react-icons/fi'
import { formatSalary } from '../utils/formatters';

export const ShortlistedDetails = () => {
    const { candidate_id, job_id } = useParams();
    const [candidate, setCandidate] = useState(null);
    const [application, setApplication] = useState(null);
    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, jobRes, appRes] = await Promise.all([
                    fetch(`${process.env.REACT_APP_API_URL}/users/user/${candidate_id}`),
                    fetch(`${process.env.REACT_APP_API_URL}/jobs/current-job/${job_id}`),
                    fetch(`${process.env.REACT_APP_API_URL}/application/all-application`)
                ]);

                const userData = await userRes.json();
                const jobData = await jobRes.json();
                const allApps = await appRes.json();

                setCandidate(userData);
                setJob(jobData);

                const filteredApp = allApps.find(item => {
                    let candId = item.candidateID;
                    if (typeof candId === 'object' && candId !== null) candId = candId._id;
                    let appJobId = item.jobID;
                    if (typeof appJobId === 'object' && appJobId !== null) appJobId = appJobId._id;
                    return candId === candidate_id && appJobId === job_id;
                });
                setApplication(filteredApp);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [candidate_id, job_id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 py-8">
                <div className="container-custom max-w-4xl">
                    <div className="card p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-20 h-20 rounded-full bg-neutral-200 animate-pulse" />
                            <div className="flex-1 space-y-3">
                                <div className="h-6 bg-neutral-200 rounded animate-pulse w-1/3" />
                                <div className="h-4 bg-neutral-200 rounded animate-pulse w-1/4" />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-4 bg-neutral-200 rounded animate-pulse" />
                                ))}
                            </div>
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-4 bg-neutral-200 rounded animate-pulse" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!candidate || !job) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 py-8">
                <div className="container-custom">
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3 className="empty-state-title">Details Not Found</h3>
                        <p className="empty-state-text">
                            The candidate or job details could not be loaded.
                        </p>
                        <Link to="/shortlist" className="btn-primary">
                            <FiArrowLeft className="mr-2" />
                            Back to Shortlist
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 py-8 md:py-12">
            <div className="container-custom max-w-4xl">
                {/* Back Button */}
                <Link 
                    to="/shortlist" 
                    className="inline-flex items-center gap-2 text-neutral-600 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <FiArrowLeft className="w-4 h-4" />
                    Back to Shortlisted Candidates
                </Link>

                {/* Header Card */}
                <div className="card mb-6">
                    <div className="bg-gradient-to-r from-secondary-600 to-secondary-700 p-6 md:p-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg">
                                <span className="text-3xl md:text-4xl font-bold text-secondary-600">
                                    {candidate.userName?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="flex-1 text-white">
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                                    {candidate.userName}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-white/90">
                                    <span className="flex items-center gap-2">
                                        <FiMail className="w-4 h-4" />
                                        {candidate.userEmail}
                                    </span>
                                    {candidate.address && (
                                        <span className="flex items-center gap-2">
                                            <FiMapPin className="w-4 h-4" />
                                            {candidate.address}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-3">
                                    <span className="badge bg-white/20 text-white">
                                        Shortlisted for {job.jobTitle}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Candidate Details */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                            <FiUser className="w-5 h-5 text-secondary-600" />
                            Candidate Information
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-slate-800 rounded-xl border border-neutral-100 dark:border-slate-700">
                                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                    <FiUser className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Full Name</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{candidate.userName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-slate-800 rounded-xl border border-neutral-100 dark:border-slate-700">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                    <FiMail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Email Address</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{candidate.userEmail}</p>
                                </div>
                            </div>
                            {candidate.gender && (
                                <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-slate-800 rounded-xl border border-neutral-100 dark:border-slate-700">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                                        <FiUser className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500 dark:text-slate-400">Gender</p>
                                        <p className="font-medium text-neutral-900 dark:text-white">{candidate.gender}</p>
                                    </div>
                                </div>
                            )}
                            {candidate.address && (
                                <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-slate-800 rounded-xl border border-neutral-100 dark:border-slate-700">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                        <FiMapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500 dark:text-slate-400">Address</p>
                                        <p className="font-medium text-neutral-900 dark:text-white">{candidate.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Job Details */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                            <FiBriefcase className="w-5 h-5 text-secondary-600" />
                            Job Details
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-slate-800 rounded-xl border border-neutral-100 dark:border-slate-700">
                                <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center flex-shrink-0">
                                    <FiBriefcase className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Job Title</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{job.jobTitle}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-slate-800 rounded-xl border border-neutral-100 dark:border-slate-700">
                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <FiMapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Location</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{job.location}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-slate-800 rounded-xl border border-neutral-100 dark:border-slate-700">
                                <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                                    <FiFileText className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-neutral-500 dark:text-slate-400">Employment Type</p>
                                    <p className="font-medium text-neutral-900 dark:text-white">{job.employmentType}</p>
                                </div>
                            </div>
                            {(job.salary || job.salaryMin) && (
                                <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-slate-800 rounded-xl border border-neutral-100 dark:border-slate-700">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                        <FiDollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-neutral-500 dark:text-slate-400">Salary</p>
                                        <p className="font-medium text-neutral-900 dark:text-white">{formatSalary(job)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Job Description */}
                {job.description && (
                    <div className="card p-6 mt-6">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                            <FiFileText className="w-5 h-5 text-secondary-600" />
                            Job Description
                        </h2>
                        <div 
                            className="text-neutral-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap rich-text-content"
                            dangerouslySetInnerHTML={{ __html: job.description }}
                        />
                    </div>
                )}

                {/* Candidate Feedback */}
                {application?.candidateFeedback && application.candidateFeedback.length > 0 && (
                    <div className="card p-6 mt-6">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                            <FiMessageSquare className="w-5 h-5 text-secondary-600" />
                            Screening Responses
                        </h2>
                        <div className="space-y-4">
                            {application.candidateFeedback.map((feedback, index) => (
                                <div key={index} className="p-4 bg-neutral-50 dark:bg-slate-800 rounded-xl border border-neutral-100 dark:border-slate-700">
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 w-7 h-7 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400 rounded-lg flex items-center justify-center text-sm font-semibold">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1">
                                            <p className="font-medium text-neutral-800 dark:text-white mb-2">
                                                {feedback.question}
                                            </p>
                                            <p className="text-neutral-600 dark:text-slate-300">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                                                    feedback.answer?.toLowerCase() === 'yes' 
                                                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' 
                                                        : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                                                }`}>
                                                    {feedback.answer}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Application Form Responses */}
                {application?.applicationForm && application.applicationForm.length > 0 && (
                    <div className="card p-6 mt-6">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                            <FiFileText className="w-5 h-5 text-secondary-600" />
                            Application Responses
                        </h2>
                        <div className="space-y-4">
                            {application.applicationForm.map((item, index) => (
                                item.question && (
                                    <div key={index} className="p-4 bg-neutral-50 dark:bg-slate-800 rounded-xl border border-neutral-100 dark:border-slate-700">
                                        <div className="flex items-start gap-3">
                                            <span className="flex-shrink-0 w-7 h-7 bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 rounded-lg flex items-center justify-center text-sm font-semibold">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1">
                                                <p className="font-medium text-neutral-800 dark:text-white mb-2">
                                                    {item.question}
                                                </p>
                                                <p className="text-neutral-600 dark:text-slate-300">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                                                        item.answer?.toLowerCase() === 'yes' 
                                                            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' 
                                                            : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                                                    }`}>
                                                        {item.answer}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <Link to="/shortlist" className="btn-outline flex-1">
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Back to Shortlist
                    </Link>
                    <Link 
                        to={`/current-job/${job._id}`} 
                        className="btn-secondary flex-1"
                    >
                        View Job Details
                    </Link>
                </div>
            </div>
        </div>
    );
}

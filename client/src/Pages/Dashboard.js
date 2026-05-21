import React, { useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LoginContext } from '../components/ContextProvider/Context';

export const Dashboard = () => {
    const { loginData, isLoading } = useContext(LoginContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && loginData) {
            const role = loginData.role;
            
            switch (role) {
                case 'employer':
                    navigate('/employer/dashboard', { replace: true });
                    break;
                case 'recruiter':
                    navigate('/recruiter/review', { replace: true });
                    break;
                case 'coordinator':
                    navigate('/coordinator/review', { replace: true });
                    break;
                case 'candidate':
                    navigate('/candidate/dashboard', { replace: true });
                    break;
                default:
                    break;
            }
        }
    }, [loginData, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-secondary border-t-transparent"></div>
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-800 dark:text-white mb-2">Loading Dashboard</h2>
                    <p className="text-neutral-500 dark:text-slate-400">Please wait while we prepare your experience...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 py-12">
            <div className="container-custom max-w-2xl">
                <div className="card p-8 md:p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-secondary to-secondary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    </div>
                    
                    <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-3">
                        Welcome{loginData?.userName ? `, ${loginData.userName}` : ''}!
                    </h1>
                    
                    <p className="text-neutral-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                        You're being redirected to your personalized dashboard. If you're not redirected automatically, please select an option below.
                    </p>

                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-secondary border-t-transparent"></div>
                            <span className="text-sm text-neutral-500 dark:text-slate-400">Redirecting...</span>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <Link to="/" className="btn-outline">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Go to Home
                        </Link>
                        <Link to="/all-posted-jobs" className="btn-secondary">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Browse Jobs
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

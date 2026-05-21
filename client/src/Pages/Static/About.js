import React from 'react';
import { Link } from 'react-router-dom';

export const About = () => {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 pb-16 pt-24 font-inter">
            <div className="container-custom">
                {/* Hero Section */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
                        Bridging the gap between <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-400 to-primary-500">Talent and Opportunity</span>
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-300">
                        NextHire is a modern career platform designed to empower professionals and help businesses build exceptional teams.
                    </p>
                </div>

                {/* Content Section */}
                <div className="grid md:grid-cols-2 gap-12 items-center bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl shadow-sm border border-neutral-100 dark:border-slate-700">
                    <div>
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">Our Mission</h2>
                        <p className="text-neutral-600 dark:text-neutral-300 mb-6 leading-relaxed">
                            We believe that finding the right job or the perfect candidate shouldn't be a tedious process. Our mission is to create a seamless, transparent, and efficient ecosystem where job seekers can seamlessly discover their dream roles and employers can quickly identify top-tier talent without the noise.
                        </p>
                        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4 mt-8">What We Offer</h2>
                        <ul className="space-y-4 text-neutral-600 dark:text-neutral-300">
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-secondary-50 text-secondary flex items-center justify-center shrink-0">✓</div>
                                Real-time application tracking and direct communication.
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-secondary-50 text-secondary flex items-center justify-center shrink-0">✓</div>
                                A beautiful, distraction-free interface for focused outcomes.
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-secondary-50 text-secondary flex items-center justify-center shrink-0">✓</div>
                                Robust analytics and dashboards for recruiters.
                            </li>
                        </ul>
                    </div>
                    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-slate-700 dark:to-slate-600 h-96 rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                        <div className="text-center p-8">
                            <h3 className="text-2xl font-bold text-primary dark:text-white mb-2">Join NextHire Today</h3>
                            <p className="text-primary-600 dark:text-neutral-300 mb-6">Take the next step in your career journey.</p>
                            <Link to="/signup" className="btn-primary">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

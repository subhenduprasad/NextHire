import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const Resources = () => {
    const [activeTab, setActiveTab] = useState('job-seekers');

    const jobSeekerResources = [
        { title: 'How to Write a Standout Resume in 2026', category: 'Guide', readTime: '5 min' },
        { title: 'Top 10 Interview Questions for Tech Roles', category: 'Articles', readTime: '8 min' },
        { title: 'Negotiating Your Salary Like a Pro', category: 'Tips & Tricks', readTime: '6 min' },
    ];

    const employerResources = [
        { title: 'Building an Employer Brand Candidates Love', category: 'Strategy', readTime: '10 min' },
        { title: 'How to Reduce Time-to-Hire significantly', category: 'Guide', readTime: '7 min' },
        { title: 'Diversity & Inclusion in Modern Tech Recruiting', category: 'Articles', readTime: '12 min' },
    ];

    const currentResources = activeTab === 'job-seekers' ? jobSeekerResources : employerResources;

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 pb-16 pt-24 font-inter">
            <div className="container-custom">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
                        Resource Center
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-300">
                        Insights, guides, and best practices to help you succeed on NextHire.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex bg-neutral-200 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('job-seekers')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === 'job-seekers'
                                    ? 'bg-white dark:bg-slate-700 text-neutral-900 dark:text-white shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                        >
                            For Job Seekers
                        </button>
                        <button
                            onClick={() => setActiveTab('employers')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                activeTab === 'employers'
                                    ? 'bg-white dark:bg-slate-700 text-neutral-900 dark:text-white shadow-sm'
                                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                        >
                            For Employers
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {currentResources.map((resource, index) => (
                        <div key={index} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-neutral-100 dark:border-slate-700 hover:shadow-md transition-shadow group flex flex-col cursor-pointer">
                            <div className="h-48 bg-neutral-200 dark:bg-slate-700 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-secondary-400 to-primary-500 opacity-80 group-hover:scale-105 transition-transform duration-500"></div>
                            </div>
                            <div className="p-6 flex flex-col flex-1">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold text-secondary-500 uppercase tracking-wider">{resource.category}</span>
                                    <span className="text-xs text-neutral-400">{resource.readTime} read</span>
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4 group-hover:text-secondary-500 transition-colors">
                                    {resource.title}
                                </h3>
                                <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-slate-700 flex items-center text-sm font-medium text-neutral-500 dark:text-neutral-400 group-hover:text-secondary-500 transition-colors">
                                    Read Article <span className="ml-2">→</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { Link } from 'react-router-dom';

export const Pricing = () => {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 pb-16 pt-24 font-inter">
            <div className="container-custom">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-300">
                        No hidden fees. No surprise charges. Choose the plan that best fits your hiring needs.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Free Tier */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Starter</h3>
                        <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">Perfect for small startups hiring their first employees.</p>
                        <div className="mb-6 flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">$0</span>
                            <span className="text-neutral-500 dark:text-neutral-400">/ forever</span>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
                                <span className="text-green-500">✓</span> 1 Active Job Posting
                            </li>
                            <li className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
                                <span className="text-green-500">✓</span> Basic Candidate Filtering
                            </li>
                            <li className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
                                <span className="text-green-500">✓</span> Standard Support
                            </li>
                        </ul>
                        <Link to="/signup" className="w-full inline-block text-center py-3 px-4 rounded-xl font-semibold border-2 border-neutral-200 dark:border-slate-600 text-neutral-700 dark:text-white hover:border-secondary hover:text-secondary dark:hover:border-secondary dark:hover:text-secondary transition-all">
                            Get Started
                        </Link>
                    </div>

                    {/* Pro Tier (Highlighted) */}
                    <div className="bg-gradient-to-b from-primary-600 to-secondary-600 p-8 rounded-3xl shadow-lg border border-primary-500 transform md:-translate-y-4 relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wide">
                            Most Popular
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
                        <p className="text-primary-100 mb-6 text-sm">For growing companies with consistent hiring needs.</p>
                        <div className="mb-6 flex items-baseline gap-2 text-white">
                            <span className="text-4xl font-extrabold">$49</span>
                            <span className="text-primary-100">/ month</span>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-white">
                                <span className="text-amber-400">✓</span> Up to 10 Active Job Postings
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <span className="text-amber-400">✓</span> Advanced Candidate Matching
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <span className="text-amber-400">✓</span> Add up to 5 Recruiters
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <span className="text-amber-400">✓</span> Priority Support
                            </li>
                        </ul>
                        <Link to="/signup" className="w-full inline-block text-center py-3 px-4 rounded-xl font-semibold bg-white text-primary-600 hover:bg-neutral-50 transition-colors">
                            Start Free Trial
                        </Link>
                    </div>

                    {/* Enterprise Tier */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-neutral-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Enterprise</h3>
                        <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">Custom solutions for large scale organizations.</p>
                        <div className="mb-6 flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold text-neutral-900 dark:text-white">Custom</span>
                        </div>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
                                <span className="text-green-500">✓</span> Unlimited Job Postings
                            </li>
                            <li className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
                                <span className="text-green-500">✓</span> Custom Workflows & API
                            </li>
                            <li className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
                                <span className="text-green-500">✓</span> Unlimited Team Members
                            </li>
                            <li className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
                                <span className="text-green-500">✓</span> Dedicated Account Manager
                            </li>
                        </ul>
                        <Link to="/contact" className="w-full inline-block text-center py-3 px-4 rounded-xl font-semibold border-2 border-neutral-200 dark:border-slate-600 text-neutral-700 dark:text-white hover:border-secondary hover:text-secondary dark:hover:border-secondary dark:hover:text-secondary transition-all">
                            Contact Sales
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

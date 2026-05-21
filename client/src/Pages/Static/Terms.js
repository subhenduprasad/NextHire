import React from 'react';

export const Terms = () => {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 pb-16 pt-24 font-inter">
            <div className="container-custom max-w-4xl">
                <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl shadow-sm border border-neutral-100 dark:border-slate-700">
                    <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6">Terms of Service</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-8">Last updated: April 15, 2026</p>
                    
                    <div className="space-y-8 text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
                            <p>By accessing or using NextHire, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you may not access or use to our services.</p>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">2. User Accounts</h2>
                            <p>You must provide accurate and complete information when creating an account. You are solely responsible for keeping your password secure and for all actions that occur under your account. We reserve the right to suspend or terminate accounts that violate our policies or community guidelines.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">3. Acceptable Use</h2>
                            <p>You agree not to use the platform for any illegal or unauthorized purpose. Candidates must not submit false resumes or qualifications. Employers must not post discriminatory, misleading, or deceptive job listings. Spamming, harassing, or scraping data from our platform is strictly prohibited.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">4. Intellectual Property</h2>
                            <p>All content, branding, features, and functionality present on NextHire are the exclusive property of NextHire and its licensors. User-generated content remains yours, but you grant us a license to display it on the platform.</p>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">5. Modification of Services</h2>
                            <p>We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

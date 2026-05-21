import React from 'react';

export const Cookies = () => {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-slate-900 pb-16 pt-24 font-inter">
            <div className="container-custom max-w-4xl">
                <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl shadow-sm border border-neutral-100 dark:border-slate-700">
                    <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-6">Cookie Policy</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mb-8">Last updated: April 15, 2026</p>
                    
                    <div className="space-y-8 text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">1. What Are Cookies?</h2>
                            <p>Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.</p>
                        </section>
                        
                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">2. How We Use Cookies</h2>
                            <p>We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. Our main uses include:</p>
                            <ul className="list-disc pl-5 mt-3 space-y-2">
                                <li><strong>Authentication:</strong> Keeping you logged in as you navigate between pages.</li>
                                <li><strong>Preferences:</strong> Remembering your theme choice (Light/Dark mode) and application preferences.</li>
                                <li><strong>Analytics:</strong> Understanding how users interact with our platform so we can improve the UX.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">3. Managing Your Cookies</h2>
                            <p>Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set and how to manage and delete them, visit internetcookies.org.</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

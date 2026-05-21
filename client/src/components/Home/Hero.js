import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OurCompanies } from './OurCompanies'

export const Hero = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (location) params.append('location', location);
    navigate(`/all-posted-jobs?${params.toString()}`);
  };

  const stats = [
    { value: '250+', label: 'Active Jobs' },
    { value: '50+', label: 'Hiring Companies' },
    { value: '1000+', label: 'Candidates' },
    { value: '24/7', label: 'Platform Access' },
  ];

  const popularSearches = [
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Data Analyst',
    'UI/UX Designer',
    'DevOps Engineer',
    'Product Manager',
  ];

  return (
    <div className='relative overflow-hidden'>
      {/* Background Gradient */}
      <div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 -z-10' />
      <div className='absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-secondary/10 to-transparent -z-10' />
      
      {/* Decorative Elements */}
      <div className='absolute top-20 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl -z-10' />
      <div className='absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10' />

      <div className='container-custom py-16 md:py-24 lg:py-32'>
        <div className='max-w-4xl mx-auto text-center'>
          {/* Badge */}
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 rounded-full text-secondary-700 text-sm font-medium mb-8 animate-fade-in'>
            <span className='flex h-2 w-2 rounded-full bg-secondary animate-pulse' />
            500+ Opportunities
          </div>

          {/* Main Heading */}
          <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight animate-slide-up'>
            Find Your{' '}
            <span className='relative'>
              <span className='gradient-text'>Dream Job</span>
              <svg className='absolute -bottom-2 left-0 w-full' viewBox='0 0 200 12' fill='none'>
                <path d='M2 10C50 4 150 4 198 10' stroke='#16a34a' strokeWidth='3' strokeLinecap='round' />
              </svg>
            </span>
            {' '}Today
          </h1>

          {/* Subtitle */}
          <p className='text-lg md:text-xl text-neutral-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed'>
            Connect with top companies, discover thousands of opportunities, 
            and take the next step in your career journey.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className='mb-8'>
            <div className='bg-white dark:bg-slate-800/80 p-3 rounded-2xl shadow-strong border border-neutral-100 dark:border-slate-700/50 max-w-3xl mx-auto'>
              <div className='flex flex-col md:flex-row gap-3'>
                <div className='flex-1 relative'>
                  <svg className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                  </svg>
                  <input
                    type='text'
                    placeholder='Job title, keywords, or company'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-slate-700/50 border-0 rounded-xl text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:bg-white dark:focus:bg-slate-700 transition-all'
                  />
                </div>
                <div className='flex-1 relative'>
                  <svg className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                  </svg>
                  <input
                    type='text'
                    placeholder='City, state, or remote'
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className='w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-slate-700/50 border-0 rounded-xl text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:bg-white dark:focus:bg-slate-700 transition-all'
                  />
                </div>
                <button 
                  type='submit'
                  className='btn-secondary py-4 px-8 whitespace-nowrap'
                >
                  <svg className='w-5 h-5 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                  </svg>
                  Search Jobs
                </button>
              </div>
            </div>
          </form>

          {/* Popular Searches */}
          <div className='flex flex-wrap items-center justify-center gap-2 mb-16'>
            <span className='text-sm text-neutral-500'>Popular:</span>
            {popularSearches.map((term) => (
              <button 
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  navigate(`/all-posted-jobs?search=${term}`);
                }}
                className='px-4 py-1.5 bg-white dark:bg-slate-800/80 border border-neutral-200 dark:border-slate-700 rounded-full text-sm text-neutral-600 dark:text-slate-300 hover:border-secondary dark:hover:border-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-400 transition-all'
              >
                {term}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto'>
            {stats.map((stat) => (
              <div key={stat.label} className='text-center'>
                <div className='text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-1'>
                  {stat.value}
                </div>
                <div className='text-sm text-neutral-500 dark:text-slate-400'>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Companies Section */}
      <OurCompanies />
    </div>
  )
}

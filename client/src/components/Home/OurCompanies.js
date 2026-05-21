import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import logoURL from '../../assets/img/logo.jpeg'

export const OurCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/company/all-companies`);
        const result = await response.json();
        const companiesArray = result.data || result || [];
        if (Array.isArray(companiesArray)) {
          setCompanies(companiesArray.slice(0, 8));
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  if (isLoading) {
    return (
      <section className='py-16 bg-neutral-50 dark:bg-slate-900'>
        <div className='container-custom'>
          <div className='text-center mb-12'>
            <h2 className='text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-3'>
              Trusted by Leading Companies
            </h2>
            <p className='text-neutral-600 dark:text-slate-400'>Join thousands of companies hiring on our platform</p>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
            {[...Array(8)].map((_, i) => (
              <div key={i} className='h-24 bg-neutral-200 rounded-xl animate-pulse' />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='py-16 bg-neutral-50 dark:bg-slate-900'>
      <div className='container-custom'>
        <div className='text-center mb-12'>
          <h2 className='text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-3'>
            {companies.length > 0 ? 'Trusted by Leading Companies' : 'Our Trusted Partners'}
          </h2>
          <p className='text-neutral-600 dark:text-slate-400'>Join thousands of companies hiring on our platform</p>
        </div>
              
        {companies.length > 0 ? (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10'>
            {companies.map((company) => (
              <Link 
                key={company._id}
                to={`/company/${company._id}`}
                className='group'
              >
                <div className='bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-neutral-100 dark:border-slate-700/50 hover:border-secondary/30 dark:hover:border-secondary-500/50 hover:shadow-medium transition-all duration-300 h-full flex flex-col items-center justify-center text-center'>
                  <div className='w-16 h-16 mb-4 rounded-xl bg-neutral-50 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform'>
                    {company.companyLogo ? (
                      <img
                        src={company.companyLogo}
                        alt={company.companyName}
                        className='w-full h-full object-contain p-2'
                        onError={(e) => { e.target.src = logoURL; }}
                      />
                    ) : (
                      <span className='text-2xl font-bold text-secondary'>
                        {company.companyName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <h3 className='font-semibold text-neutral-800 dark:text-white mb-1 group-hover:text-secondary-700 dark:group-hover:text-secondary-400 transition-colors'>
                    {company.companyName}
                  </h3>
                  {company.industry && (
                    <span className='text-xs text-neutral-500'>{company.industry}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className='flex items-center justify-center gap-8 flex-wrap mb-10'>
            {['TCS', 'Infosys', 'Wipro', 'Google', 'Microsoft', 'Amazon'].map((name) => (
              <div key={name} className='text-2xl font-bold text-neutral-300'>
                {name}
              </div>
            ))}
          </div>
        )}

        <div className='text-center'>
          <Link 
            to='/companies'
            className='inline-flex items-center gap-2 text-secondary-600 font-semibold hover:text-secondary-700 transition-colors'
          >
            View All Companies
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 8l4 4m0 0l-4 4m4-4H3' />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

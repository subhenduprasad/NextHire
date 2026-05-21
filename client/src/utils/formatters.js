export const formatSalary = (job) => {
    if (!job) return 'Not specified';
    
    if (job.salaryMin && job.salaryMax) {
        const currencyMap = {
            'INR': '₹',
            'USD': '$',
            'EUR': '€',
            'GBP': '£'
        };
        const symbol = currencyMap[job.currency] || '₹';
        const suffix = (!job.currency || job.currency === 'INR') ? 'LPA' : '';
        return `${symbol}${job.salaryMin} - ${job.salaryMax} ${suffix}`.trim();
    } else if (job.salary) {
        if (job.salary.toString().toLowerCase().includes('not specified')) {
            return 'Not specified';
        }
        return `₹${job.salary} LPA`;
    }
    return 'Not specified';
};

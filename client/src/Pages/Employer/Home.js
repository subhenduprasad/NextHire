import React from 'react'
import { Hero } from '../../components/Home/Hero'
import { FeaturedJobs } from '../../components/Home/FeaturedJobs'

export const Home = () => {
  return (
    <div className='min-h-screen'>
      <Hero />
      <FeaturedJobs />
    </div>
  )
}

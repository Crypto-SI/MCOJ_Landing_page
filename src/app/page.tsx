import Image from 'next/image'
import Link from 'next/link'
import Gallery from '@/components/Gallery'
import EventsDiary from '@/components/EventsDiary'
import BookingForm from '@/components/BookingForm'
import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-black">
      <Navigation />
      <Hero />
      <About />
      <EventsDiary />
      <Gallery />
      <BookingForm />
      <Footer />
    </main>
  )
} 
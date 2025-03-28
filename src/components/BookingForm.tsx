'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon, EnvelopeIcon, PhoneIcon, CurrencyPoundIcon, SparklesIcon, UserGroupIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';

type FormData = {
  name: string;
  email: string;
  phone: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventLocation: string;
  additionalInfo: string;
};

type FormErrors = {
  [key in keyof FormData]?: string;
};

export default function BookingForm() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    eventName: '',
    eventDate: '',
    eventTime: '',
    eventVenue: '',
    eventLocation: '',
    additionalInfo: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Required fields
    const requiredFields: (keyof FormData)[] = ['name', 'email', 'phone', 'eventName', 'eventDate', 'eventVenue', 'eventLocation'];
    
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
        isValid = false;
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Phone validation (simple check for now)
    if (formData.phone && !/^[0-9+\s()-]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Send data to the booking API
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          venue: formData.eventVenue,
          date: formData.eventDate,
          time: formData.eventTime,
          eventType: formData.eventName,
          message: formData.additionalInfo
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSubmissionStatus('success');
        
        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          phone: '',
          eventName: '',
          eventDate: '',
          eventTime: '',
          eventVenue: '',
          eventLocation: '',
          additionalInfo: '',
        });
      } else {
        setSubmissionStatus('error');
      }
    } catch (error) {
      setSubmissionStatus('error');
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="booking" className="relative py-20">
      {/* Background image */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image 
          src="/images/Crowd.jpg"
          alt="Crowd at an MC OJ event"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
      
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-black/95 via-brand-navy/85 to-brand-black/95 z-10" />
      
      <div className="container relative z-20 mx-auto px-4">
        <h2 className="section-title text-center">Book MC OJ</h2>
        
        {submissionStatus === 'success' ? (
          <div className="max-w-2xl mx-auto mt-10 bg-brand-black/80 backdrop-blur-sm border border-brand-gold rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bank-gothic text-brand-gold mb-4">Booking Request Submitted!</h3>
            <p className="text-white mb-6">
              Thank you for your interest in booking MC OJ. We&apos;ll review your request and get back to you within 24-48 hours.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setSubmissionStatus('idle');
                  setShowForm(false);
                }}
                className="btn-secondary"
              >
                Back to Booking
              </button>
              <button
                onClick={() => setSubmissionStatus('idle')}
                className="btn-primary"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        ) : submissionStatus === 'error' ? (
          <div className="max-w-2xl mx-auto mt-10 bg-brand-black/80 backdrop-blur-sm border border-red-500 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bank-gothic text-red-500 mb-4">Something Went Wrong</h3>
            <p className="text-white mb-6">
              There was an error submitting your booking request. Please try again or contact us directly.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setSubmissionStatus('idle');
                }}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : showForm ? (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowForm(false)}
              className="btn-secondary mb-8 mx-auto block"
            >
              Back to Booking
            </button>
            
            <form onSubmit={handleSubmit} className="bg-brand-black/80 backdrop-blur-sm rounded-lg p-8 border border-brand-gold/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="md:col-span-2">
                  <h3 className="text-xl font-bank-gothic text-brand-gold mb-4">Your Information</h3>
                </div>

                <div className="space-y-2">
                  <label htmlFor="name" className="block text-white font-medium">
                    Full Name <span className="text-brand-gold">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-brand-gold" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`block w-full pl-10 rounded-md bg-brand-black/50 border ${
                        errors.name ? 'border-red-500' : 'border-brand-grey'
                      } focus:outline-none focus:ring-2 focus:ring-brand-gold text-white py-2 px-4`}
                      placeholder="Your name"
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-white font-medium">
                    Email <span className="text-brand-gold">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-brand-gold" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`block w-full pl-10 rounded-md bg-brand-black/50 border ${
                        errors.email ? 'border-red-500' : 'border-brand-grey'
                      } focus:outline-none focus:ring-2 focus:ring-brand-gold text-white py-2 px-4`}
                      placeholder="Your email"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-white font-medium">
                    Phone Number <span className="text-brand-gold">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-brand-gold" />
                    </div>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`block w-full pl-10 rounded-md bg-brand-black/50 border ${
                        errors.phone ? 'border-red-500' : 'border-brand-grey'
                      } focus:outline-none focus:ring-2 focus:ring-brand-gold text-white py-2 px-4`}
                      placeholder="Your phone number"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                {/* Event Information */}
                <div className="md:col-span-2 mt-6">
                  <h3 className="text-xl font-bank-gothic text-brand-gold mb-4">Event Details</h3>
                </div>

                <div className="space-y-2">
                  <label htmlFor="eventName" className="block text-white font-medium">
                    Event Name <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    type="text"
                    id="eventName"
                    name="eventName"
                    value={formData.eventName}
                    onChange={handleChange}
                    className={`block w-full rounded-md bg-brand-black/50 border ${
                      errors.eventName ? 'border-red-500' : 'border-brand-grey'
                    } focus:outline-none focus:ring-2 focus:ring-brand-gold text-white py-2 px-4`}
                    placeholder="Name of your event"
                  />
                  {errors.eventName && <p className="text-red-500 text-sm mt-1">{errors.eventName}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="eventDate" className="block text-white font-medium">
                    Event Date <span className="text-brand-gold">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CalendarIcon className="h-5 w-5 text-brand-gold" />
                    </div>
                    <input
                      type="date"
                      id="eventDate"
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleChange}
                      className={`block w-full pl-10 rounded-md bg-brand-black/50 border ${
                        errors.eventDate ? 'border-red-500' : 'border-brand-grey'
                      } focus:outline-none focus:ring-2 focus:ring-brand-gold text-white py-2 px-4`}
                    />
                  </div>
                  {errors.eventDate && <p className="text-red-500 text-sm mt-1">{errors.eventDate}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="eventTime" className="block text-white font-medium">
                    Event Time <span className="text-brand-gold">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ClockIcon className="h-5 w-5 text-brand-gold" />
                    </div>
                    <input
                      type="time"
                      id="eventTime"
                      name="eventTime"
                      value={formData.eventTime}
                      onChange={handleChange}
                      className={`block w-full pl-10 rounded-md bg-brand-black/50 border ${
                        errors.eventTime ? 'border-red-500' : 'border-brand-grey'
                      } focus:outline-none focus:ring-2 focus:ring-brand-gold text-white py-2 px-4`}
                    />
                  </div>
                  {errors.eventTime && <p className="text-red-500 text-sm mt-1">{errors.eventTime}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="eventVenue" className="block text-white font-medium">
                    Venue <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    type="text"
                    id="eventVenue"
                    name="eventVenue"
                    value={formData.eventVenue}
                    onChange={handleChange}
                    className={`block w-full rounded-md bg-brand-black/50 border ${
                      errors.eventVenue ? 'border-red-500' : 'border-brand-grey'
                    } focus:outline-none focus:ring-2 focus:ring-brand-gold text-white py-2 px-4`}
                    placeholder="Venue name"
                  />
                  {errors.eventVenue && <p className="text-red-500 text-sm mt-1">{errors.eventVenue}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="eventLocation" className="block text-white font-medium">
                    Location <span className="text-brand-gold">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPinIcon className="h-5 w-5 text-brand-gold" />
                    </div>
                    <input
                      type="text"
                      id="eventLocation"
                      name="eventLocation"
                      value={formData.eventLocation}
                      onChange={handleChange}
                      className={`block w-full pl-10 rounded-md bg-brand-black/50 border ${
                        errors.eventLocation ? 'border-red-500' : 'border-brand-grey'
                      } focus:outline-none focus:ring-2 focus:ring-brand-gold text-white py-2 px-4`}
                      placeholder="City, Country"
                    />
                  </div>
                  {errors.eventLocation && <p className="text-red-500 text-sm mt-1">{errors.eventLocation}</p>}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="additionalInfo" className="block text-white font-medium">
                    Additional Information
                  </label>
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    rows={4}
                    className="block w-full rounded-md bg-brand-black/50 border border-brand-grey focus:outline-none focus:ring-2 focus:ring-brand-gold text-white py-2 px-4"
                    placeholder="Any additional details about your event..."
                  />
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2 mt-6 flex justify-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn-primary w-full max-w-xs ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Booking Request'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-xl md:text-2xl font-montserrat text-white mb-6 max-w-3xl mx-auto">
                Experience the electrifying presence of MC OJ at your next event. Fill out our booking form to inquire about availability.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-brand-black/70 backdrop-blur-sm p-6 rounded-lg border border-brand-gold/20">
                  <SparklesIcon className="h-8 w-8 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-brand-gold font-bank-gothic text-xl mb-2">Crowd Control</h3>
                  <p className="text-white/80">Master of ceremonies who knows how to read and elevate any crowd</p>
                </div>
                
                <div className="bg-brand-black/70 backdrop-blur-sm p-6 rounded-lg border border-brand-gold/20">
                  <UserGroupIcon className="h-8 w-8 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-brand-gold font-bank-gothic text-xl mb-2">Vibe Creator</h3>
                  <p className="text-white/80">Creates an electric atmosphere that keeps the energy high all night</p>
                </div>
                
                <div className="bg-brand-black/70 backdrop-blur-sm p-6 rounded-lg border border-brand-gold/20">
                  <MusicalNoteIcon className="h-8 w-8 text-brand-gold mx-auto mb-4" />
                  <h3 className="text-brand-gold font-bank-gothic text-xl mb-2">UK Garage Expert</h3>
                  <p className="text-white/80">Deep knowledge of UK Garage scene with years of experience</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary w-full max-w-xs mx-auto"
              >
                Book Now
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
} 
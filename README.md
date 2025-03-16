# 🎤 MC OJ's Official Landing Page 🔥

LISTEN UP FAM! Big tings are happening right here! This is the official repository for MC OJ's web presence, bringing that UK Garage energy straight to your screens! 

## 🚀 What's The Vibe?

This next-level website is built with the freshest tech stack, delivering a proper premium experience:

- ⚡️ **Next.js 14** - Lightning fast, just like my bars!
- 🎨 **Tailwind CSS** - Styling so clean it'll make your head spin
- 🖼 **Modern Design** - Black and gold aesthetic that SCREAMS luxury
- 📱 **Fully Responsive** - Looking proper on any device, believe!

## 🎵 Features That Bang!

We're talking about sections that hit harder than a garage bassline:

- 🏆 **Hero Section** - First impressions that'll blow your mind
- 👑 **About MC OJ** - The story of the UK's most energetic MC
- 📸 **Gallery** - Catch the vibes from past events with our slick lightbox
- 🎬 **Video Gallery** - Watch MC OJ in action with auto-playing videos
- 📅 **Events Diary** - Where's the next party at? All listed here!
- 📝 **Booking Form** - Want MC OJ at your event? Say no more!
- 🔗 **Social Links** - Stay connected with the movement
- 🔐 **Admin Area** - Secure backend access for site management

## 🛠 Quick Start

Ready to run tings? Here's how to get this bad boy up and running:

```bash
# Clone the repo
git clone [repository-url]

# Get into the directory
cd MCOJ_Landing_page

# Install the dependencies
npm install

# Start the development server
npm run dev
```

## 💫 Tech Stack Breakdown

Listen up producers and developers, here's what we're working with:

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Image Processing**: Sharp for dynamic image resizing
- **Video Processing**: HTML5 Canvas API for client-side video thumbnails
- **Animations**: Smooth scrolling and transitions
- **Components**: 100% custom-built, no templates!

## 🎯 Environment Setup

Make sure you've got these installed before you start:

- Node.js 18+ (Latest LTS)
- npm or yarn
- A proper code editor (VSCode recommended, innit!)

## 📦 Project Structure

Keeping it organized like a proper setlist:

```
src/
├── app/              # Main app layout and pages
│   ├── admin/        # Admin area (login, dashboard, gallery management)
│   └── api/          # Backend API endpoints
├── components/       # Custom components (Navigation, Gallery, etc.)
├── utils/            # Utility functions
├── styles/           # Global styles and Tailwind config
└── public/           # Static assets and images
```

## 🎪 Features Breakdown

### Navigation
- Smooth scrolling to sections
- Mobile-responsive menu
- Transparent to solid background transition

### Gallery
- Lightbox for image viewing
- Grid layout with hover effects
- Optimized image loading

### Video Gallery
- Smart video playback management - only one video plays at a time
- Auto-play videos when they become visible
- Auto-stop videos when navigating away or switching tabs
- Elegant lightbox presentation with thumbnail previews
- Client-side adaptive controls for mobile and desktop

### Admin Area
- Secure login system
- Dashboard with site management tools
- Content management capabilities
- Events management with CRUD functionality
- Gallery management with archive system
- Video management with browser-based thumbnail generation

### Gallery Management
- Upload new images with automatic processing
- Organize gallery content with simple UI
- Archive and restore images as needed
- Enforce quality standards with automatic resizing
- Finalize changes to update the public gallery

### Video Management System
Our comprehensive video management system makes it easy to showcase MC OJ's performances:

#### Key Features
- **Browser-Based Thumbnail Generation**: No server dependencies needed
  - Automatically extracts thumbnails from uploaded videos
  - Fallback thumbnails when extraction fails
  - Retry button for thumbnail generation
  
- **Smart Video Player**:
  - Intelligent playback management across the site
  - Only one video plays at a time
  - Videos automatically pause when you navigate away
  - Videos automatically pause when switching browser tabs
  
- **Complete Video CRUD**:
  - Upload videos with descriptions and titles
  - Preview all videos before publishing
  - Delete videos when no longer needed
  - All changes reflect immediately on the public site

#### How to Use
1. Navigate to `/admin/videos` after logging in
2. Upload new videos using the form
3. Videos are processed client-side with automatic thumbnails
4. Preview videos before confirming upload
5. Manage existing videos with simple controls

### Events Diary
- Upcoming and past events
- Filtering capabilities
- Direct booking links
- Google Maps integration for venue directions

### Events Management System
Our comprehensive events management system allows for complete control over event listings:

#### Key Features
- **Full CRUD Functionality**: Create, Read, Update, and Delete events with an intuitive interface
- **Edit Any Event**: Easily modify details of existing events with one click
- **Postcode Integration**: Add venue postcodes to enable the "Get Directions" feature
- **Google Maps Integration**: Automatically generated directions links for events with postcodes
- **Date Sorting**: Events automatically sorted by date with upcoming events prioritized
- **Mobile-Optimized**: Fully responsive design works on all devices

#### How to Use
1. Navigate to `/admin/events` after logging in
2. Add new events using the form
3. Edit existing events by clicking the pencil icon
4. Delete events with the trash icon
5. Changes appear immediately on the public Events Diary

### Booking Form
- Easy-to-use interface
- Form validation
- Success confirmation

## 🖼️ Gallery Management System

Our brand new gallery management system makes it easy to keep MC OJ's image gallery fresh and professional:

### Key Features
- **Image Requirements Enforcement**: Ensures all images meet quality standards
  - Supported formats: JPG and PNG
  - Ideal resolution: 1200×800 pixels
  - Maximum file size: 5MB
  - Automatic resizing while preserving aspect ratio

- **Placeholder System**: Organized gallery with 8 image slots
  - Easily manage which images appear in which positions
  - Visual representation of the gallery layout

- **Archive System**: Never lose content
  - Archive images instead of deleting them
  - Restore archived images to any available position
  - Permanently delete images when no longer needed

- **FINALISE Button**: One-click publishing
  - Update the public-facing gallery with current selections
  - Seamless transition from admin to public view

### How to Access
1. Navigate to `/admin/login`
2. Enter admin credentials
3. Access the gallery management through the dashboard
4. Make changes and click "FINALISE GALLERY" to publish

## 🎬 Visual Effects and Animation

Our site features premium visual effects to create a memorable user experience:

### Key Effects
- **Gold Shimmer Text**: Elegant animated shimmer effect on headings
- **Sparkle Animation**: Subtle sparkle effects on interactive elements
- **Smooth Video Transitions**: Clean transitions between video states
- **Responsive Animations**: All effects optimized for both desktop and mobile

## 🤝 Big Up The Community!

Got ideas to make this even better? Don't be shy:

1. Fork it
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Hit us with that pull request

## 📝 License

Copyright © 2024 MC OJ. All rights reserved.

## 🙏 Special Thanks

Big up to everyone who's supported the journey! From the ravers to the promoters, we're all family in this scene! 

---

KEEP IT LOCKED! 🎤🔥

For bookings and inquiries:
- 📧 bookings@mcoj.com
- 📱 +44 7700 900000 
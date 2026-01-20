# College Orbit

A comprehensive college dashboard web app for managing courses, deadlines, tasks, exams, notes, and more. Features Canvas LMS integration, cloud sync, and a premium subscription tier.

## Features

### Core Features
- **Dashboard**: Customizable overview with today's classes, upcoming deadlines, tasks, exams, and quick links
- **Courses**: Manage course information, meeting times, locations, and links with file attachments
- **Assignments**: Track deadlines with priority levels, effort estimates, tags, notes, and recurring patterns
- **Tasks**: Create tasks with checklists, importance levels, pinning, and recurring schedules
- **Exams**: Schedule exams with location tracking, reminders, and recurring patterns
- **Notes**: Rich text editor (TipTap) with folders, tags, file attachments, and deep linking to tasks/deadlines/exams
- **Calendar**: Day, week, and month views with all your events in one place
- **Shopping Lists**: Grocery, wishlist, and pantry management with:
  - Bulk import from recipes or lists (smart parsing)
  - Purchase history tracking
  - Move items between lists (pantry ↔ grocery)
  - Categories, priority levels, and perishable tracking

### Productivity Tools
- **GPA Calculator**: Track grades by semester with trend visualization and what-if projections
- **Pomodoro Timer**: Built-in focus timer with customizable work/break durations
- **Quick Capture**: Press "/" to quickly add tasks, deadlines, or exams from anywhere
- **Natural Language Input**: Create items using natural language parsing
- **Keyboard Shortcuts**: Full keyboard navigation support

### Integrations
- **Canvas LMS**: Sync courses, assignments, grades, events, and announcements from Canvas
- **File Attachments**: Upload and attach files to courses, deadlines, tasks, and notes
- **Export/Import**: Backup and restore all your data as JSON

### Personalization
- **Theme Support**: Light, dark, and system-based themes
- **Custom Colors**: Customize accent colors for light and dark modes
- **University Branding**: Select your university for school colors and quick links
- **Colorblind Accessibility**: Multiple colorblind modes with pattern options
- **Dashboard Customization**: Show/hide and reorder dashboard cards

### Account & Security
- **User Authentication**: Secure login with email/password
- **Password Reset**: Email-based password recovery
- **Session Management**: View and manage active sessions
- **Data Privacy**: Your data stays in your account

## Tech Stack

- **Framework**: Next.js 16+ with React 19
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **File Storage**: Vercel Blob
- **Email**: Resend
- **Rich Text**: TipTap
- **Language**: TypeScript

## Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Stripe account (for payments)
- Resend account (for emails)

### Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."

# Resend (Email)
RESEND_API_KEY="re_..."

# Vercel Blob (File Storage)
BLOB_READ_WRITE_TOKEN="..."
```

### Local Development

1. Clone or navigate to the project directory:
```bash
cd "College Orbit"
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in the Vercel dashboard
5. Deploy

### Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Create a new project and connect your GitHub repository
4. Add a PostgreSQL database
5. Set environment variables
6. Deploy

## Project Structure

```
College Orbit/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Auth pages (login, signup, etc.)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth routes
│   │   ├── courses/
│   │   ├── deadlines/
│   │   ├── tasks/
│   │   ├── exams/
│   │   ├── notes/
│   │   ├── folders/
│   │   ├── shopping/
│   │   ├── stripe/               # Payment webhooks
│   │   ├── admin/                # Admin endpoints
│   │   └── ...
│   ├── account/                  # Account management
│   ├── admin/                    # Admin panel
│   ├── analytics/                # Usage analytics
│   ├── calendar/                 # Calendar view
│   ├── checkout/                 # Subscription checkout
│   ├── courses/                  # Course management
│   ├── deadlines/                # Assignment tracking
│   ├── exams/                    # Exam scheduling
│   ├── notes/                    # Note taking
│   ├── pricing/                  # Pricing page
│   ├── release-notes/            # Version history
│   ├── settings/                 # User settings
│   ├── shopping/                 # Shopping lists
│   ├── subscription/             # Subscription management
│   ├── tasks/                    # Task management
│   ├── tools/                    # GPA calculator, Pomodoro, etc.
│   ├── privacy/                  # Privacy policy
│   ├── terms/                    # Terms of service
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing/Dashboard page
│   └── globals.css               # Global styles
├── components/                   # Reusable components
│   ├── ui/                       # Base UI components
│   ├── calendar/                 # Calendar components
│   ├── notes/                    # Notes components
│   ├── subscription/             # Subscription components
│   ├── tools/                    # Tool components (GPA, Pomodoro)
│   └── ...
├── lib/                          # Utilities and helpers
│   ├── store.ts                  # Zustand store
│   ├── prisma.ts                 # Prisma client
│   ├── stripe.ts                 # Stripe configuration
│   ├── email.ts                  # Email utilities
│   ├── canvas.ts                 # Canvas LMS integration
│   ├── subscription.ts           # Subscription helpers
│   ├── naturalLanguageParser.ts  # NLP for quick capture
│   └── ...
├── types/                        # TypeScript types
│   └── index.ts                  # Data model types
├── prisma/                       # Database schema
│   └── schema.prisma
├── public/                       # Static assets
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Data Models

### Core Entities
- **Course**: Code, name, term, meeting times, links, files, Canvas sync
- **Deadline**: Title, due date, priority (1-3), effort (S/M/L), course link, recurring support
- **Task**: Title, due date, importance, checklist, pinned status, recurring support
- **Exam**: Title, date/time, location, course link, recurring support
- **Note**: Rich text content, folders, tags, links to tasks/deadlines/exams

### Supporting Entities
- **Folder**: Organize notes with nested folders
- **GpaEntry**: Track grades for GPA calculation
- **ShoppingItem**: Grocery, wishlist, and pantry items
- **CalendarEvent**: Custom calendar events
- **Notification**: System and Canvas notifications
- **ExcludedDate**: Holidays and course-specific excluded dates

## Accessibility

- Colorblind modes: Protanopia, Deuteranopia, Tritanopia, Achromatopsia
- Pattern-based indicators in addition to colors
- Full keyboard navigation support
- Clear focus states
- High contrast text
- Screen reader friendly

## Privacy & Security

- Secure authentication with hashed passwords
- Session-based auth with NextAuth.js
- Data stored securely in PostgreSQL database
- First-party analytics for usage insights (no third-party trackers)
- Export all your data anytime as JSON
- Delete account and all data in settings

## Common Issues

### Database connection errors
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Run `npx prisma db push` to sync schema

### Build errors
- Delete `node_modules` and `.next` directories
- Run `npm install` again
- Ensure Node 18+

### Canvas sync not working
- Verify Canvas instance URL format (e.g., `https://canvas.instructure.com`)
- Generate a new access token in Canvas settings
- Check that API access is enabled for your Canvas account

## Future Enhancements

- Mobile app (React Native)
- Browser extension for quick capture
- AI-powered study suggestions
- Collaborative study groups
- Integration with more LMS platforms (Blackboard, Moodle)
- Offline mode with background sync
- Meal planning integration with shopping lists

## License

MIT - Feel free to use and modify for personal use.

## Support

If you find bugs or have suggestions, create an issue in your GitHub repository or use the in-app feedback feature.

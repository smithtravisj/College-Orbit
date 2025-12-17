# BYU Survival Tool

A personal, privacy-first BYU dashboard web app for managing deadlines, schedule, checklists, and quick actions.

## Features

- **Dashboard**: Quick overview of today's classes, upcoming deadlines, and tasks
- **Courses**: Manage course information, meeting times, and links
- **Deadlines**: Track all deadlines with filtering and sorting
- **Tasks**: Create and track tasks with due dates and checklists
- **Quick Links**: One-click access to Canvas, email, library, and more
- **GPA Calculator**: Simple tool to calculate your current GPA
- **Privacy-First**: All data stored locally; no tracking or analytics
- **Export/Import**: Backup and restore your data as JSON
- **Offline Support**: Works offline with cached data

## Tech Stack

- **Frontend**: Next.js 16+ with React 19
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Storage**: localStorage
- **Language**: TypeScript

## Setup

### Prerequisites
- Node.js 18+ and npm

### Local Development

1. Clone or navigate to the project directory:
```bash
cd "BYU Survival Tool"
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Building for Production

```bash
npm run build
npm start
```

## Deployment

### Option 1: Railway (Recommended)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Create a new project and connect your GitHub repository
4. Railway will auto-detect the Next.js app
5. Set environment variables if needed (optional for this app)
6. Deploy!

### Option 2: Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel will auto-configure Next.js settings
5. Click Deploy!

### Option 3: Other Platforms

For static export:
```bash
npm run build
# Output is in ./out directory
```

Deploy the `./out` directory to any static hosting (Netlify, GitHub Pages, etc.)

## Project Structure

```
BYU Survival Tool/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard page
│   ├── courses/page.tsx   # Courses page
│   ├── deadlines/page.tsx # Deadlines page
│   ├── tasks/page.tsx     # Tasks page
│   ├── tools/page.tsx     # Tools page (GPA calculator)
│   ├── settings/page.tsx  # Settings page
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── Navigation.tsx     # Navigation sidebar/tabs
│   ├── Card.tsx          # Card wrapper component
│   ├── CaptureInput.tsx  # Quick capture input
│   ├── CourseForm.tsx    # Course form
│   └── CourseList.tsx    # Course list
├── lib/                   # Utilities and helpers
│   ├── store.ts          # Zustand store
│   └── utils.ts          # Date and utility functions
├── types/                 # TypeScript types
│   └── index.ts          # Data model types
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## Manual Test Checklist

Use this checklist to verify all MVP features work:

### Dashboard
- [ ] Open app and see Dashboard
- [ ] See "Next Class" card with today's class time and location
- [ ] See "Due Soon" card with upcoming deadlines (next 7 days)
- [ ] See "Today Tasks" card with today's tasks
- [ ] See "Quick Links" card
- [ ] See "Status" summary at bottom
- [ ] Press "/" to focus capture input
- [ ] Type in capture box and click Add to create a task

### Courses
- [ ] Click "Courses" in navigation
- [ ] Click "+ New Course" button
- [ ] Fill in course details (code, name, meeting times, links)
- [ ] Click "Add Course" to save
- [ ] See course in list
- [ ] Click "Edit" to modify course
- [ ] Click "Delete" to remove course
- [ ] Verify course links work

### Deadlines
- [ ] Click "Deadlines" in navigation
- [ ] Click "+ New Deadline"
- [ ] Enter deadline details and click "Add"
- [ ] See deadline in list sorted by date
- [ ] Click filters (All, Overdue, Done)
- [ ] Verify overdue items show "■ OVERDUE" label
- [ ] Verify deadline appears in Dashboard "Due Soon"

### Tasks
- [ ] Click "Tasks" in navigation
- [ ] Click "+ New Task"
- [ ] Create a task with title and optional due date
- [ ] Check/uncheck task to mark done
- [ ] Click pin icon to pin/unpin task
- [ ] Pinned task should appear in Dashboard
- [ ] Filter by Today, All, Done

### Settings
- [ ] Click "Settings" in navigation
- [ ] Change "Due Soon Window" value
- [ ] Verify setting persists (refresh page)
- [ ] Click "Export Data" to download JSON
- [ ] Click "Import Data" and select the exported file
- [ ] Verify data is imported
- [ ] Note: "Delete All Data" permanently clears localStorage

### Data Persistence
- [ ] Add some courses, deadlines, and tasks
- [ ] Refresh the page
- [ ] Verify all data is still there (localStorage)

### Mobile Responsive
- [ ] View on mobile (or use browser DevTools)
- [ ] Navigation should be a bottom tab bar on mobile
- [ ] Cards should stack vertically
- [ ] Buttons should be at least 44px tall

### Accessibility
- [ ] Use Tab key to navigate
- [ ] Verify focus states are visible
- [ ] Overdue items use both icon and text (not just color)
- [ ] All text has sufficient contrast

## Data Model

All data is stored in localStorage as JSON. Export format:

```json
{
  "courses": [
    {
      "id": "uuid",
      "code": "CHEM 101",
      "name": "General Chemistry",
      "term": "Winter 2026",
      "meetingTimes": [
        {
          "day": "Mon",
          "start": "10:00",
          "end": "10:50",
          "location": "BNSN 120"
        }
      ],
      "links": [
        {
          "label": "Canvas",
          "url": "https://canvas.byu.edu/..."
        }
      ],
      "colorTag": ""
    }
  ],
  "deadlines": [...],
  "tasks": [...],
  "settings": {...}
}
```

## Privacy & Security

- ✅ All data stored locally on your device
- ✅ No data sent to external servers
- ✅ No third-party analytics
- ✅ No ads or tracking
- ✅ No accounts required
- ✅ Delete all data anytime in Settings

## Common Issues

### Data not persisting
- Check browser localStorage settings
- Ensure localStorage is not disabled
- Try in incognito/private mode to test

### Build errors
- Delete `node_modules` and `.next` directories
- Run `npm install` again
- Ensure you're using Node 18+

### App not loading
- Check browser console for errors
- Clear browser cache and reload
- Try a different browser

## Future Enhancements

- Natural language parsing in capture ("Bio lab report Friday 5pm")
- iCal import for class schedule
- Canvas API integration
- Recurring deadlines
- Kanban board view
- Notifications
- Cloud sync with encryption
- Dark mode toggle

## License

MIT - Feel free to use and modify for personal use.

## Support

If you find bugs or have suggestions, create an issue in your GitHub repository.

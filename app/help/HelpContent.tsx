'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, ChevronDown, ChevronRight, X, HelpCircle, BookOpen, Calendar, CheckSquare, FileText, Settings, Shield, Zap, Bell, Download, Users, CreditCard } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  featured?: boolean;
}

const faqData: FAQ[] = [
  // Getting Started (Featured)
  {
    id: 'what-is-college-orbit',
    question: 'What is College Orbit?',
    answer: 'College Orbit is a privacy-first personal dashboard designed for students. It helps you manage your courses, track assignments and deadlines, organize notes, prepare for exams, and stay on top of your academic life. All your data is stored securely and we never share your personal information with third parties.',
    category: 'Getting Started',
    keywords: ['about', 'what', 'overview', 'introduction', 'start'],
    featured: true,
  },
  {
    id: 'how-to-add-courses',
    question: 'How do I add my courses?',
    answer: 'Go to the Courses page from the sidebar. Click the "Add Course" button and fill in your course details including name, code, professor, location, and schedule. You can also set a custom color for each course to help organize your calendar and tasks visually.',
    category: 'Getting Started',
    keywords: ['add', 'course', 'create', 'new', 'class', 'subject'],
    featured: true,
  },
  {
    id: 'how-to-add-assignments',
    question: 'How do I add assignments and deadlines?',
    answer: 'Navigate to the Deadlines page and click "Add Deadline". Enter the assignment name, select the associated course, set the due date and time, and optionally add a description. You can also set priority levels and receive reminders before the deadline.',
    category: 'Getting Started',
    keywords: ['assignment', 'deadline', 'homework', 'task', 'due date', 'add'],
    featured: true,
  },
  {
    id: 'keyboard-shortcuts',
    question: 'Are there keyboard shortcuts?',
    answer: 'Yes! Press the "?" key anywhere in the app to view all available keyboard shortcuts. Common shortcuts include: "/" to open global search, "N" to create new items, "C" for courses, "D" for deadlines, and arrow keys to navigate between items.',
    category: 'Getting Started',
    keywords: ['keyboard', 'shortcut', 'hotkey', 'key', 'quick'],
    featured: true,
  },

  // Courses
  {
    id: 'edit-course',
    question: 'How do I edit or delete a course?',
    answer: 'Open the Courses page and click on the course you want to modify. Click the three-dot menu (⋮) or the edit button to change course details. To delete, select "Delete" from the menu. Note: Deleting a course will also remove all associated deadlines, exams, and work items.',
    category: 'Courses',
    keywords: ['edit', 'delete', 'remove', 'modify', 'change', 'course'],
  },
  {
    id: 'course-colors',
    question: 'How do course colors work?',
    answer: 'Each course can have a custom color that appears throughout the app - in the calendar, deadlines, and work items. This helps you quickly identify which course an item belongs to. You can change a course\'s color by editing the course and selecting from the color palette.',
    category: 'Courses',
    keywords: ['color', 'theme', 'visual', 'customize', 'appearance'],
  },
  {
    id: 'course-schedule',
    question: 'How do I set up my class schedule?',
    answer: 'When adding or editing a course, you can set recurring class times. Select the days of the week, start and end times, and location. These will automatically appear on your calendar as recurring events.',
    category: 'Courses',
    keywords: ['schedule', 'time', 'recurring', 'weekly', 'class time', 'timetable'],
  },
  {
    id: 'archive-course',
    question: 'Can I archive old courses?',
    answer: 'Yes, you can archive courses from previous semesters. Archived courses are hidden from your main view but their data is preserved. Go to the course settings and select "Archive". You can unarchive them anytime from the archived courses section.',
    category: 'Courses',
    keywords: ['archive', 'old', 'past', 'semester', 'hide', 'previous'],
  },

  // Calendar
  {
    id: 'calendar-views',
    question: 'What calendar views are available?',
    answer: 'The calendar supports multiple views: Month view for a broad overview, Week view for detailed planning, and Day view for focused scheduling. Use the view selector at the top of the calendar to switch between them. You can also navigate using arrow keys.',
    category: 'Calendar',
    keywords: ['calendar', 'view', 'month', 'week', 'day', 'schedule'],
  },
  {
    id: 'add-calendar-event',
    question: 'How do I add events to my calendar?',
    answer: 'Click on any date or time slot in the calendar to create a new event. You can also click the "+" button. Events can be one-time or recurring, and you can link them to specific courses. All deadlines and exams automatically appear on your calendar.',
    category: 'Calendar',
    keywords: ['event', 'add', 'create', 'calendar', 'appointment'],
  },
  {
    id: 'calendar-sync',
    question: 'Can I sync with Google Calendar or other calendars?',
    answer: 'Yes! Go to Settings > Integrations to connect external calendars. You can import events from Google Calendar, Apple Calendar, or any calendar that supports ICS format. You can also export your College Orbit calendar to use in other apps.',
    category: 'Calendar',
    keywords: ['sync', 'google', 'apple', 'ical', 'import', 'export', 'integration'],
  },

  // Deadlines & Work
  {
    id: 'deadline-reminders',
    question: 'How do deadline reminders work?',
    answer: 'You can set reminders for each deadline when creating or editing it. Choose to be reminded hours or days before the due date. Reminders appear as notifications if you have them enabled. You can customize default reminder times in Settings > Preferences.',
    category: 'Deadlines',
    keywords: ['reminder', 'notification', 'alert', 'deadline', 'due'],
  },
  {
    id: 'recurring-deadlines',
    question: 'Can I create recurring deadlines?',
    answer: 'Yes, when adding a deadline, enable the "Recurring" option. You can set deadlines to repeat daily, weekly, biweekly, or monthly. This is perfect for regular assignments like weekly homework or lab reports.',
    category: 'Deadlines',
    keywords: ['recurring', 'repeat', 'weekly', 'regular', 'automatic'],
  },
  {
    id: 'priority-levels',
    question: 'What do the priority levels mean?',
    answer: 'Priority levels help you focus on what\'s most important. High priority items appear at the top and may have visual indicators. Medium is the default for regular assignments. Low priority is for optional or less urgent tasks. You can filter and sort by priority.',
    category: 'Deadlines',
    keywords: ['priority', 'important', 'urgent', 'high', 'low', 'medium'],
  },
  {
    id: 'complete-deadline',
    question: 'How do I mark a deadline as complete?',
    answer: 'Click the checkbox next to any deadline to mark it complete. Completed items move to the "Completed" section and contribute to your progress statistics. You can also undo completion if you made a mistake.',
    category: 'Deadlines',
    keywords: ['complete', 'done', 'finish', 'check', 'mark'],
  },
  {
    id: 'overdue-deadlines',
    question: 'What happens to overdue deadlines?',
    answer: 'Overdue deadlines are highlighted in red and appear in a separate "Overdue" section at the top of your deadlines page. You can either complete them, reschedule them to a new date, or delete them if they\'re no longer relevant.',
    category: 'Deadlines',
    keywords: ['overdue', 'late', 'missed', 'past due', 'expired'],
  },

  // Exams
  {
    id: 'add-exam',
    question: 'How do I add an exam?',
    answer: 'Go to the Exams page and click "Add Exam". Enter the exam name, course, date, time, and location. You can also add study materials, notes, and set study reminders. Exams appear on your calendar and in the countdown section.',
    category: 'Exams',
    keywords: ['exam', 'test', 'midterm', 'final', 'quiz', 'add'],
  },
  {
    id: 'exam-countdown',
    question: 'How does the exam countdown work?',
    answer: 'The Exams page shows a countdown to your upcoming exams, displaying days, hours, and minutes remaining. This helps you visualize how much study time you have left. Exams within the next week are highlighted for urgency.',
    category: 'Exams',
    keywords: ['countdown', 'timer', 'days left', 'upcoming', 'soon'],
  },
  {
    id: 'study-materials',
    question: 'Can I attach study materials to exams?',
    answer: 'Yes, you can link notes, upload files, or add URLs to study resources for each exam. This keeps all your study materials organized in one place. Access them quickly from the exam detail view.',
    category: 'Exams',
    keywords: ['study', 'materials', 'resources', 'attach', 'link', 'files'],
  },

  // Notes
  {
    id: 'create-notes',
    question: 'How do I create and organize notes?',
    answer: 'Go to the Notes page and click "New Note". Notes support rich text formatting including headings, lists, code blocks, and more. Organize notes by linking them to courses or using tags. You can also create folders for better organization.',
    category: 'Notes',
    keywords: ['note', 'create', 'write', 'organize', 'folder', 'tag'],
  },
  {
    id: 'notes-formatting',
    question: 'What formatting options are available for notes?',
    answer: 'Notes support rich text formatting: bold, italic, underline, strikethrough, headings (H1-H3), bullet lists, numbered lists, checkboxes, code blocks, blockquotes, links, and more. Use the toolbar or keyboard shortcuts like Ctrl+B for bold.',
    category: 'Notes',
    keywords: ['format', 'bold', 'italic', 'list', 'heading', 'markdown', 'style'],
  },
  {
    id: 'search-notes',
    question: 'How do I search through my notes?',
    answer: 'Use the search bar on the Notes page to search through all your notes. The search looks at both titles and content. You can also use the global search (press "/") to find notes from anywhere in the app.',
    category: 'Notes',
    keywords: ['search', 'find', 'filter', 'query', 'look for'],
  },
  {
    id: 'export-notes',
    question: 'Can I export my notes?',
    answer: 'Yes, you can export individual notes or all notes at once. Supported formats include PDF, Markdown, and plain text. Go to the note\'s menu and select "Export", or use the bulk export option in Settings > Data.',
    category: 'Notes',
    keywords: ['export', 'download', 'pdf', 'markdown', 'backup'],
  },

  // Progress & Analytics
  {
    id: 'progress-tracking',
    question: 'How does progress tracking work?',
    answer: 'The Progress page shows your completion statistics across all courses. It tracks completed vs. pending deadlines, study hours, exam performance, and more. Use this to identify which courses need more attention and celebrate your achievements.',
    category: 'Progress',
    keywords: ['progress', 'track', 'statistics', 'analytics', 'completion'],
  },
  {
    id: 'streaks',
    question: 'What are streaks?',
    answer: 'Streaks track consecutive days of completing at least one task. Maintaining streaks helps build consistent study habits. Your current and longest streaks are displayed on the Progress page. Don\'t break the chain!',
    category: 'Progress',
    keywords: ['streak', 'consecutive', 'daily', 'habit', 'chain'],
  },
  {
    id: 'achievements',
    question: 'How do achievements work?',
    answer: 'Earn achievements by reaching milestones like completing your first assignment, maintaining a week-long streak, or finishing all deadlines for a course. Achievements are displayed on your profile and provide motivation to stay on track.',
    category: 'Progress',
    keywords: ['achievement', 'badge', 'milestone', 'reward', 'gamification'],
  },

  // Settings & Customization
  {
    id: 'change-theme',
    question: 'How do I change the app theme?',
    answer: 'Go to Settings > Appearance to change your theme. Choose from light, dark, or system (auto-switches based on your device settings). You can also customize accent colors to match your college colors or personal preference.',
    category: 'Settings',
    keywords: ['theme', 'dark mode', 'light mode', 'appearance', 'color'],
  },
  {
    id: 'notifications-settings',
    question: 'How do I manage notifications?',
    answer: 'Go to Settings > Preferences to configure notifications. You can enable/disable different notification types (deadlines, reminders, updates), set quiet hours, and choose notification sounds. Browser notifications require permission.',
    category: 'Settings',
    keywords: ['notification', 'alert', 'sound', 'quiet', 'disable'],
  },
  {
    id: 'default-values',
    question: 'Can I set default values for new items?',
    answer: 'Yes, in Settings > Preferences you can set defaults for new deadlines (default reminder time, priority), notes (default course), and more. This saves time when adding items frequently.',
    category: 'Settings',
    keywords: ['default', 'preset', 'automatic', 'setting', 'preference'],
  },

  // Data & Privacy
  {
    id: 'data-storage',
    question: 'Where is my data stored?',
    answer: 'Your data is stored securely on our servers with encryption. We use industry-standard security practices to protect your information. We never share your personal data with third parties. You can read our full Privacy Policy for more details.',
    category: 'Privacy & Data',
    keywords: ['data', 'storage', 'security', 'privacy', 'server', 'encryption'],
  },
  {
    id: 'export-data',
    question: 'How do I export all my data?',
    answer: 'Go to Settings > Data and click "Export All Data". This downloads a complete backup of your courses, deadlines, notes, and settings in JSON format. You can use this for personal backup or to migrate to another system.',
    category: 'Privacy & Data',
    keywords: ['export', 'backup', 'download', 'data', 'json'],
  },
  {
    id: 'import-data',
    question: 'Can I import data from other apps?',
    answer: 'Yes, you can import data from various formats. Go to Settings > Data > Import to upload files. We support common formats and can help migrate from other student planners. Contact support if you need help with a specific format.',
    category: 'Privacy & Data',
    keywords: ['import', 'migrate', 'upload', 'transfer', 'data'],
  },
  {
    id: 'delete-account',
    question: 'How do I delete my account and data?',
    answer: 'Go to Settings > Account > Delete Account. This permanently removes all your data from our servers. This action cannot be undone, so we recommend exporting your data first. You\'ll need to confirm with your password.',
    category: 'Privacy & Data',
    keywords: ['delete', 'account', 'remove', 'permanent', 'gdpr'],
  },

  // Subscription & Premium
  {
    id: 'free-vs-premium',
    question: 'What\'s the difference between free and premium?',
    answer: 'The free tier includes all core features: courses, deadlines, notes, and calendar. Premium adds: unlimited storage, advanced analytics, custom themes, priority support, and more. Visit the Pricing page for a full comparison.',
    category: 'Subscription',
    keywords: ['free', 'premium', 'subscription', 'paid', 'features', 'pricing'],
  },
  {
    id: 'cancel-subscription',
    question: 'How do I cancel my subscription?',
    answer: 'Go to Settings > Subscription > Manage Subscription. Click "Cancel Subscription" to stop future billing. You\'ll keep premium access until the end of your current billing period. You can resubscribe anytime.',
    category: 'Subscription',
    keywords: ['cancel', 'subscription', 'stop', 'billing', 'unsubscribe'],
  },
  {
    id: 'student-discount',
    question: 'Is there a student discount?',
    answer: 'Yes! We offer discounted pricing for students with a valid .edu email address. The discount is automatically applied when you sign up with your school email. Contact support if you have a different school email domain.',
    category: 'Subscription',
    keywords: ['discount', 'student', 'edu', 'pricing', 'cheap'],
  },

  // Troubleshooting
  {
    id: 'app-not-loading',
    question: 'The app isn\'t loading properly',
    answer: 'Try these steps: 1) Refresh the page (Ctrl/Cmd + R), 2) Clear your browser cache, 3) Try a different browser, 4) Check your internet connection, 5) Disable browser extensions that might interfere. If issues persist, contact support.',
    category: 'Troubleshooting',
    keywords: ['loading', 'not working', 'broken', 'error', 'blank', 'slow'],
  },
  {
    id: 'data-not-syncing',
    question: 'My data isn\'t syncing across devices',
    answer: 'Ensure you\'re logged into the same account on all devices. Check your internet connection. Try logging out and back in. If sync issues persist, go to Settings > Data > Force Sync. Contact support if the problem continues.',
    category: 'Troubleshooting',
    keywords: ['sync', 'devices', 'not saving', 'lost', 'different'],
  },
  {
    id: 'forgot-password',
    question: 'I forgot my password',
    answer: 'Click "Forgot Password" on the login page. Enter your email address and we\'ll send you a password reset link. Check your spam folder if you don\'t see it. The link expires after 24 hours.',
    category: 'Troubleshooting',
    keywords: ['password', 'forgot', 'reset', 'login', 'locked'],
  },
  {
    id: 'notifications-not-working',
    question: 'I\'m not receiving notifications',
    answer: 'Check these settings: 1) Browser notification permissions (allow for this site), 2) System notification settings, 3) In-app notification settings (Settings > Preferences), 4) Check if quiet hours are active. Try sending a test notification.',
    category: 'Troubleshooting',
    keywords: ['notifications', 'not receiving', 'alerts', 'remind', 'broken'],
  },

  // Mobile & Browser Extension
  {
    id: 'mobile-app',
    question: 'Is there a mobile app?',
    answer: 'College Orbit is a web app that works great on mobile browsers. Add it to your home screen for an app-like experience: on iOS, tap Share > Add to Home Screen; on Android, tap the menu > Install app or Add to Home Screen.',
    category: 'Mobile & Extensions',
    keywords: ['mobile', 'app', 'ios', 'android', 'phone', 'install'],
  },
  {
    id: 'browser-extension',
    question: 'Is there a browser extension?',
    answer: 'Yes! The College Orbit browser extension lets you quickly add deadlines and notes without leaving your current page. Available for Chrome and other Chromium-based browsers. Install it from the Chrome Web Store.',
    category: 'Mobile & Extensions',
    keywords: ['extension', 'chrome', 'browser', 'addon', 'plugin'],
  },
  {
    id: 'offline-access',
    question: 'Can I use College Orbit offline?',
    answer: 'Limited offline access is available. Previously loaded data can be viewed offline, and changes sync when you\'re back online. For the best experience, we recommend staying connected. Full offline support is planned for future updates.',
    category: 'Mobile & Extensions',
    keywords: ['offline', 'no internet', 'disconnected', 'airplane mode'],
  },

  // Tools & Features
  {
    id: 'pomodoro-timer',
    question: 'How do I use the Pomodoro timer?',
    answer: 'Access the Pomodoro timer from the Tools page. Set your study and break durations (default: 25 min work, 5 min break). Click Start to begin. The timer notifies you when to switch. Track your completed sessions in the progress stats.',
    category: 'Tools',
    keywords: ['pomodoro', 'timer', 'focus', 'study', 'break', 'productivity'],
  },
  {
    id: 'gpa-calculator',
    question: 'How does the GPA calculator work?',
    answer: 'Find the GPA calculator in Tools. Enter your courses and grades. The calculator supports different grading scales (4.0, percentage, letter grades). You can calculate semester GPA or cumulative GPA across multiple semesters.',
    category: 'Tools',
    keywords: ['gpa', 'calculator', 'grades', 'average', 'score'],
  },
  {
    id: 'file-converter',
    question: 'What file conversions are supported?',
    answer: 'The file converter in Tools supports common conversions: images (PNG, JPG, WebP), documents (PDF, DOCX, TXT), and more. Upload your file, select the output format, and download the converted file. Processing happens securely.',
    category: 'Tools',
    keywords: ['convert', 'file', 'pdf', 'image', 'document', 'transform'],
  },
  {
    id: 'global-search',
    question: 'How do I search across everything?',
    answer: 'Press "/" or click the search icon to open Global Search. Search across all your courses, deadlines, notes, events, and more. Results are grouped by type. Use filters to narrow down results. Recent searches are saved for quick access.',
    category: 'Tools',
    keywords: ['search', 'global', 'find', 'everything', 'all'],
  },

  // Shopping & Lists
  {
    id: 'shopping-lists',
    question: 'How do I use shopping lists?',
    answer: 'The Shopping page lets you create and manage shopping lists. Add items with quantities and categories. Check items off as you shop. Create multiple lists for different stores or purposes. Lists sync across devices.',
    category: 'Shopping',
    keywords: ['shopping', 'list', 'grocery', 'items', 'buy'],
  },
  {
    id: 'share-lists',
    question: 'Can I share lists with others?',
    answer: 'Yes, you can share shopping lists with roommates or friends. Click the share button on any list to generate a link. Shared users can view and check off items in real-time. Manage sharing permissions in list settings.',
    category: 'Shopping',
    keywords: ['share', 'collaborate', 'roommate', 'together', 'list'],
  },

  // Account
  {
    id: 'change-email',
    question: 'How do I change my email address?',
    answer: 'Go to Settings > Account > Email. Enter your new email address and confirm with your password. We\'ll send a verification link to your new email. Your old email will still work until you verify the new one.',
    category: 'Account',
    keywords: ['email', 'change', 'update', 'address', 'account'],
  },
  {
    id: 'two-factor-auth',
    question: 'How do I enable two-factor authentication?',
    answer: 'Go to Settings > Account > Security. Click "Enable 2FA" and scan the QR code with your authenticator app (Google Authenticator, Authy, etc.). Save your backup codes in a safe place in case you lose access to your authenticator.',
    category: 'Account',
    keywords: ['2fa', 'two factor', 'security', 'authenticator', 'mfa'],
  },
  {
    id: 'multiple-colleges',
    question: 'Can I track multiple colleges or semesters?',
    answer: 'Yes! You can add courses from different semesters or even different schools. Use the semester/term selector to filter your view. Archive old semesters to keep your current view clean while preserving historical data.',
    category: 'Account',
    keywords: ['multiple', 'semester', 'college', 'school', 'term'],
  },

  // Integrations
  {
    id: 'canvas-integration',
    question: 'Can I connect to Canvas LMS?',
    answer: 'Yes, College Orbit can import assignments from Canvas. Go to Settings > Integrations > Canvas. Enter your Canvas URL and API token. Assignments will sync automatically. Note: Canvas integration requires your institution to allow API access.',
    category: 'Integrations',
    keywords: ['canvas', 'lms', 'integration', 'import', 'sync', 'api'],
  },
  {
    id: 'google-integration',
    question: 'What Google integrations are available?',
    answer: 'You can connect Google Calendar to sync events both ways, Google Drive to attach files to notes and exams, and sign in with Google for easy authentication. Go to Settings > Integrations to connect your Google account.',
    category: 'Integrations',
    keywords: ['google', 'calendar', 'drive', 'integration', 'connect'],
  },

  // Tips & Best Practices
  {
    id: 'getting-organized',
    question: 'Tips for staying organized?',
    answer: 'Best practices: 1) Add all courses at the start of the semester, 2) Enter assignments as soon as they\'re announced, 3) Review your calendar weekly, 4) Use consistent naming conventions, 5) Set reminders 1-2 days before deadlines, 6) Check off completed items daily.',
    category: 'Tips',
    keywords: ['tips', 'organize', 'best practices', 'advice', 'help'],
  },
  {
    id: 'productivity-tips',
    question: 'How can I be more productive with College Orbit?',
    answer: 'Productivity tips: 1) Use keyboard shortcuts for speed, 2) Set up default reminder times, 3) Use the Pomodoro timer for focused study, 4) Review your progress weekly, 5) Keep notes linked to courses, 6) Use tags to cross-reference related items.',
    category: 'Tips',
    keywords: ['productive', 'efficient', 'tips', 'workflow', 'better'],
  },

  // Additional Getting Started
  {
    id: 'first-time-setup',
    question: 'What should I do when I first sign up?',
    answer: 'After signing up: 1) Complete the onboarding tutorial to learn the basics, 2) Add your current semester courses, 3) Set up your class schedule, 4) Add any upcoming deadlines or exams, 5) Customize your theme and preferences in Settings, 6) Enable notifications so you don\'t miss deadlines.',
    category: 'Getting Started',
    keywords: ['first', 'new', 'setup', 'start', 'begin', 'onboarding'],
  },
  {
    id: 'navigation-basics',
    question: 'How do I navigate around the app?',
    answer: 'Use the sidebar on the left to switch between pages (Courses, Deadlines, Calendar, etc.). On mobile, tap the menu icon to open the sidebar. You can also use keyboard shortcuts: press "?" to see all shortcuts, "/" for search, or letter keys like "C" for courses.',
    category: 'Getting Started',
    keywords: ['navigate', 'sidebar', 'menu', 'pages', 'move around'],
  },
  {
    id: 'quick-actions',
    question: 'What are quick actions?',
    answer: 'Quick actions let you create items from anywhere in the app. Press "N" or click the "+" button to open the quick action menu. From there, you can quickly add a deadline, note, event, or exam without navigating to the specific page first.',
    category: 'Getting Started',
    keywords: ['quick', 'action', 'shortcut', 'fast', 'add', 'create'],
  },
  {
    id: 'demo-data',
    question: 'What is the demo data?',
    answer: 'When you first sign up, you can choose to load demo data which populates your account with sample courses, deadlines, and notes. This helps you explore the app\'s features before adding your own data. You can clear demo data anytime from Settings > Data.',
    category: 'Getting Started',
    keywords: ['demo', 'sample', 'example', 'test', 'try'],
  },

  // Additional Courses
  {
    id: 'course-credits',
    question: 'How do I track course credits?',
    answer: 'When adding a course, you can specify the number of credits/units. This is used for GPA calculations and workload tracking. The total credits for all your courses appear on your dashboard.',
    category: 'Courses',
    keywords: ['credits', 'units', 'hours', 'workload'],
  },
  {
    id: 'course-professor',
    question: 'How do I add professor information?',
    answer: 'When creating or editing a course, add your professor\'s name, email, and office hours. This information appears on the course detail page for quick reference during the semester.',
    category: 'Courses',
    keywords: ['professor', 'instructor', 'teacher', 'office hours', 'email'],
  },
  {
    id: 'course-location',
    question: 'How do I set course locations?',
    answer: 'Add building and room numbers when creating a course. For courses with different locations on different days (like lab vs lecture), you can add multiple schedule entries with different locations.',
    category: 'Courses',
    keywords: ['location', 'building', 'room', 'where', 'classroom'],
  },
  {
    id: 'course-syllabus',
    question: 'Can I attach a syllabus to a course?',
    answer: 'Yes, you can attach files including your syllabus to any course. Go to the course detail page and click "Add Attachment" or drag and drop files. Common formats like PDF, DOCX, and images are supported.',
    category: 'Courses',
    keywords: ['syllabus', 'attach', 'file', 'upload', 'document'],
  },
  {
    id: 'course-grading',
    question: 'How do I track my grade in a course?',
    answer: 'Each course has a grade tracking section where you can enter assignment grades, exam scores, and weights. The app calculates your current grade and predicts your final grade based on remaining assignments.',
    category: 'Courses',
    keywords: ['grade', 'score', 'percentage', 'track', 'weight'],
  },
  {
    id: 'duplicate-course',
    question: 'Can I duplicate a course from a previous semester?',
    answer: 'Yes! When creating a new course, you can choose to duplicate an existing one. This copies the course name, color, and structure but starts fresh with no deadlines. Great for courses that span multiple semesters.',
    category: 'Courses',
    keywords: ['duplicate', 'copy', 'clone', 'repeat', 'same'],
  },

  // Additional Calendar
  {
    id: 'calendar-colors',
    question: 'How do calendar colors work?',
    answer: 'Events inherit colors from their associated courses. Personal events (not linked to a course) use a default color you can customize. This color-coding helps you quickly see which course each event belongs to.',
    category: 'Calendar',
    keywords: ['color', 'calendar', 'visual', 'identify'],
  },
  {
    id: 'recurring-events',
    question: 'How do I create recurring events?',
    answer: 'When adding an event, enable "Repeat" and choose the frequency: daily, weekly, biweekly, monthly, or custom. Set an end date or number of occurrences. Edit individual instances or the entire series later.',
    category: 'Calendar',
    keywords: ['recurring', 'repeat', 'weekly', 'regular', 'series'],
  },
  {
    id: 'calendar-conflicts',
    question: 'Does the calendar show scheduling conflicts?',
    answer: 'Yes, overlapping events are displayed side-by-side in the calendar view. The app can also warn you when creating an event that conflicts with an existing one, helping you avoid double-booking.',
    category: 'Calendar',
    keywords: ['conflict', 'overlap', 'double book', 'clash', 'warning'],
  },
  {
    id: 'all-day-events',
    question: 'How do I create all-day events?',
    answer: 'When adding an event, toggle "All Day" to create an event without specific start/end times. All-day events appear at the top of the day in calendar views. Perfect for holidays, deadlines, or day-long activities.',
    category: 'Calendar',
    keywords: ['all day', 'full day', 'no time', 'holiday'],
  },
  {
    id: 'calendar-print',
    question: 'Can I print my calendar?',
    answer: 'Yes, use the print option in the calendar menu to generate a printable version. Choose the date range and which details to include. You can also export to PDF for sharing or offline reference.',
    category: 'Calendar',
    keywords: ['print', 'pdf', 'export', 'paper', 'physical'],
  },
  {
    id: 'timezone',
    question: 'How do timezones work?',
    answer: 'The app uses your device\'s timezone by default. You can set a specific timezone in Settings if needed. When traveling, events adjust automatically, or you can keep them in your home timezone.',
    category: 'Calendar',
    keywords: ['timezone', 'time zone', 'travel', 'local time'],
  },

  // Additional Deadlines
  {
    id: 'deadline-description',
    question: 'Can I add detailed descriptions to deadlines?',
    answer: 'Yes, each deadline has a description field where you can add assignment instructions, links to resources, grading rubrics, or any other relevant information. The description supports basic formatting.',
    category: 'Deadlines',
    keywords: ['description', 'details', 'instructions', 'notes', 'info'],
  },
  {
    id: 'deadline-subtasks',
    question: 'Can I break a deadline into subtasks?',
    answer: 'Yes! Add subtasks to any deadline to break it into smaller steps. Check off subtasks as you complete them, and the main deadline shows your progress. Great for large projects or multi-part assignments.',
    category: 'Deadlines',
    keywords: ['subtask', 'checklist', 'steps', 'break down', 'parts'],
  },
  {
    id: 'deadline-time',
    question: 'How do I set specific due times?',
    answer: 'When adding a deadline, you can set both a date and time. If no time is set, the deadline defaults to 11:59 PM. For classes with specific submission times (like "before class"), set the exact time.',
    category: 'Deadlines',
    keywords: ['time', 'due', 'when', 'hour', 'minute', 'submit'],
  },
  {
    id: 'filter-deadlines',
    question: 'How do I filter and sort deadlines?',
    answer: 'Use the filter options on the Deadlines page to show only certain courses, priority levels, or date ranges. Sort by due date, priority, course, or date added. Filters persist until you clear them.',
    category: 'Deadlines',
    keywords: ['filter', 'sort', 'show', 'hide', 'organize'],
  },
  {
    id: 'deadline-bulk-actions',
    question: 'Can I edit multiple deadlines at once?',
    answer: 'Yes, use bulk actions to modify multiple deadlines simultaneously. Select deadlines using checkboxes, then choose actions like complete, delete, change priority, or reschedule. Saves time during busy periods.',
    category: 'Deadlines',
    keywords: ['bulk', 'multiple', 'batch', 'many', 'several'],
  },
  {
    id: 'deadline-links',
    question: 'Can I add links to deadlines?',
    answer: 'Yes, add URLs to assignment pages, submission portals, or resources directly on the deadline. Click the link icon when editing a deadline. Links open in a new tab when clicked.',
    category: 'Deadlines',
    keywords: ['link', 'url', 'website', 'submission', 'portal'],
  },

  // Additional Exams
  {
    id: 'exam-location',
    question: 'How do I set exam locations?',
    answer: 'When adding an exam, specify the building and room. For exams in different locations than your regular class, this ensures you know exactly where to go. The location appears on your calendar event.',
    category: 'Exams',
    keywords: ['location', 'room', 'building', 'where', 'venue'],
  },
  {
    id: 'exam-duration',
    question: 'How do I set exam duration?',
    answer: 'Enter the exam duration when creating it. This helps with calendar blocking and study planning. The end time is calculated automatically based on start time and duration.',
    category: 'Exams',
    keywords: ['duration', 'length', 'how long', 'hours', 'time'],
  },
  {
    id: 'exam-type',
    question: 'What exam types are supported?',
    answer: 'You can categorize exams as Quiz, Midterm, Final, or Custom. This helps with filtering and lets you track different types of assessments separately in your progress statistics.',
    category: 'Exams',
    keywords: ['type', 'quiz', 'midterm', 'final', 'category'],
  },
  {
    id: 'exam-weight',
    question: 'How do exam weights work?',
    answer: 'Set the percentage weight of each exam toward your final grade. This is used for grade predictions and helps prioritize studying for higher-weight exams.',
    category: 'Exams',
    keywords: ['weight', 'percentage', 'grade', 'worth', 'points'],
  },
  {
    id: 'exam-score',
    question: 'How do I record my exam score?',
    answer: 'After taking an exam, edit it to add your score. Enter the points earned and total possible points. This updates your course grade and tracks your exam performance over time.',
    category: 'Exams',
    keywords: ['score', 'grade', 'result', 'points', 'mark'],
  },
  {
    id: 'study-schedule',
    question: 'Can College Orbit create a study schedule for exams?',
    answer: 'Yes! The study planner feature can generate a study schedule based on your exam dates and available time. It distributes study sessions across days leading up to each exam.',
    category: 'Exams',
    keywords: ['study', 'schedule', 'plan', 'prepare', 'automatic'],
  },

  // Additional Notes
  {
    id: 'notes-folders',
    question: 'How do I organize notes into folders?',
    answer: 'Create folders from the Notes page sidebar. Drag and drop notes into folders or select a folder when creating a new note. You can nest folders for complex organization structures.',
    category: 'Notes',
    keywords: ['folder', 'organize', 'category', 'group', 'nest'],
  },
  {
    id: 'notes-tags',
    question: 'How do tags work in notes?',
    answer: 'Add tags to notes for cross-referencing. Type "#" followed by a tag name, or use the tag menu. Click any tag to see all notes with that tag. Tags work across folders and courses.',
    category: 'Notes',
    keywords: ['tag', 'hashtag', 'label', 'cross-reference', 'find'],
  },
  {
    id: 'notes-images',
    question: 'Can I add images to notes?',
    answer: 'Yes, paste images directly into notes or use the image button to upload. Images are stored securely and can be resized within the note. Great for diagrams, screenshots, or handwritten content.',
    category: 'Notes',
    keywords: ['image', 'picture', 'photo', 'screenshot', 'diagram'],
  },
  {
    id: 'notes-code',
    question: 'How do I add code blocks to notes?',
    answer: 'Use triple backticks (```) to create code blocks, or click the code button in the toolbar. Specify the programming language for syntax highlighting. Inline code uses single backticks.',
    category: 'Notes',
    keywords: ['code', 'programming', 'syntax', 'highlight', 'block'],
  },
  {
    id: 'notes-math',
    question: 'Can I write math equations in notes?',
    answer: 'Yes, College Orbit supports LaTeX math notation. Wrap equations in $ for inline math or $$ for display math. The equation renders automatically as you type. Perfect for STEM courses.',
    category: 'Notes',
    keywords: ['math', 'equation', 'latex', 'formula', 'stem'],
  },
  {
    id: 'notes-templates',
    question: 'Are there note templates?',
    answer: 'Yes, use templates for common note types like lecture notes, meeting notes, or study guides. Access templates when creating a new note, or save your own notes as custom templates.',
    category: 'Notes',
    keywords: ['template', 'preset', 'format', 'structure', 'starting'],
  },
  {
    id: 'notes-link-course',
    question: 'How do I link notes to courses?',
    answer: 'When creating or editing a note, select the associated course from the dropdown. Linked notes appear on the course detail page and can be filtered by course on the Notes page.',
    category: 'Notes',
    keywords: ['link', 'course', 'associate', 'connect', 'attach'],
  },
  {
    id: 'notes-share',
    question: 'Can I share notes with classmates?',
    answer: 'Yes, click the share button on any note to generate a shareable link. Choose whether viewers can only read or also edit. Great for study groups or sharing lecture notes.',
    category: 'Notes',
    keywords: ['share', 'collaborate', 'classmate', 'link', 'send'],
  },
  {
    id: 'notes-version-history',
    question: 'Is there version history for notes?',
    answer: 'Yes, notes automatically save versions as you edit. Access version history from the note menu to see previous versions, compare changes, or restore an older version.',
    category: 'Notes',
    keywords: ['version', 'history', 'previous', 'restore', 'undo'],
  },

  // Additional Progress
  {
    id: 'weekly-review',
    question: 'What is the weekly review?',
    answer: 'The weekly review summarizes your accomplishments: tasks completed, study time logged, and progress made. It appears at the end of each week and helps you reflect on your productivity.',
    category: 'Progress',
    keywords: ['weekly', 'review', 'summary', 'reflection', 'accomplished'],
  },
  {
    id: 'study-time-tracking',
    question: 'How do I track study time?',
    answer: 'Use the timer on any task or study session to track time. The Pomodoro timer also logs time. View your study hours per course, per day, or per week on the Progress page.',
    category: 'Progress',
    keywords: ['time', 'track', 'hours', 'study', 'log'],
  },
  {
    id: 'completion-rate',
    question: 'What is the completion rate?',
    answer: 'Your completion rate shows the percentage of deadlines you\'ve completed on time vs. total deadlines. A higher rate indicates better time management. View rates per course or overall.',
    category: 'Progress',
    keywords: ['completion', 'rate', 'percentage', 'on time', 'metric'],
  },
  {
    id: 'goals',
    question: 'Can I set goals?',
    answer: 'Yes, set weekly goals for tasks completed, study hours, or other metrics. Track your progress toward goals on the dashboard. Completing goals contributes to achievements.',
    category: 'Progress',
    keywords: ['goal', 'target', 'objective', 'aim', 'set'],
  },
  {
    id: 'leaderboard',
    question: 'Is there a leaderboard or competition?',
    answer: 'You can optionally join study groups with friends and see anonymous leaderboards for motivation. Compare streaks, completion rates, or study time. This feature is entirely opt-in for privacy.',
    category: 'Progress',
    keywords: ['leaderboard', 'compete', 'friends', 'compare', 'rank'],
  },

  // Additional Settings
  {
    id: 'college-colors',
    question: 'How do I set my college colors?',
    answer: 'Go to Settings > Appearance > College Colors. Search for your college or enter custom colors. Your college colors become the app\'s accent color throughout the interface.',
    category: 'Settings',
    keywords: ['college', 'school', 'color', 'theme', 'brand'],
  },
  {
    id: 'font-size',
    question: 'Can I change the font size?',
    answer: 'Yes, adjust text size in Settings > Appearance. Choose from small, medium, or large text. This affects all text throughout the app for better readability.',
    category: 'Settings',
    keywords: ['font', 'size', 'text', 'big', 'small', 'readable'],
  },
  {
    id: 'start-of-week',
    question: 'Can I change the start of the week?',
    answer: 'Yes, choose whether your week starts on Sunday or Monday in Settings > Preferences. This affects calendar views and weekly statistics.',
    category: 'Settings',
    keywords: ['week', 'start', 'sunday', 'monday', 'calendar'],
  },
  {
    id: 'date-format',
    question: 'How do I change the date format?',
    answer: 'Go to Settings > Preferences to choose your preferred date format (MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD). The format is used throughout the app.',
    category: 'Settings',
    keywords: ['date', 'format', 'mm/dd', 'dd/mm', 'order'],
  },
  {
    id: 'time-format',
    question: 'Can I switch between 12-hour and 24-hour time?',
    answer: 'Yes, choose your preferred time format in Settings > Preferences. Select 12-hour (AM/PM) or 24-hour format. This affects all times displayed in the app.',
    category: 'Settings',
    keywords: ['time', 'format', '12 hour', '24 hour', 'am pm'],
  },
  {
    id: 'sidebar-collapsed',
    question: 'Can I collapse the sidebar?',
    answer: 'Yes, click the collapse button at the bottom of the sidebar to minimize it. This gives you more screen space for content. Click again or hover to expand.',
    category: 'Settings',
    keywords: ['sidebar', 'collapse', 'minimize', 'hide', 'space'],
  },
  {
    id: 'dense-mode',
    question: 'What is dense mode?',
    answer: 'Dense mode reduces spacing throughout the app, showing more information on screen. Enable it in Settings > Appearance. Great for power users or smaller screens.',
    category: 'Settings',
    keywords: ['dense', 'compact', 'space', 'smaller', 'tight'],
  },

  // Additional Privacy & Data
  {
    id: 'data-encryption',
    question: 'Is my data encrypted?',
    answer: 'Yes, all data is encrypted in transit (HTTPS) and at rest on our servers. We use industry-standard AES-256 encryption. Your password is hashed and never stored in plain text.',
    category: 'Privacy & Data',
    keywords: ['encryption', 'secure', 'safe', 'protected', 'aes'],
  },
  {
    id: 'data-location',
    question: 'Where are the servers located?',
    answer: 'Our servers are located in the United States with data centers that comply with SOC 2 standards. We do not transfer data outside of secure, compliant facilities.',
    category: 'Privacy & Data',
    keywords: ['server', 'location', 'where', 'hosted', 'country'],
  },
  {
    id: 'cookies',
    question: 'What cookies does College Orbit use?',
    answer: 'We use essential cookies for authentication and preferences. No third-party advertising cookies are used. You can manage cookie preferences in Settings > Privacy.',
    category: 'Privacy & Data',
    keywords: ['cookies', 'tracking', 'advertising', 'privacy'],
  },
  {
    id: 'analytics',
    question: 'What analytics data is collected?',
    answer: 'We collect anonymous usage analytics to improve the app (pages visited, features used). No personal data or content is included. You can opt out of analytics in Settings > Privacy.',
    category: 'Privacy & Data',
    keywords: ['analytics', 'tracking', 'data', 'collected', 'opt out'],
  },
  {
    id: 'data-retention',
    question: 'How long is my data kept?',
    answer: 'Your data is kept as long as your account is active. After account deletion, data is permanently removed within 30 days. Backups are purged according to our retention policy.',
    category: 'Privacy & Data',
    keywords: ['retention', 'keep', 'store', 'how long', 'delete'],
  },
  {
    id: 'third-party-access',
    question: 'Do third parties have access to my data?',
    answer: 'No. We never sell or share your personal data with third parties. The only exceptions are service providers essential to running the app (hosting, email) who are bound by strict privacy agreements.',
    category: 'Privacy & Data',
    keywords: ['third party', 'share', 'sell', 'access', 'who'],
  },

  // Additional Subscription
  {
    id: 'payment-methods',
    question: 'What payment methods are accepted?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay. All payments are processed securely through Stripe.',
    category: 'Subscription',
    keywords: ['payment', 'credit card', 'paypal', 'pay', 'method'],
  },
  {
    id: 'billing-cycle',
    question: 'How does billing work?',
    answer: 'Choose monthly or annual billing. Annual billing offers a discount equivalent to 2 free months. You\'re billed at the start of each cycle, and can view invoices in Settings > Subscription.',
    category: 'Subscription',
    keywords: ['billing', 'cycle', 'monthly', 'annual', 'invoice'],
  },
  {
    id: 'refund-policy',
    question: 'What is the refund policy?',
    answer: 'We offer a 14-day money-back guarantee for new subscribers. If you\'re not satisfied, contact support for a full refund within 14 days of your first payment.',
    category: 'Subscription',
    keywords: ['refund', 'money back', 'cancel', 'return', 'guarantee'],
  },
  {
    id: 'upgrade-downgrade',
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, change your plan anytime in Settings > Subscription. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing period.',
    category: 'Subscription',
    keywords: ['upgrade', 'downgrade', 'change', 'plan', 'switch'],
  },
  {
    id: 'free-trial',
    question: 'Is there a free trial?',
    answer: 'Yes, new users get a 14-day free trial of premium features. No credit card required to start. At the end of the trial, you can subscribe or continue with the free tier.',
    category: 'Subscription',
    keywords: ['trial', 'free', 'try', 'test', '14 day'],
  },
  {
    id: 'team-plans',
    question: 'Are there team or group plans?',
    answer: 'Yes, we offer discounted group plans for study groups, clubs, or organizations. Contact support for group pricing with 5 or more members.',
    category: 'Subscription',
    keywords: ['team', 'group', 'organization', 'multiple', 'discount'],
  },

  // Additional Troubleshooting
  {
    id: 'clear-cache',
    question: 'How do I clear the app cache?',
    answer: 'Go to Settings > Data > Clear Cache to remove temporary files. This can fix display issues or free up space. Your data is not affected. Alternatively, clear your browser cache.',
    category: 'Troubleshooting',
    keywords: ['cache', 'clear', 'temporary', 'storage', 'reset'],
  },
  {
    id: 'slow-performance',
    question: 'The app is running slowly',
    answer: 'Try: 1) Clear the app cache, 2) Close unused browser tabs, 3) Disable browser extensions, 4) Check your internet speed, 5) Try a different browser. Large amounts of data may also slow the app.',
    category: 'Troubleshooting',
    keywords: ['slow', 'lag', 'performance', 'speed', 'fast'],
  },
  {
    id: 'login-issues',
    question: 'I can\'t log in to my account',
    answer: 'Try: 1) Check your email and password, 2) Use "Forgot Password" to reset, 3) Clear browser cookies, 4) Try incognito/private mode, 5) Check if Caps Lock is on. Contact support if issues persist.',
    category: 'Troubleshooting',
    keywords: ['login', 'sign in', 'access', 'password', 'locked'],
  },
  {
    id: 'missing-data',
    question: 'Some of my data is missing',
    answer: 'First, check if you\'re logged into the correct account. Then try refreshing the page. Check if filters are hiding items. If data is truly missing, contact support immediately - we may be able to restore from backups.',
    category: 'Troubleshooting',
    keywords: ['missing', 'lost', 'gone', 'disappeared', 'data'],
  },
  {
    id: 'error-messages',
    question: 'I\'m getting an error message',
    answer: 'Note the exact error message and when it occurs. Try refreshing the page. If the error persists, clear your cache and try again. Contact support with the error details for further help.',
    category: 'Troubleshooting',
    keywords: ['error', 'message', 'wrong', 'failed', 'issue'],
  },
  {
    id: 'feature-not-working',
    question: 'A feature isn\'t working as expected',
    answer: 'First, make sure you\'re using the feature correctly by checking this help page. Try refreshing or using a different browser. If it\'s still not working, report the issue to support with steps to reproduce.',
    category: 'Troubleshooting',
    keywords: ['feature', 'broken', 'bug', 'not working', 'issue'],
  },
  {
    id: 'browser-support',
    question: 'Which browsers are supported?',
    answer: 'College Orbit works best on modern browsers: Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated. Internet Explorer is not supported.',
    category: 'Troubleshooting',
    keywords: ['browser', 'chrome', 'firefox', 'safari', 'edge', 'support'],
  },

  // Additional Mobile & Extensions
  {
    id: 'pwa-features',
    question: 'What PWA features are available?',
    answer: 'As a Progressive Web App, College Orbit can be installed on your device, works offline (limited), sends push notifications, and runs in its own window like a native app.',
    category: 'Mobile & Extensions',
    keywords: ['pwa', 'install', 'native', 'app', 'progressive'],
  },
  {
    id: 'mobile-notifications',
    question: 'How do I get notifications on mobile?',
    answer: 'After adding College Orbit to your home screen, enable notifications when prompted. On iOS, notifications require iOS 16.4+ and the app must be added to home screen.',
    category: 'Mobile & Extensions',
    keywords: ['mobile', 'notification', 'push', 'alert', 'phone'],
  },
  {
    id: 'widget',
    question: 'Is there a home screen widget?',
    answer: 'When installed as a PWA, some devices support widgets showing upcoming deadlines. Widget availability depends on your device and operating system version.',
    category: 'Mobile & Extensions',
    keywords: ['widget', 'home screen', 'quick view', 'shortcut'],
  },
  {
    id: 'extension-features',
    question: 'What can the browser extension do?',
    answer: 'The extension lets you: quickly add deadlines from any webpage, save links as notes, view upcoming deadlines in a popup, and get deadline notifications. It syncs with your account automatically.',
    category: 'Mobile & Extensions',
    keywords: ['extension', 'features', 'what', 'can', 'popup'],
  },
  {
    id: 'extension-install',
    question: 'How do I install the browser extension?',
    answer: 'Visit the Chrome Web Store and search for "College Orbit" or click the extension link in Settings > Integrations. Click "Add to Chrome" and sign in with your College Orbit account.',
    category: 'Mobile & Extensions',
    keywords: ['install', 'extension', 'chrome', 'add', 'download'],
  },

  // Additional Tools
  {
    id: 'flashcards',
    question: 'How do I use flashcards?',
    answer: 'Create flashcard decks from the Tools page. Each deck can be linked to a course for organization. Add cards with front (question) and back (answer) content. When studying, the app uses spaced repetition (SM-2 algorithm) to show cards at optimal intervals—cards you struggle with appear more often, while mastered cards appear less frequently. Rate your recall (Again, Hard, Good, Easy) to adjust the schedule. Track mastery progress for each deck.',
    category: 'Tools',
    keywords: ['flashcard', 'study', 'memorize', 'cards', 'deck', 'spaced repetition'],
  },
  {
    id: 'citation-generator',
    question: 'How does the citation generator work?',
    answer: 'Enter source details manually (author, title, publication date, URL, etc.) and select your citation style (APA 7th, MLA 9th, Chicago, Harvard, IEEE, or Vancouver). The generator creates properly formatted citations and references. Copy individual citations or your entire bibliography to clipboard.',
    category: 'Tools',
    keywords: ['citation', 'reference', 'bibliography', 'apa', 'mla', 'chicago'],
  },
  {
    id: 'word-counter',
    question: 'Where is the word counter?',
    answer: 'Find the word counter in the Tools page. Paste or type any text to get detailed statistics: word count, character count (with and without spaces), sentence count, paragraph count, and estimated reading time. Great for essays, papers, and meeting assignment length requirements.',
    category: 'Tools',
    keywords: ['word', 'count', 'counter', 'length', 'characters', 'reading time'],
  },
  {
    id: 'unit-converter',
    question: 'Is there a unit converter?',
    answer: 'Yes, the unit converter in Tools handles conversions across multiple categories: length (meters, feet, inches, miles), weight/mass (kg, lbs, oz), temperature (Celsius, Fahrenheit, Kelvin), volume (liters, gallons, cups), area, speed, time, and data storage. Useful for science, engineering, and cooking conversions.',
    category: 'Tools',
    keywords: ['unit', 'convert', 'metric', 'imperial', 'measurement', 'temperature'],
  },
  {
    id: 'calculator',
    question: 'Is there a built-in calculator?',
    answer: 'Yes, access the calculator from Tools. It supports basic operations, scientific functions, and can store previous calculations. Use keyboard input for fast calculations.',
    category: 'Tools',
    keywords: ['calculator', 'math', 'compute', 'numbers', 'scientific'],
  },

  // Additional Shopping
  {
    id: 'shopping-categories',
    question: 'How do I organize shopping items by category?',
    answer: 'When adding items, assign them to categories like Groceries, School Supplies, Household, etc. Items are grouped by category in your list, making shopping more efficient.',
    category: 'Shopping',
    keywords: ['category', 'organize', 'group', 'section', 'type'],
  },
  {
    id: 'shopping-prices',
    question: 'Can I track prices in shopping lists?',
    answer: 'Yes, add estimated prices to items. The list shows a running total. After shopping, update with actual prices to track spending. View spending history over time.',
    category: 'Shopping',
    keywords: ['price', 'cost', 'budget', 'spending', 'money'],
  },
  {
    id: 'shopping-recurring',
    question: 'Can I create recurring shopping items?',
    answer: 'Yes, mark items as recurring so they reappear on your list at set intervals (weekly, monthly, etc.). Perfect for regular purchases like groceries or household supplies.',
    category: 'Shopping',
    keywords: ['recurring', 'repeat', 'regular', 'automatic', 'weekly'],
  },
  {
    id: 'shopping-multiple-lists',
    question: 'Can I have multiple shopping lists?',
    answer: 'Yes, create separate lists for different stores, purposes, or time periods. Switch between lists easily. Great for separating groceries from school supplies.',
    category: 'Shopping',
    keywords: ['multiple', 'lists', 'separate', 'different', 'stores'],
  },

  // Additional Account
  {
    id: 'change-password',
    question: 'How do I change my password?',
    answer: 'Go to Settings > Account > Password. Enter your current password and your new password twice to confirm. Use a strong password with letters, numbers, and symbols.',
    category: 'Account',
    keywords: ['password', 'change', 'update', 'security', 'new'],
  },
  {
    id: 'profile-picture',
    question: 'How do I change my profile picture?',
    answer: 'Go to Settings > Account and click on your profile picture. Upload a new image or choose from your recent photos. Images are cropped to a circle automatically.',
    category: 'Account',
    keywords: ['profile', 'picture', 'avatar', 'photo', 'image'],
  },
  {
    id: 'display-name',
    question: 'How do I change my display name?',
    answer: 'Go to Settings > Account > Profile. Edit your display name which appears throughout the app. This is different from your username used for login.',
    category: 'Account',
    keywords: ['name', 'display', 'change', 'username', 'profile'],
  },
  {
    id: 'connected-accounts',
    question: 'How do I manage connected accounts?',
    answer: 'Go to Settings > Account > Connected Accounts to see services linked to your account (Google, Apple, etc.). You can connect new accounts or disconnect existing ones.',
    category: 'Account',
    keywords: ['connected', 'linked', 'google', 'apple', 'social'],
  },
  {
    id: 'sessions',
    question: 'How do I view active sessions?',
    answer: 'Go to Settings > Account > Sessions to see all devices logged into your account. You can see device type, location, and last active time. Sign out of any suspicious sessions.',
    category: 'Account',
    keywords: ['sessions', 'devices', 'logged in', 'active', 'security'],
  },
  {
    id: 'backup-codes',
    question: 'What are backup codes?',
    answer: 'Backup codes let you access your account if you lose your 2FA device. When enabling 2FA, save your backup codes securely. Each code can only be used once.',
    category: 'Account',
    keywords: ['backup', 'codes', '2fa', 'recovery', 'access'],
  },

  // Additional Integrations
  {
    id: 'blackboard-integration',
    question: 'Can I connect to Blackboard?',
    answer: 'Blackboard integration is available for supported institutions. Go to Settings > Integrations > Blackboard. Enter your school\'s Blackboard URL and credentials to sync assignments.',
    category: 'Integrations',
    keywords: ['blackboard', 'lms', 'integration', 'sync', 'school'],
  },
  {
    id: 'notion-integration',
    question: 'Can I sync with Notion?',
    answer: 'Yes, connect your Notion account to import pages as notes or export College Orbit notes to Notion. Go to Settings > Integrations > Notion to set up the connection.',
    category: 'Integrations',
    keywords: ['notion', 'sync', 'import', 'export', 'notes'],
  },
  {
    id: 'todoist-integration',
    question: 'Can I sync with Todoist?',
    answer: 'Yes, connect Todoist to sync tasks both ways. Deadlines in College Orbit appear in Todoist and vice versa. Configure sync settings in Settings > Integrations > Todoist.',
    category: 'Integrations',
    keywords: ['todoist', 'sync', 'tasks', 'integration', 'todo'],
  },
  {
    id: 'slack-integration',
    question: 'Is there Slack integration?',
    answer: 'Yes, connect Slack to receive deadline reminders and notifications in your Slack workspace. Great for study group channels. Set up in Settings > Integrations > Slack.',
    category: 'Integrations',
    keywords: ['slack', 'notification', 'team', 'channel', 'message'],
  },
  {
    id: 'zapier-integration',
    question: 'Can I use Zapier with College Orbit?',
    answer: 'Yes, our Zapier integration lets you connect College Orbit with thousands of other apps. Create automated workflows like adding deadlines from emails or posting completions to social media.',
    category: 'Integrations',
    keywords: ['zapier', 'automation', 'workflow', 'connect', 'apps'],
  },
  {
    id: 'api-access',
    question: 'Is there an API?',
    answer: 'Yes, premium users can access the College Orbit API to build custom integrations. Find API documentation and generate API keys in Settings > Integrations > API.',
    category: 'Integrations',
    keywords: ['api', 'developer', 'integration', 'custom', 'programming'],
  },

  // Additional Tips
  {
    id: 'study-tips',
    question: 'Tips for effective studying?',
    answer: 'Study tips: 1) Use the Pomodoro timer (25 min focus, 5 min break), 2) Review notes within 24 hours of class, 3) Create flashcards for memorization, 4) Study in the same place regularly, 5) Get enough sleep before exams.',
    category: 'Tips',
    keywords: ['study', 'effective', 'learn', 'remember', 'tips'],
  },
  {
    id: 'exam-prep-tips',
    question: 'How should I prepare for exams?',
    answer: 'Exam prep tips: 1) Start studying at least a week early, 2) Create a study schedule, 3) Review past exams if available, 4) Form study groups, 5) Get good sleep the night before, 6) Eat well and stay hydrated.',
    category: 'Tips',
    keywords: ['exam', 'prepare', 'study', 'test', 'tips'],
  },
  {
    id: 'time-management-tips',
    question: 'Tips for better time management?',
    answer: 'Time management tips: 1) Plan your week every Sunday, 2) Prioritize tasks using the priority feature, 3) Break large tasks into subtasks, 4) Use time blocking on your calendar, 5) Review and adjust your schedule daily.',
    category: 'Tips',
    keywords: ['time', 'management', 'schedule', 'plan', 'organize'],
  },
  {
    id: 'note-taking-tips',
    question: 'Tips for better note-taking?',
    answer: 'Note-taking tips: 1) Use headings to organize topics, 2) Write in your own words, 3) Include examples, 4) Review and clean up notes after class, 5) Link related notes together, 6) Use tags for easy finding later.',
    category: 'Tips',
    keywords: ['notes', 'taking', 'write', 'class', 'lecture'],
  },
  {
    id: 'focus-tips',
    question: 'How do I stay focused while studying?',
    answer: 'Focus tips: 1) Remove phone distractions, 2) Use the Pomodoro timer, 3) Study in a quiet environment, 4) Take regular breaks, 5) Stay hydrated, 6) Set specific goals for each session.',
    category: 'Tips',
    keywords: ['focus', 'concentrate', 'distraction', 'attention', 'study'],
  },
  {
    id: 'group-study-tips',
    question: 'Tips for effective group study?',
    answer: 'Group study tips: 1) Set clear goals for each session, 2) Assign topics to each person to teach, 3) Quiz each other, 4) Stay on topic, 5) Meet regularly at the same time, 6) Share notes using College Orbit.',
    category: 'Tips',
    keywords: ['group', 'study', 'together', 'team', 'collaborate'],
  },

  // Miscellaneous
  {
    id: 'report-bug',
    question: 'How do I report a bug?',
    answer: 'Go to Settings > About > Report Issue, or email support directly. Include: what happened, what you expected, steps to reproduce, your browser/device, and screenshots if possible.',
    category: 'Troubleshooting',
    keywords: ['bug', 'report', 'issue', 'problem', 'feedback'],
  },
  {
    id: 'feature-request',
    question: 'How do I request a new feature?',
    answer: 'We love feedback! Send feature requests to our support email or use the feedback form in Settings > About. Popular requests are prioritized for future updates.',
    category: 'Troubleshooting',
    keywords: ['feature', 'request', 'suggest', 'idea', 'want'],
  },
  {
    id: 'beta-features',
    question: 'How do I access beta features?',
    answer: 'Go to Settings > Preferences > Beta Features to enable early access to new features. Beta features may be unstable but let you try new functionality first.',
    category: 'Settings',
    keywords: ['beta', 'early access', 'new', 'experimental', 'preview'],
  },
  {
    id: 'release-notes-detail',
    question: 'Where can I see what\'s new?',
    answer: 'Check the Release Notes page (linked in Settings > About) to see all updates, new features, and bug fixes. We update regularly based on user feedback.',
    category: 'Getting Started',
    keywords: ['new', 'update', 'release', 'changelog', 'version'],
  },
  {
    id: 'community',
    question: 'Is there a College Orbit community?',
    answer: 'Join our community Discord server to connect with other students, share tips, get help, and suggest features. Find the invite link in Settings > About > Community.',
    category: 'Getting Started',
    keywords: ['community', 'discord', 'social', 'connect', 'students'],
  },
  {
    id: 'accessibility',
    question: 'What accessibility features are available?',
    answer: 'College Orbit supports: keyboard navigation, screen reader compatibility, adjustable font sizes, high contrast themes, and reduced motion options. Find accessibility settings in Settings > Appearance.',
    category: 'Settings',
    keywords: ['accessibility', 'a11y', 'screen reader', 'keyboard', 'contrast'],
  },
  {
    id: 'language',
    question: 'Can I change the language?',
    answer: 'Currently College Orbit is available in English. Additional language support is planned for future updates. Let us know which languages you\'d like to see!',
    category: 'Settings',
    keywords: ['language', 'translation', 'english', 'spanish', 'other'],
  },
];

const categories = [
  { id: 'Getting Started', icon: HelpCircle },
  { id: 'Courses', icon: BookOpen },
  { id: 'Calendar', icon: Calendar },
  { id: 'Deadlines', icon: CheckSquare },
  { id: 'Exams', icon: FileText },
  { id: 'Notes', icon: FileText },
  { id: 'Progress', icon: Zap },
  { id: 'Settings', icon: Settings },
  { id: 'Privacy & Data', icon: Shield },
  { id: 'Subscription', icon: CreditCard },
  { id: 'Troubleshooting', icon: HelpCircle },
  { id: 'Mobile & Extensions', icon: Download },
  { id: 'Tools', icon: Zap },
  { id: 'Shopping', icon: CheckSquare },
  { id: 'Account', icon: Users },
  { id: 'Integrations', icon: Bell },
  { id: 'Tips', icon: Zap },
];

// Stop words to filter out from search queries
const stopWords = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
  'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
  'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'she', 'it',
  'they', 'them', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
  'am', 'if', 'then', 'because', 'while', 'although', 'though', 'unless',
  'how', 'why', 'when', 'where', 'there', 'here', 'all', 'any', 'each', 'every',
  'some', 'no', 'up', 'out', 'about', 'get', 'got', 'getting',
  'please', 'help', 'want', 'like', 'know', 'think', 'see', 'look', 'make',
]);

// Synonyms mapping for better search matching
const synonyms: Record<string, string[]> = {
  'delete': ['remove', 'erase', 'clear', 'trash', 'discard', 'get rid of'],
  'remove': ['delete', 'erase', 'clear', 'trash', 'discard'],
  'add': ['create', 'new', 'make', 'insert', 'put'],
  'create': ['add', 'new', 'make', 'start'],
  'edit': ['modify', 'change', 'update', 'alter', 'fix'],
  'change': ['edit', 'modify', 'update', 'alter', 'switch'],
  'settings': ['preferences', 'options', 'configuration', 'config', 'setup'],
  'preferences': ['settings', 'options', 'configuration'],
  'course': ['class', 'subject', 'module', 'lecture'],
  'class': ['course', 'subject', 'module', 'lecture'],
  'deadline': ['due date', 'assignment', 'task', 'homework', 'work'],
  'assignment': ['deadline', 'homework', 'task', 'work', 'project'],
  'homework': ['assignment', 'deadline', 'task', 'work'],
  'exam': ['test', 'quiz', 'midterm', 'final', 'assessment'],
  'test': ['exam', 'quiz', 'assessment'],
  'note': ['notes', 'document', 'writing', 'text'],
  'notes': ['note', 'documents', 'writing'],
  'calendar': ['schedule', 'planner', 'events', 'dates'],
  'schedule': ['calendar', 'timetable', 'planner'],
  'notification': ['alert', 'reminder', 'notify', 'push'],
  'reminder': ['notification', 'alert', 'notify'],
  'sync': ['synchronize', 'connect', 'link', 'integrate'],
  'connect': ['sync', 'link', 'integrate', 'attach'],
  'dark': ['night', 'dark mode', 'theme'],
  'light': ['day', 'light mode', 'bright', 'theme'],
  'theme': ['appearance', 'color', 'style', 'dark', 'light'],
  'color': ['colour', 'theme', 'appearance'],
  'export': ['download', 'backup', 'save', 'extract'],
  'import': ['upload', 'load', 'bring in'],
  'download': ['export', 'save', 'get'],
  'upload': ['import', 'attach', 'add file'],
  'password': ['passcode', 'login', 'credential', 'security'],
  'login': ['sign in', 'log in', 'access', 'authenticate'],
  'logout': ['sign out', 'log out', 'exit'],
  'account': ['profile', 'user', 'membership'],
  'profile': ['account', 'user', 'info'],
  'price': ['cost', 'pricing', 'fee', 'payment', 'subscription'],
  'cost': ['price', 'pricing', 'fee', 'payment'],
  'free': ['no cost', 'complimentary', 'gratis'],
  'premium': ['paid', 'pro', 'subscription', 'upgrade'],
  'subscription': ['premium', 'paid', 'plan', 'membership'],
  'cancel': ['stop', 'end', 'terminate', 'unsubscribe'],
  'broken': ['not working', 'bug', 'error', 'issue', 'problem', 'wrong'],
  'error': ['bug', 'problem', 'issue', 'broken', 'wrong', 'fail'],
  'problem': ['issue', 'error', 'bug', 'trouble', 'wrong'],
  'issue': ['problem', 'error', 'bug', 'trouble'],
  'slow': ['lag', 'laggy', 'sluggish', 'performance'],
  'fast': ['quick', 'speed', 'rapid'],
  'phone': ['mobile', 'smartphone', 'cell', 'iphone', 'android'],
  'mobile': ['phone', 'smartphone', 'portable', 'app'],
  'app': ['application', 'program', 'software'],
  'extension': ['addon', 'plugin', 'browser extension', 'chrome'],
  'integrate': ['connect', 'sync', 'link'],
  'timer': ['pomodoro', 'clock', 'countdown', 'stopwatch'],
  'study': ['learn', 'review', 'prepare', 'studying'],
  'gpa': ['grade', 'grades', 'average', 'score'],
  'grade': ['gpa', 'score', 'mark', 'result'],
  'share': ['collaborate', 'send', 'invite'],
  'collaborate': ['share', 'together', 'team', 'group'],
  'folder': ['directory', 'organize', 'category'],
  'tag': ['label', 'hashtag', 'categorize'],
  'search': ['find', 'look for', 'query', 'filter'],
  'find': ['search', 'look for', 'locate'],
  'shortcut': ['hotkey', 'keyboard', 'key', 'quick'],
  'keyboard': ['shortcut', 'hotkey', 'keys', 'typing'],
  '2fa': ['two factor', 'two-factor', 'authentication', 'security', 'mfa'],
  'security': ['safe', 'secure', 'protection', 'privacy', '2fa'],
  'privacy': ['security', 'data', 'personal', 'private'],
  'data': ['information', 'content', 'files', 'stuff'],
  'backup': ['export', 'save', 'copy'],
  'restore': ['recover', 'bring back', 'undo'],
};

// Get all synonyms for a word
const getSynonyms = (word: string): string[] => {
  const result = [word];
  if (synonyms[word]) {
    result.push(...synonyms[word]);
  }
  // Also check if this word is a synonym of another word
  Object.entries(synonyms).forEach(([key, values]) => {
    if (values.includes(word) && !result.includes(key)) {
      result.push(key);
    }
  });
  return result;
};

// Normalize and tokenize a query
const tokenizeQuery = (query: string): string[] => {
  return query
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word));
};

// Calculate relevance score for a FAQ
const calculateScore = (faq: FAQ, queryTokens: string[]): number => {
  let score = 0;
  const questionLower = faq.question.toLowerCase();
  const answerLower = faq.answer.toLowerCase();
  const keywordsLower = faq.keywords.map(k => k.toLowerCase());

  // Track which tokens actually matched something meaningful
  let meaningfulMatches = 0;

  for (const token of queryTokens) {
    const tokenSynonyms = getSynonyms(token);
    let tokenMatched = false;

    for (const term of tokenSynonyms) {
      const isOriginalToken = term === token;

      // Exact keyword match (highest priority)
      if (keywordsLower.includes(term)) {
        score += isOriginalToken ? 15 : 8;
        tokenMatched = true;
      }
      // Keyword starts with term or term starts with keyword (for partial matches)
      else if (keywordsLower.some(k => k.startsWith(term) || term.startsWith(k))) {
        score += isOriginalToken ? 8 : 4;
        tokenMatched = true;
      }

      // Question contains term as a word (not just substring)
      const questionWordMatch = new RegExp(`\\b${term}\\b`, 'i').test(questionLower);
      if (questionWordMatch) {
        score += isOriginalToken ? 12 : 5;
        tokenMatched = true;
      }

      // Answer contains term as a word
      const answerWordMatch = new RegExp(`\\b${term}\\b`, 'i').test(answerLower);
      if (answerWordMatch) {
        score += isOriginalToken ? 4 : 2;
        tokenMatched = true;
      }
    }

    if (tokenMatched) {
      meaningfulMatches++;
    }
  }

  // Require at least half of query tokens to match for relevance
  if (queryTokens.length > 1 && meaningfulMatches < Math.ceil(queryTokens.length / 2)) {
    return 0;
  }

  // Boost score significantly if most/all tokens matched
  if (queryTokens.length > 0) {
    const matchRatio = meaningfulMatches / queryTokens.length;
    score *= matchRatio;
  }

  return score;
};

export default function HelpContent() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const featuredFaqs = faqData.filter(faq => faq.featured);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) {
      if (selectedCategory) {
        return faqData.filter(faq => faq.category === selectedCategory);
      }
      return [];
    }

    const queryTokens = tokenizeQuery(searchQuery);

    // If no meaningful tokens after filtering, try with original query
    if (queryTokens.length === 0) {
      const fallbackQuery = searchQuery.toLowerCase().trim();
      return faqData
        .filter(faq => {
          const matchesCategory = !selectedCategory || faq.category === selectedCategory;
          const matchesSearch =
            faq.question.toLowerCase().includes(fallbackQuery) ||
            faq.answer.toLowerCase().includes(fallbackQuery) ||
            faq.keywords.some(k => k.toLowerCase().includes(fallbackQuery));
          return matchesCategory && matchesSearch;
        })
        .slice(0, 20);
    }

    // Score and filter FAQs
    const scoredFaqs = faqData
      .filter(faq => !selectedCategory || faq.category === selectedCategory)
      .map(faq => ({
        faq,
        score: calculateScore(faq, queryTokens),
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);

    // Only return top results that have meaningful scores
    // Take results with score >= 50% of the top score, up to 15 results max
    if (scoredFaqs.length === 0) return [];

    const topScore = scoredFaqs[0].score;
    const threshold = topScore * 0.4; // Results must be at least 40% as relevant as top result

    return scoredFaqs
      .filter(item => item.score >= threshold)
      .slice(0, 15)
      .map(item => item.faq);
  }, [searchQuery, selectedCategory]);

  const toggleFaq = (id: string) => {
    setExpandedFaqs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const groupedResults = useMemo(() => {
    const groups: Record<string, FAQ[]> = {};
    filteredFaqs.forEach(faq => {
      if (!groups[faq.category]) {
        groups[faq.category] = [];
      }
      groups[faq.category].push(faq);
    });
    return groups;
  }, [filteredFaqs]);

  const FAQItem = ({ faq }: { faq: FAQ }) => {
    const isExpanded = expandedFaqs.has(faq.id);
    return (
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
          marginBottom: '12px',
        }}
      >
        <button
          onClick={() => toggleFaq(faq.id)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)', lineHeight: '1.5' }}>
            {faq.question}
          </span>
          {isExpanded ? (
            <ChevronDown size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <ChevronRight size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
          )}
        </button>
        {isExpanded && (
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginTop: '8px',
            lineHeight: '1.6',
            paddingRight: '30px',
          }}>
            {faq.answer}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Page Header */}
      <div className="mx-auto w-full max-w-[900px]" style={{ padding: isMobile ? '0px 20px 8px' : '0px 24px 12px', position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--text-muted)',
            marginTop: '22px',
            marginBottom: '8px',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div style={{ marginTop: '-8px' }}>
          <h1
            style={{
              fontSize: isMobile ? '26px' : '34px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Help & FAQs
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            Find answers and learn how to use College Orbit.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[900px] flex flex-col gap-6" style={{ padding: isMobile ? '12px 20px 24px' : '12px 24px 24px' }}>

        {/* Search Section */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                  Search FAQs
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Find answers to any question about College Orbit
                </p>
              </div>
              {!showSearch && (
                <button
                  onClick={() => setShowSearch(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Search size={16} />
                  Search
                </button>
              )}
            </div>

            {showSearch && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-muted)'
                      }}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for help topics..."
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 40px 12px 44px',
                        fontSize: '15px',
                        backgroundColor: 'var(--panel-2)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        outline: 'none',
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        style={{
                          position: 'absolute',
                          right: '14px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                      setSelectedCategory(null);
                    }}
                    style={{
                      padding: '0 16px',
                      fontSize: '14px',
                      backgroundColor: 'var(--panel-2)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>

                {/* Category Filter */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      backgroundColor: !selectedCategory ? 'var(--accent)' : 'var(--panel-2)',
                      color: !selectedCategory ? 'white' : 'var(--text-muted)',
                      border: '1px solid',
                      borderColor: !selectedCategory ? 'var(--accent)' : 'var(--border)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        backgroundColor: cat.id === selectedCategory ? 'var(--accent)' : 'var(--panel-2)',
                        color: cat.id === selectedCategory ? 'white' : 'var(--text-muted)',
                        border: '1px solid',
                        borderColor: cat.id === selectedCategory ? 'var(--accent)' : 'var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {cat.id}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Search Results */}
        {showSearch && (searchQuery || selectedCategory) && (
          <Card title={`${filteredFaqs.length} result${filteredFaqs.length === 1 ? '' : 's'} found`}>
            {filteredFaqs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                No results found. Try different keywords or browse by category.
              </p>
            ) : (
              <div>
                {Object.entries(groupedResults).map(([category, faqs]) => (
                  <div key={category} style={{ marginBottom: '24px' }}>
                    <p style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '12px',
                    }}>
                      {category}
                    </p>
                    {faqs.map(faq => (
                      <FAQItem key={faq.id} faq={faq} />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Featured FAQs (shown when not searching) */}
        {!showSearch && (
          <Card title="Common Questions">
            <div>
              {featuredFaqs.map(faq => (
                <FAQItem key={faq.id} faq={faq} />
              ))}
            </div>
          </Card>
        )}

        {/* Browse by Category (shown when not searching) */}
        {!showSearch && (
          <Card title="Browse by Topic">
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
              {categories.map(cat => {
                const Icon = cat.icon;
                const count = faqData.filter(f => f.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setShowSearch(true);
                      setSelectedCategory(cat.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px',
                      backgroundColor: 'var(--panel-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <Icon size={20} style={{ color: 'var(--link)', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{cat.id}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{count} questions</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Still Need Help */}
        <Card>
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Still need help?
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Can't find what you're looking for? Reach out anytime.
            </p>
            <a
              href="mailto:collegeorbit@protonmail.com"
              className="text-sm text-[var(--link)] hover:text-blue-400 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              collegeorbit@protonmail.com
            </a>
          </div>
        </Card>
      </div>
    </>
  );
}

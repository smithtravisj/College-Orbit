'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, ChevronDown, ChevronRight, X, HelpCircle, BookOpen, Calendar, CheckSquare, FileText, Settings, Shield, Zap, Bell, Download, Users, CreditCard, ClipboardList, Volume2, Sparkles } from 'lucide-react';
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
    answer: 'College Orbit is a privacy-first personal dashboard designed for students. It helps you manage your courses, track assignments and work items, organize notes, prepare for exams, and stay on top of your academic life. All your data is stored securely and we never share your personal information with third parties.',
    category: 'Getting Started',
    keywords: ['about', 'what', 'overview', 'introduction', 'start'],
    featured: true,
  },
  {
    id: 'how-to-add-courses',
    question: 'How do I add my courses?',
    answer: 'Go to the Courses page from the sidebar. Click the "Add Course" button and fill in your course details including name, code, location, and schedule.',
    category: 'Getting Started',
    keywords: ['add', 'course', 'create', 'new', 'class', 'subject'],
    featured: true,
  },
  {
    id: 'how-to-add-assignments',
    question: 'How do I add assignments and work items?',
    answer: 'Navigate to the Work page and click the add button. Choose the type (task, assignment, reading, or project), select the associated course, set the due date and time, and optionally add a description, checklist, links, and tags. You can also set priority levels and receive reminders.',
    category: 'Getting Started',
    keywords: ['assignment', 'work item', 'homework', 'task', 'due date', 'add'],
    featured: true,
  },
  {
    id: 'keyboard-shortcuts',
    question: 'Are there keyboard shortcuts?',
    answer: 'Yes! Press the "?" key anywhere in the app to view all available keyboard shortcuts. Common shortcuts include: "/" to open global search, "N" to create new items, "C" for courses, "W" for work items, and arrow keys to navigate between items.',
    category: 'Getting Started',
    keywords: ['keyboard', 'shortcut', 'hotkey', 'key', 'quick'],
    featured: true,
  },

  // Courses
  {
    id: 'edit-course',
    question: 'How do I edit or delete a course?',
    answer: 'Open the Courses page and click on the course you want to modify. Click the three-dot menu or the edit button to change course details. To delete, select "Delete" from the menu. Note: Deleting a course will also remove all associated work items, exams, and calendar events.',
    category: 'Courses',
    keywords: ['edit', 'delete', 'remove', 'modify', 'change', 'course'],
  },
  {
    id: 'course-schedule',
    question: 'How do I set up my class schedule?',
    answer: 'When adding or editing a course, you can set recurring class times. Select the days of the week, start and end times, and location. These will automatically appear on your calendar as recurring events.',
    category: 'Courses',
    keywords: ['schedule', 'time', 'recurring', 'weekly', 'class time', 'timetable'],
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
    answer: 'Click on any date or time slot in the calendar to create a new event. You can also click the "+" button. Events can be one-time or recurring, and you can link them to specific courses. All work item due dates and exams automatically appear on your calendar.',
    category: 'Calendar',
    keywords: ['event', 'add', 'create', 'calendar', 'appointment'],
  },
  {
    id: 'calendar-sync',
    question: 'Can I sync with Google Calendar?',
    answer: 'Yes! Premium users can connect Google Calendar for two-way sync of events and schedules. Go to Settings > Integrations to connect your Google account. You can also export your College Orbit calendar as an iCal subscription URL for use in Apple Calendar and other apps.',
    category: 'Calendar',
    keywords: ['sync', 'google', 'apple', 'ical', 'import', 'export', 'integration'],
  },

  // Work Items
  {
    id: 'what-are-work-items',
    question: 'What are work items?',
    answer: 'Work items are your central place for managing all academic tasks: assignments, readings, projects, and general tasks. Each can have a due date, priority, course, tags, checklist, links, and notes.',
    category: 'Work Items',
    keywords: ['work', 'item', 'task', 'assignment', 'reading', 'project', 'manage'],
  },
  {
    id: 'create-work-item',
    question: 'How do I create a work item?',
    answer: 'Go to the Work page and click the add button. Choose the type (task, assignment, reading, or project), fill in the details, and save.',
    category: 'Work Items',
    keywords: ['create', 'add', 'new', 'work item', 'task', 'assignment'],
  },
  {
    id: 'recurring-work-items',
    question: 'Can I set up recurring work items?',
    answer: 'Yes, you can create recurring patterns for work items that repeat on specific days of the week, days of the month, or at custom intervals.',
    category: 'Work Items',
    keywords: ['recurring', 'repeat', 'weekly', 'regular', 'automatic', 'pattern'],
  },
  {
    id: 'work-item-priorities',
    question: 'How do work item priorities work?',
    answer: 'You can set priorities (low, medium, high, urgent) to help you focus on what matters most. Filter and sort by priority on the Work page.',
    category: 'Work Items',
    keywords: ['priority', 'important', 'urgent', 'high', 'low', 'medium', 'sort', 'filter'],
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

  // Progress & Analytics
  {
    id: 'progress-tracking',
    question: 'How does progress tracking work?',
    answer: 'The Progress page shows your XP, level, streak information, and daily activity. Track your completed work items and see how consistently you are staying on top of your academic tasks.',
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
    answer: 'Earn achievements by reaching milestones like completing your first assignment, maintaining a week-long streak, or finishing all work items for a course. Achievements are displayed on your profile and provide motivation to stay on track.',
    category: 'Progress',
    keywords: ['achievement', 'badge', 'milestone', 'reward', 'gamification'],
  },
  {
    id: 'daily-challenges',
    question: 'What are daily challenges?',
    answer: 'Each day you get 3 randomized challenges based on your courses, tasks, and study habits. Complete each one to earn XP. If you finish all 3 in a single day you also receive a +25 XP sweep bonus. Challenges reset at midnight in your local timezone.',
    category: 'Progress',
    keywords: ['daily', 'challenge', 'sweep', 'bonus', 'xp', 'reward', 'daily challenge'],
  },

  // Settings & Customization
  {
    id: 'change-theme',
    question: 'How do I change the app theme?',
    answer: 'Go to Settings > Appearance to change your theme. Choose from light or dark mode. You can also customize accent colors to match your college colors or personal preference.',
    category: 'Settings',
    keywords: ['theme', 'dark mode', 'light mode', 'appearance', 'color'],
  },
  {
    id: 'notifications-settings',
    question: 'How do I manage notifications?',
    answer: 'Go to Settings > Preferences to configure notifications. You can enable or disable different notification types (work items, reminders, updates) and choose notification sounds. Browser notifications require permission.',
    category: 'Settings',
    keywords: ['notification', 'alert', 'sound', 'disable'],
  },
  {
    id: 'visual-themes',
    question: 'What are visual themes?',
    answer: 'Visual themes transform the look of College Orbit with unique backgrounds, animations, and color palettes. Choose from 20+ themes including Ocean, Space, Sakura, Lo-Fi, Pixel, Aquarium, and more. You can also enable a random daily theme that automatically switches each day. Visual themes are a premium feature available in Settings > Appearance.',
    category: 'Settings',
    keywords: ['visual', 'theme', 'background', 'animation', 'ocean', 'space', 'sakura', 'pixel', 'lofi', 'random theme', 'appearance'],
  },
  {
    id: 'pet-companion',
    question: 'What is the pet companion?',
    answer: 'The pet companion is an animated pixel art animal that walks along the bottom of your screen as you use the app. Choose from 12 different pets including a dog, cat, fox, turtle, parrot, and more. Pets are a premium feature that you can enable in Settings > Appearance.',
    category: 'Settings',
    keywords: ['pet', 'companion', 'animal', 'pixel art', 'animated', 'dog', 'cat', 'fox'],
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
    answer: 'Go to Settings > Data and click "Export All Data". This downloads a complete backup of your courses, work items, notes, and settings in JSON format. You can use this for personal backup or to migrate to another system.',
    category: 'Privacy & Data',
    keywords: ['export', 'backup', 'download', 'data', 'json'],
  },
  {
    id: 'import-data',
    question: 'Can I import data?',
    answer: 'Yes, you can import data from a College Orbit JSON export. Go to Settings > Data > Import to upload your backup file.',
    category: 'Privacy & Data',
    keywords: ['import', 'migrate', 'upload', 'transfer', 'data'],
  },
  {
    id: 'delete-account',
    question: 'How do I delete my account and data?',
    answer: 'Go to the Account page and select Delete Account. This permanently and immediately removes all your data from our servers. This action cannot be undone, so we recommend exporting your data first.',
    category: 'Privacy & Data',
    keywords: ['delete', 'account', 'remove', 'permanent', 'gdpr'],
  },

  // Subscription & Premium
  {
    id: 'free-vs-premium',
    question: 'What\'s the difference between free and premium?',
    answer: 'The free tier includes all core features: courses, work items, notes, and calendar. Premium adds: AI features (Orbi, flashcard generation, work breakdown, note summarization), ambient sounds, Google Calendar sync, custom themes, pet companion, and more. Visit the Pricing page for a full comparison.',
    category: 'Subscription',
    keywords: ['free', 'premium', 'subscription', 'paid', 'features', 'pricing'],
  },
  {
    id: 'cancel-subscription',
    question: 'How do I cancel my subscription?',
    answer: 'Go to the Account page and click "Manage Subscription". Click "Cancel Subscription" to stop future billing. You\'ll keep premium access until the end of your current billing period. You can resubscribe anytime.',
    category: 'Subscription',
    keywords: ['cancel', 'subscription', 'stop', 'billing', 'unsubscribe'],
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
    answer: 'Check these settings: 1) Browser notification permissions (allow for this site), 2) System notification settings, 3) In-app notification settings (Settings > Preferences). If issues persist, try logging out and back in, or contact support.',
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
    answer: 'Yes! The College Orbit browser extension lets you quickly add work items and notes without leaving your current page. Available for Chrome and other Chromium-based browsers. Install it from the Chrome Web Store.',
    category: 'Mobile & Extensions',
    keywords: ['extension', 'chrome', 'browser', 'addon', 'plugin'],
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
    answer: 'Press "/" or click the search icon to open Global Search. Search across all your courses, work items, notes, events, flashcard decks, shopping items, and more. Results are grouped by type for easy browsing.',
    category: 'Tools',
    keywords: ['search', 'global', 'find', 'everything', 'all'],
  },

  // Orbi AI
  {
    id: 'what-is-orbi',
    question: 'What is Orbi?',
    answer: 'Orbi is your AI study assistant built into College Orbit. It has access to all your courses, work items, exams, notes, calendar events, shopping lists, grades, flashcards, settings, and progress data. Orbi can answer questions about your academic life and take actions on your behalf. Premium feature — access it by clicking the "Ask Orbi" button.',
    category: 'Orbi AI',
    keywords: ['orbi', 'ai', 'assistant', 'chat', 'ask', 'help', 'premium'],
    featured: true,
  },
  {
    id: 'orbi-questions',
    question: 'What can I ask Orbi?',
    answer: 'You can ask Orbi anything about your data: "What\'s due this week?", "What classes do I have tomorrow?", "What\'s my GPA?", "How many flashcards are due for review?", "Am I free on Friday?". Orbi has full context of your courses, schedule, grades, flashcard decks, streak, and progress to give personalized answers.',
    category: 'Orbi AI',
    keywords: ['orbi', 'ask', 'question', 'schedule', 'due', 'streak', 'gpa', 'flashcard', 'deck', 'review', 'mastery'],
  },
  {
    id: 'orbi-manage-items',
    question: 'Can Orbi create, edit, and delete items?',
    answer: 'Yes! Orbi can create, update, and delete work items, exams, courses, calendar events, notes, and shopping items. Examples: "Add milk to my grocery list", "Create an exam for CS101 on March 15th at 2pm", "Rename my math homework to Chapter 5 Review", "Delete my dentist appointment", "Mark my essay as done". Orbi can also add links/URLs to items, perform bulk operations ("Mark all readings as done", "Delete all tasks tagged old"), and manage your grades and GPA entries.',
    category: 'Orbi AI',
    keywords: ['orbi', 'create', 'add', 'edit', 'update', 'delete', 'remove', 'complete', 'done', 'bulk', 'link', 'url', 'grade', 'gpa', 'work item', 'exam', 'course', 'event', 'note', 'shopping'],
  },
  {
    id: 'orbi-planning',
    question: 'Can Orbi help me plan and schedule?',
    answer: 'Yes! Orbi can create recurring tasks ("Add a weekly reading for Biology every Tuesday"), generate study plans ("Plan study sessions for my CS101 final from Monday to Friday covering sorting, trees, and graphs"), and manage holidays/excluded dates ("Add spring break from March 10-14"). Recurring tasks are automatically skipped on excluded dates.',
    category: 'Orbi AI',
    keywords: ['orbi', 'recurring', 'repeat', 'weekly', 'daily', 'study', 'plan', 'schedule', 'holiday', 'day off', 'break', 'excluded'],
  },
  {
    id: 'orbi-settings-controls',
    question: 'Can Orbi change settings and control the app?',
    answer: 'Yes! Orbi can update your settings ("Switch to dark mode", "Change my theme to sakura", "Set my pomodoro to 30 minutes"), control the Pomodoro timer ("Start a pomodoro", "Pause the timer"), and send feedback or bug reports to the College Orbit team on your behalf.',
    category: 'Orbi AI',
    keywords: ['orbi', 'settings', 'preferences', 'theme', 'dark mode', 'pomodoro', 'timer', 'feedback', 'bug', 'report'],
  },
  {
    id: 'orbi-chat-features',
    question: 'Does Orbi remember my conversation?',
    answer: 'Yes! Orbi remembers your conversation across page navigations and refreshes (up to 50 messages stored locally). Click the trash icon in the chat header to clear it. After each response, Orbi also suggests 1-3 follow-up actions as clickable chips — contextual shortcuts like "Mark it as done" or "Create a study plan".',
    category: 'Orbi AI',
    keywords: ['orbi', 'memory', 'remember', 'history', 'conversation', 'clear', 'suggested', 'actions', 'buttons', 'chips'],
  },
  {
    id: 'ai-other-features',
    question: 'What other AI features are available?',
    answer: 'Beyond the Orbi chat, College Orbit offers AI-powered flashcard generation (generate cards from notes, PDFs, or topics), AI work breakdown (split large assignments into subtasks), and AI note summarization (get concise summaries of your notes). All are premium features accessible from their respective tools.',
    category: 'Orbi AI',
    keywords: ['ai', 'flashcard', 'generate', 'breakdown', 'subtask', 'summarize', 'summary', 'note', 'pdf'],
  },

  // Google Calendar
  {
    id: 'connect-google-calendar',
    question: 'How do I connect Google Calendar?',
    answer: 'Go to Settings > Integrations and click Connect Google Calendar. You\'ll be redirected to authorize College Orbit to access your calendar. Premium feature.',
    category: 'Google Calendar',
    keywords: ['google', 'calendar', 'connect', 'integrate', 'sync', 'authorize'],
  },
  {
    id: 'google-calendar-sync',
    question: 'What syncs with Google Calendar?',
    answer: 'Your calendar events, class schedules, and due dates can sync to and from Google Calendar.',
    category: 'Google Calendar',
    keywords: ['google', 'calendar', 'sync', 'events', 'class', 'schedule', 'due date'],
  },
  {
    id: 'disconnect-google-calendar',
    question: 'How do I disconnect Google Calendar?',
    answer: 'Go to Settings > Integrations and click Disconnect next to Google Calendar. Your synced events will remain in College Orbit.',
    category: 'Google Calendar',
    keywords: ['google', 'calendar', 'disconnect', 'remove', 'unlink'],
  },

  // Ambient / Focus Sounds
  {
    id: 'ambient-sounds',
    question: 'What are ambient sounds?',
    answer: 'College Orbit includes built-in focus sounds like rain, cafe noise, and lo-fi beats to help you concentrate while studying. Available in the Pomodoro timer.',
    category: 'Ambient Sounds',
    keywords: ['ambient', 'sound', 'focus', 'rain', 'cafe', 'lofi', 'lo-fi', 'music', 'noise'],
  },
  {
    id: 'ambient-sounds-premium',
    question: 'Are ambient sounds a premium feature?',
    answer: 'Yes, ambient/focus sounds are available to premium subscribers.',
    category: 'Ambient Sounds',
    keywords: ['ambient', 'sound', 'premium', 'paid', 'subscription'],
  },

  // Shopping & Lists
  {
    id: 'shopping-lists',
    question: 'How do I use shopping lists?',
    answer: 'The Shopping page lets you manage shopping lists with three types: grocery, wishlist, and pantry. Add items with quantities, categories, and prices. Check items off as you shop. Lists sync across devices.',
    category: 'Shopping',
    keywords: ['shopping', 'list', 'grocery', 'items', 'buy', 'wishlist', 'pantry'],
  },

  // Account
  {
    id: 'change-email',
    question: 'How do I change my email address?',
    answer: 'Go to the Account page to update your email address. Enter your new email and confirm the change.',
    category: 'Account',
    keywords: ['email', 'change', 'update', 'address', 'account'],
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
    answer: 'You can connect Google Calendar to sync events both ways (premium feature) and sign in with Google for easy authentication. Go to Settings > Integrations to connect your Google account.',
    category: 'Integrations',
    keywords: ['google', 'calendar', 'integration', 'connect'],
  },

  // Tips & Best Practices
  {
    id: 'getting-organized',
    question: 'Tips for staying organized?',
    answer: 'Best practices: 1) Add all courses at the start of the semester, 2) Enter assignments as soon as they\'re announced, 3) Review your calendar weekly, 4) Use consistent naming conventions, 5) Set reminders 1-2 days before due dates, 6) Check off completed items daily.',
    category: 'Tips',
    keywords: ['tips', 'organize', 'best practices', 'advice', 'help'],
  },
  {
    id: 'productivity-tips',
    question: 'How can I be more productive with College Orbit?',
    answer: 'Productivity tips: 1) Use keyboard shortcuts for speed, 2) Use the Pomodoro timer for focused study, 3) Review your progress weekly, 4) Keep notes linked to courses, 5) Use tags to cross-reference related items.',
    category: 'Tips',
    keywords: ['productive', 'efficient', 'tips', 'workflow', 'better'],
  },

  // Additional Getting Started
  {
    id: 'first-time-setup',
    question: 'What should I do when I first sign up?',
    answer: 'After signing up: 1) Add your current semester courses, 2) Set up your class schedule, 3) Add any upcoming work items or exams, 4) Customize your theme and preferences in Settings, 5) Enable notifications so you don\'t miss due dates.',
    category: 'Getting Started',
    keywords: ['first', 'new', 'setup', 'start', 'begin', 'onboarding'],
  },
  {
    id: 'navigation-basics',
    question: 'How do I navigate around the app?',
    answer: 'Use the sidebar on the left to switch between pages (Courses, Work, Calendar, etc.). On mobile, tap the menu icon to open the sidebar. You can also use keyboard shortcuts: press "?" to see all shortcuts, "/" for search, or letter keys like "C" for courses.',
    category: 'Getting Started',
    keywords: ['navigate', 'sidebar', 'menu', 'pages', 'move around'],
  },
  {
    id: 'quick-actions',
    question: 'What are quick actions?',
    answer: 'Quick actions let you create items from anywhere in the app. Press "N" or click the "+" button to open the quick action menu. From there, you can quickly add a work item, note, event, or exam without navigating to the specific page first.',
    category: 'Getting Started',
    keywords: ['quick', 'action', 'shortcut', 'fast', 'add', 'create'],
  },
  {
    id: 'demo-data',
    question: 'What is the demo data?',
    answer: 'When you first sign up, you can choose to load demo data which populates your account with sample courses, work items, and notes. This helps you explore the app\'s features before adding your own data. You can clear demo data anytime from Settings > Data.',
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

  // Additional Calendar
  {
    id: 'calendar-colors',
    question: 'How do calendar colors work?',
    answer: 'Events inherit colors from their associated courses. This color-coding helps you quickly see which course each event belongs to.',
    category: 'Calendar',
    keywords: ['color', 'calendar', 'visual', 'identify'],
  },
  {
    id: 'recurring-events',
    question: 'How do I create recurring events?',
    answer: 'When adding an event, enable recurring and choose the frequency: daily, weekly, biweekly, monthly, or custom. Set an end date or number of occurrences. Edit individual instances or the entire series later.',
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
    answer: 'When adding an event, toggle "All Day" to create an event without specific start/end times. All-day events appear at the top of the day in calendar views. Perfect for holidays, due dates, or day-long activities.',
    category: 'Calendar',
    keywords: ['all day', 'full day', 'no time', 'holiday'],
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
    id: 'notes-code',
    question: 'How do I add code blocks to notes?',
    answer: 'Use triple backticks (```) to create code blocks, or click the code button in the toolbar. Specify the programming language for syntax highlighting. Inline code uses single backticks.',
    category: 'Notes',
    keywords: ['code', 'programming', 'syntax', 'highlight', 'block'],
  },
  {
    id: 'notes-math',
    question: 'Can I write math equations in notes?',
    answer: 'Yes, College Orbit supports LaTeX math notation. Wrap equations in $ for inline math or $$ for display math. The equation renders in the note. Useful for STEM courses.',
    category: 'Notes',
    keywords: ['math', 'equation', 'latex', 'formula', 'stem'],
  },
  {
    id: 'notes-link-course',
    question: 'How do I link notes to courses?',
    answer: 'When creating or editing a note, select the associated course from the dropdown. Linked notes appear on the course detail page and can be filtered by course on the Notes page.',
    category: 'Notes',
    keywords: ['link', 'course', 'associate', 'connect', 'attach'],
  },

  // Additional Progress
  {
    id: 'weekly-review',
    question: 'What is the weekly review?',
    answer: 'The weekly review summarizes your accomplishments: tasks completed and progress made. It appears at the end of each week and helps you reflect on your productivity.',
    category: 'Progress',
    keywords: ['weekly', 'review', 'summary', 'reflection', 'accomplished'],
  },
  {
    id: 'leaderboard',
    question: 'Is there a leaderboard?',
    answer: 'Yes, you can add friends and see college leaderboards based on monthly XP totals. Compare progress with other students at your school for motivation.',
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
    answer: 'We use essential cookies for authentication and preferences. No third-party advertising cookies are used.',
    category: 'Privacy & Data',
    keywords: ['cookies', 'tracking', 'advertising', 'privacy'],
  },
  {
    id: 'analytics',
    question: 'What analytics data is collected?',
    answer: 'We collect anonymous usage analytics to improve the app (pages visited, features used). No personal data or content is included.',
    category: 'Privacy & Data',
    keywords: ['analytics', 'tracking', 'data', 'collected', 'opt out'],
  },
  {
    id: 'data-retention',
    question: 'How long is my data kept?',
    answer: 'Your data is kept as long as your account is active. After account deletion, all data is permanently and immediately removed from our servers.',
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
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express). All payments are processed securely through Stripe.',
    category: 'Subscription',
    keywords: ['payment', 'credit card', 'paypal', 'pay', 'method'],
  },
  {
    id: 'billing-cycle',
    question: 'How does billing work?',
    answer: 'Choose monthly or annual billing. Annual billing offers a discount equivalent to about 2 free months. You\'re billed at the start of each cycle.',
    category: 'Subscription',
    keywords: ['billing', 'cycle', 'monthly', 'annual', 'invoice'],
  },
  {
    id: 'upgrade-downgrade',
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, change your plan anytime from the Account page. Upgrades take effect immediately with prorated billing. Downgrades take effect at the end of your current billing period.',
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
    answer: 'First, check if you\'re logged into the correct account. Then try refreshing the page. Check if filters are hiding items. If data is truly missing, contact support immediately.',
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
    answer: 'As a Progressive Web App, College Orbit can be installed on your device, sends push notifications, and runs in its own window like a native app.',
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
    id: 'extension-features',
    question: 'What can the browser extension do?',
    answer: 'The extension lets you: quickly add work items from any webpage, save links as notes, view upcoming tasks in a popup, and get notifications. It syncs with your account automatically.',
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
    answer: 'Create flashcard decks from the Tools page. Each deck can be linked to a course for organization. Add cards individually, use bulk import (front|back format), or use AI generation to create cards from your notes, PDFs, or topic descriptions (premium feature). Choose from three study modes: Flashcards (classic flip-to-reveal), Type Answer (test your recall by typing), or Match (pair terms with definitions). The app uses spaced repetition to optimize review timing—rate cards as Forgot (1 day), Struggled (2 days), Got it (3+ days), or Too easy (5+ days). Customize your study experience in Settings: cards per session, daily goal, shuffle order, and more. Edit or delete cards during study sessions. Earn XP for each card studied to level up and maintain your streak.',
    category: 'Tools',
    keywords: ['flashcard', 'study', 'memorize', 'cards', 'deck', 'spaced repetition', 'match', 'type answer', 'ai', 'generate'],
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
    answer: 'Yes, add estimated prices to items. The list shows a running total to help you stay on budget.',
    category: 'Shopping',
    keywords: ['price', 'cost', 'budget', 'spending', 'money'],
  },

  // Additional Account
  {
    id: 'change-password',
    question: 'How do I change my password?',
    answer: 'Go to the Account page. Enter your current password and your new password twice to confirm. Use a strong password with letters, numbers, and symbols.',
    category: 'Account',
    keywords: ['password', 'change', 'update', 'security', 'new'],
  },
  {
    id: 'profile-picture',
    question: 'How do I change my profile picture?',
    answer: 'Go to the Account page and click on your profile picture. Upload a new image. Images are cropped to a circle automatically.',
    category: 'Account',
    keywords: ['profile', 'picture', 'avatar', 'photo', 'image'],
  },
  {
    id: 'display-name',
    question: 'How do I change my display name?',
    answer: 'Go to the Account page. Edit your display name which appears throughout the app.',
    category: 'Account',
    keywords: ['name', 'display', 'change', 'username', 'profile'],
  },
  {
    id: 'connected-accounts',
    question: 'How do I manage integrations?',
    answer: 'Go to Settings > Integrations to see services linked to your account. You can connect or disconnect LMS platforms, Google Calendar, and other integrations.',
    category: 'Account',
    keywords: ['connected', 'linked', 'google', 'apple', 'social'],
  },
  {
    id: 'sessions',
    question: 'How do I view active sessions?',
    answer: 'Go to the Account page to see all devices logged into your account. You can see device type, location, and last active time. Sign out of any suspicious sessions.',
    category: 'Account',
    keywords: ['sessions', 'devices', 'logged in', 'active', 'security'],
  },
  // Additional Integrations
  {
    id: 'blackboard-integration',
    question: 'Can I connect to Blackboard?',
    answer: 'Blackboard integration is available for supported institutions. Go to Settings > Integrations > Blackboard. Enter your school\'s Blackboard URL and credentials to sync assignments.',
    category: 'Integrations',
    keywords: ['blackboard', 'lms', 'integration', 'sync', 'school'],
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
    answer: 'Group study tips: 1) Set clear goals for each session, 2) Assign topics to each person to teach, 3) Quiz each other, 4) Stay on topic, 5) Meet regularly at the same time, 6) Review with flashcards together.',
    category: 'Tips',
    keywords: ['group', 'study', 'together', 'team', 'collaborate'],
  },

  // Miscellaneous
  {
    id: 'report-bug',
    question: 'How do I report a bug?',
    answer: 'Go to Settings > About > Report Issue, or email collegeorbit@protonmail.com directly. Include: what happened, what you expected, steps to reproduce, your browser/device, and screenshots if possible.',
    category: 'Troubleshooting',
    keywords: ['bug', 'report', 'issue', 'problem', 'feedback'],
  },
  {
    id: 'feature-request',
    question: 'How do I request a new feature?',
    answer: 'We love feedback! Send feature requests to collegeorbit@protonmail.com or use the feedback form in Settings > About. Popular requests are prioritized for future updates.',
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
    answer: 'Check the Release Notes in Settings to see all updates, new features, and bug fixes. We update regularly based on user feedback.',
    category: 'Getting Started',
    keywords: ['new', 'update', 'release', 'changelog', 'version'],
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
  { id: 'Work Items', icon: ClipboardList },
  { id: 'Exams', icon: FileText },
  { id: 'Notes', icon: FileText },
  { id: 'Orbi AI', icon: Sparkles },
  { id: 'Google Calendar', icon: Calendar },
  { id: 'Ambient Sounds', icon: Volume2 },
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
  'deadline': ['due date', 'assignment', 'task', 'homework', 'work', 'work item'],
  'assignment': ['deadline', 'homework', 'task', 'work', 'project', 'work item'],
  'homework': ['assignment', 'deadline', 'task', 'work', 'work item'],
  'work item': ['task', 'assignment', 'deadline', 'homework', 'project', 'work'],
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
  'orbi': ['ai', 'assistant', 'chat', 'bot'],
  'ai': ['orbi', 'artificial intelligence', 'assistant', 'smart'],
  'ambient': ['sound', 'focus', 'music', 'noise', 'rain', 'lofi'],
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

  const FAQItem = ({ faq, isLast }: { faq: FAQ; isLast?: boolean }) => {
    const isExpanded = expandedFaqs.has(faq.id);
    return (
      <div
        style={{
          borderBottom: isLast ? 'none' : '1px solid var(--border)',
          paddingBottom: isLast ? 0 : '12px',
          marginBottom: isLast ? 0 : '12px',
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
                    color: 'var(--accent-text)',
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
                {Object.entries(groupedResults).map(([category, faqs], groupIndex, groupArr) => (
                  <div key={category} style={{ marginBottom: groupIndex === groupArr.length - 1 ? 0 : '24px' }}>
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
                    {faqs.map((faq, i) => (
                      <FAQItem key={faq.id} faq={faq} isLast={i === faqs.length - 1} />
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
              {featuredFaqs.map((faq, i) => (
                <FAQItem key={faq.id} faq={faq} isLast={i === featuredFaqs.length - 1} />
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

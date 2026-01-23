'use client';

import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';

export default function PrivacyContent() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your data"
      />
      <div className="mx-auto w-full max-w-[900px] flex flex-col gap-6" style={{ padding: 'clamp(16px, 5%, 40px)' }}>
        {/* Introduction */}
        <Card title="Privacy Policy">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Last Updated: January 23, 2026
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                At College Orbit, your privacy is our priority. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our service. We believe in transparency and give you full control over your data.
              </p>
            </div>
          </div>
        </Card>

        {/* Information We Collect */}
        <Card title="Information We Collect">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Account Information
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                When you create an account, we collect your name, email address, and selected school (university or high school). This information helps us provide personalized features and school-specific branding.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Academic Data
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We store all academic data you create: courses with meeting times and links, work items (tasks, assignments, readings, and projects) with priorities, effort levels, checklists, and tags, exams with locations, notes with rich text content (which can be linked to courses, work items, and exams) and organized in folders, GPA entries, excluded dates (holidays/breaks), custom calendar events, and recurring patterns for work items and exams. This data is entirely user-generated and belongs to you. We do not analyze or process this data beyond providing it back to you.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                File Attachments
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You may attach files to notes and courses. Files are stored securely on our servers and are limited to 5MB each. Supported file types include images (JPEG, PNG, GIF, WebP, HEIC/HEIF), documents (PDF, DOCX, XLSX, CSV, PPTX, Markdown, TXT), and other common formats. HEIC/HEIF images are automatically converted to JPEG format for broader compatibility. File attachments belong to you and are deleted when you remove them or delete your account.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Shopping & Lifestyle Data
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We store shopping lists you create, including grocery lists, wishlists, and pantry inventory. This includes item names, quantities, categories, prices, and perishable status. This data is entirely user-generated and belongs to you.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Settings and Preferences
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We store your app settings including theme preferences (light/dark/system with optional custom color themes), visibility customizations for dashboard cards and pages, page ordering, notification preferences, exam reminder settings, Pomodoro timer duration preferences, course filter preferences, quick link visibility, dashboard card collapsed states, visual effects preferences (gradient and glow intensity), and other configuration choices you make. These settings are synchronized across your devices when you're logged in.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Canvas LMS Data (Optional)
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                If you choose to connect your Canvas LMS account, we store your Canvas instance URL and an encrypted API access token that you generate from your Canvas account settings. When you sync with Canvas, we import and store course information (names, codes, dates), assignments (titles, descriptions, due dates, points), grades and scores, calendar events, and announcements. This data is fetched from Canvas using your API token and stored locally in your College Orbit account. We do not have access to your Canvas login credentials—only the API token you explicitly provide. You can disconnect Canvas at any time, which removes the stored token but preserves any synced data unless you manually delete it.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Technical Information & Session Data
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                When you use our service, we collect technical information including your browser type, operating system, device information, and IP address. We track active sessions to help you manage your account security—you can view all devices currently logged into your account and revoke access to any session from Account Settings. Session data is used solely for security purposes and to let you control which devices have access to your account.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Communication Data
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                If you submit feedback, college requests, issue reports, or feature requests through the app, we store this information to help us improve the service. This data may be viewed by administrators to review and address your feedback.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Beta Program Data
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                If you join the Beta Program, we store your beta participation status in your settings. If you submit beta feedback, we store your feedback description, submission date, status (pending, reviewed, resolved), and any admin responses. Beta feedback is associated with your user account and can be viewed by administrators. You will receive in-app notifications when administrators respond to or update the status of your beta feedback.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Analytics and Usage Data
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We collect basic analytics data including which pages you visit, when you log in, and general usage patterns. This helps us understand how the app is being used and identify areas for improvement. We do not use third-party analytics services. Analytics events are associated with your user account to track your usage, but we only analyze aggregated, anonymized data (such as total users and popular pages) for improvements. Individual user data is never shared or sold.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Notifications
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We store notification records including exam reminders, feature request status updates, and other in-app notifications. Notifications are retained for 30 days before being automatically deleted.
              </p>
            </div>
          </div>
        </Card>

        {/* How We Use Your Information */}
        <Card title="How We Use Your Information">
          <div className="space-y-3">
            <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>
                <span className="font-medium" style={{ color: 'var(--text)' }}>Provide the Service</span>: We use your information to create and maintain your account, store your academic data, and deliver the core functionality of the College Orbit.
              </li>
              <li>
                <span className="font-medium" style={{ color: 'var(--text)' }}>Personalization</span>: We use your selected school to provide school-specific branding, course information, and relevant features.
              </li>
              <li>
                <span className="font-medium" style={{ color: 'var(--text)' }}>Authentication & Security</span>: We use your email and authentication information to verify your identity and protect your account from unauthorized access.
              </li>
              <li>
                <span className="font-medium" style={{ color: 'var(--text)' }}>Analytics & Improvement</span>: We analyze usage patterns, page visits, and feedback to improve features, identify bugs, understand user needs, and develop new functionality. Only administrators can view analytics data.
              </li>
              <li>
                <span className="font-medium" style={{ color: 'var(--text)' }}>Notifications & Reminders</span>: We use your data to send you in-app notifications about exam reminders, feature request status updates, and other service-related information.
              </li>
              <li>
                <span className="font-medium" style={{ color: 'var(--text)' }}>Communications</span>: We may send you administrative emails about account security, password resets, service updates, or responses to your inquiries.
              </li>
              <li>
                <span className="font-medium" style={{ color: 'var(--text)' }}>Legal Compliance</span>: We use information as necessary to comply with applicable laws and regulations.
              </li>
            </ul>
          </div>
        </Card>

        {/* Data Storage & Security */}
        <Card title="Data Storage & Security">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Secure Storage
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your data is stored on secure, encrypted servers. We use PostgreSQL databases with encryption at rest and HTTPS encryption in transit to protect your information from unauthorized access.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Authentication & Access Control
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We use industry-standard authentication through NextAuth with secure credentials-based login (email and password). Passwords are hashed using bcrypt with a secure salt and are never stored in plain text. Only authorized personnel can access user data, and admin access is logged.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Canvas API Token Encryption
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                If you connect your Canvas LMS account, your API access token is encrypted using AES-256 encryption before being stored in our database. The token is only decrypted server-side when making requests to your Canvas instance. We never log or expose your decrypted token. Canvas API tokens expire after 120 days; if your token expires, you will receive an in-app notification prompting you to reconnect.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Data Retention
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We retain your data as long as your account is active. If you delete your account or request to delete all data, it is permanently removed from our servers immediately. You can also export and backup all your data at any time through Settings → Privacy.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Breach Notification
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                In the unlikely event of a data security breach, we will notify affected users as soon as possible and provide guidance on protecting your information.
              </p>
            </div>
          </div>
        </Card>

        {/* Data Sharing & Disclosure */}
        <Card title="Data Sharing & Disclosure">
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              We do NOT sell your data. We do NOT share your data with third parties for marketing purposes.
            </p>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Email Service Provider
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We use Resend, a third-party email service, to send password reset emails and other transactional communications. When you request a password reset, your email address is shared with Resend solely to deliver that message. Resend is bound by their privacy policy and processes your email address only as necessary to deliver messages on our behalf.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Canvas LMS Integration
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                If you connect your Canvas LMS account, our servers communicate directly with your school's Canvas instance using the API token you provide. This communication is used solely to fetch your course data, assignments, grades, calendar events, and announcements. We do not share your College Orbit account information with Canvas, and Canvas does not have access to your College Orbit data. All communication with Canvas servers uses secure HTTPS connections. Your Canvas data remains under your school's privacy policies; we simply import a copy for display within College Orbit.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Calendar Export & Subscription
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You can export your calendar data (work items, exams, courses, and custom events) as an iCal file for use in external calendar applications like Google Calendar or Apple Calendar. You can also generate a subscription URL that allows external calendars to automatically sync with your College Orbit data. This subscription URL contains a unique, randomly-generated token—anyone with this URL can view your calendar data. You can regenerate this token at any time from Account Settings, which will invalidate the previous URL. We recommend treating your calendar subscription URL as private information.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Limited Sharing
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Your information may be shared only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>With our email service provider (Resend) to send password reset and transactional emails</li>
                <li>With your Canvas LMS instance (only if you connect Canvas) to fetch your academic data</li>
                <li>With service providers who help us operate the platform (hosting, databases) under confidentiality agreements</li>
                <li>When required by law or legal process</li>
                <li>To protect against fraud, security threats, or illegal activity</li>
                <li>With your explicit consent</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Admin Access
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Administrators can view college requests, issue reports, and feature requests submitted by users. This information is used solely to improve the service and respond to user feedback. Personal account information remains private even from admins.
              </p>
            </div>
          </div>
        </Card>

        {/* Your Rights & Choices */}
        <Card title="Your Rights & Choices">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Access Your Data
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You can export all your data at any time from Settings → Data & Backup → Export Data. This provides you with a complete JSON backup of your courses, work items, exams, notes, settings, and all other information.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Modify Your Data
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You have full control to edit, update, or delete any of your academic data, courses, work items, exams, notes, and profile information at any time through the app.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Delete Your Account
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You can permanently delete your account and all associated data from Settings → Privacy → Danger Zone → Delete Account. This action cannot be undone, and all your data will be permanently removed.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Data Portability
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You have the right to obtain your data in a portable format (JSON). You can export your data, import it to another device, or switch services while keeping your information.
              </p>
            </div>
          </div>
        </Card>

        {/* Cookies & Local Storage */}
        <Card title="Cookies & Local Storage">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Session Cookies
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We use secure JWT (JSON Web Token) session cookies to keep you logged in while using the service. These sessions are valid for up to 30 days, after which you will need to log in again.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Local Storage
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We use browser local storage to save your theme preferences, application state, navigation settings, Pomodoro timer state, and calendar cache for faster loading. This data is stored only on your device and is not sent to our servers. Local storage is useful for faster loading and offline functionality awareness.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Analytics & Tracking
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We do NOT use third-party analytics services or tracking pixels. We do not monitor your behavior or create detailed usage profiles.
              </p>
            </div>
          </div>
        </Card>

        {/* Children's Privacy */}
        <Card title="Children's Privacy">
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              College Orbit is intended for users 13 years of age and older. We do not knowingly collect personal information from children under 13. If we learn that we have collected information from a child under 13, we will promptly delete such information and terminate the child's account.
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              If you are a parent or guardian and believe your child has provided information to us, please contact us immediately at the email address provided in the Contact section.
            </p>
          </div>
        </Card>

        {/* Changes to This Policy */}
        <Card title="Changes to This Policy">
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              We may update this Privacy Policy periodically to reflect changes in our practices, technology, or other factors. We will notify you of significant changes by updating the "Last Updated" date and posting the revised policy.
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              If we make material changes that affect your rights or how we use your data, we will notify you via email and ask for your consent if required by law.
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your continued use of the service after changes become effective means you accept the updated Privacy Policy.
            </p>
          </div>
        </Card>

        {/* Contact Us */}
        <Card title="Contact Us">
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal information, please contact us at:
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <a href="mailto:collegeorbit@protonmail.com" className="text-[var(--primary)] hover:underline">collegeorbit@protonmail.com</a>
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              We will respond to your inquiry within a reasonable timeframe and work to address your concerns.
            </p>
          </div>
        </Card>

      </div>
    </>
  );
}

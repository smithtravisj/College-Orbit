'use client';

import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';

export default function PrivacyPage() {
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
                Last Updated: December 21, 2024
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                At College Survival Tool, your privacy is our priority. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our service. We believe in transparency and give you full control over your data.
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
                When you create an account, we collect your name, email address, and selected university. This information helps us provide personalized features and university-specific branding.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Academic Data
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We store all academic data you create: courses with meeting times and links, deadlines with notes and attachments, tasks with checklists, exams with locations, notes with rich text content and folders, GPA entries, excluded dates (holidays/breaks), and calendar events. This data is entirely user-generated and belongs to you. We do not analyze or process this data beyond providing it back to you.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Settings and Preferences
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We store your app settings including theme preferences (light/dark/system), visibility customizations for dashboard cards and pages, notification preferences, exam reminder settings, Pomodoro timer duration preferences, and other configuration choices you make. These settings are synchronized across your devices when you're logged in.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Technical Information
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                When you use our service, we may collect technical information including your browser type, device information, and IP address. This helps us troubleshoot technical issues and ensure service reliability.
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
                <span className="font-medium" style={{ color: 'var(--text)' }}>Provide the Service</span>: We use your information to create and maintain your account, store your academic data, and deliver the core functionality of the College Survival Tool.
              </li>
              <li>
                <span className="font-medium" style={{ color: 'var(--text)' }}>Personalization</span>: We use your selected university to provide university-specific branding, course information, and relevant features.
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
                We use industry-standard authentication through NextAuth to protect your account. Passwords are hashed and never stored in plain text. Only authorized personnel can access user data, and admin access is logged.
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
                Limited Sharing
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Your information may be shared only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                You can export all your data at any time from Settings → Data & Backup → Export Data. This provides you with a complete JSON backup of your courses, tasks, deadlines, settings, and all other information.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Modify Your Data
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You have full control to edit, update, or delete any of your academic data, courses, tasks, deadlines, and profile information at any time through the app.
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
                We use session cookies to keep you logged in while using the service. These cookies expire when you close your browser.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Local Storage
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We use browser local storage to save your theme preferences, application state, navigation settings, and Pomodoro timer state. This data is stored only on your device and is not sent to our servers. Local storage is useful for faster loading and offline functionality awareness.
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
              College Survival Tool is intended for users 13 years of age and older. We do not knowingly collect personal information from children under 13. If we learn that we have collected information from a child under 13, we will promptly delete such information and terminate the child's account.
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

      </div>
    </>
  );
}

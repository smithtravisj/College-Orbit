'use client';

import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';

export default function TermsContent() {
  return (
    <>
      <PageHeader
        title="Terms of Service"
        subtitle="Legal agreement for using the College Orbit"
      />
      <div className="mx-auto w-full max-w-[900px] flex flex-col gap-6" style={{ padding: 'clamp(16px, 5%, 40px)' }}>
        {/* Acceptance of Terms */}
        <Card title="Acceptance of Terms">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Effective Date: January 27, 2026
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                These Terms of Service ("Terms") govern your use of the College Orbit website and services ("Service"). By creating an account and using the Service, you agree to be legally bound by these Terms. If you do not agree to these Terms, please do not use the Service.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Age Requirements
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You must be at least 13 years old to create an account and use the Service. By creating an account, you represent and warrant that you are at least 13 years old.
              </p>
            </div>
          </div>
        </Card>

        {/* Description of Service */}
        <Card title="Description of Service">
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              College Orbit is an educational productivity platform designed to help students manage their academic and personal lives. The Service provides features for organizing courses, managing work items (tasks, assignments, readings, and projects), maintaining a calendar, calculating GPA, managing shopping lists, and organizing academic information.
            </p>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                What We Provide
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>LMS integrations (Canvas, Blackboard, Moodle, Brightspace) to sync courses, assignments, grades, and calendar events</li>
                <li>Unified work management for tasks, assignments, readings, and projects with priorities, effort levels, checklists, and tags</li>
                <li>Recurring work items and exams with flexible scheduling</li>
                <li>Course and calendar organization with meeting schedules</li>
                <li>Custom calendar events for personal scheduling</li>
                <li>Exam tracking with customizable reminders</li>
                <li>Rich text note-taking with folder organization, linking to work items and exams, and file attachments (up to 5MB per file)</li>
                <li>GPA calculation and tracking</li>
                <li>Shopping lists (grocery, wishlist, and pantry inventory)</li>
                <li>Pomodoro productivity timer</li>
                <li>File converter for images, documents, and text files (most processing done in-browser)</li>
                <li>Dashboard customization (show/hide cards, pages, quick links, and visual effects)</li>
                <li>Theme customization including custom color themes</li>
                <li>Notification and reminder system</li>
                <li>Feedback submission (feature requests, issue reports, school requests)</li>
                <li>School-specific information and branding (universities and high schools)</li>
                <li>Data export and import functionality for backup and portability</li>
                <li>Calendar export to iCal format and subscription URLs for external calendar apps</li>
                <li>Browser extension for Chrome to quick-add assignments from Canvas and Learning Suite</li>
                <li>Gamification system with XP, levels, streaks, and achievements</li>
                <li>Friends system and leaderboards for social motivation</li>
                <li>Referral program to earn free premium time</li>
                <li>Session management to view and revoke access from logged-in devices</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* User Accounts */}
        <Card title="User Accounts">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Account Creation
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You are responsible for providing accurate, complete, and current information when creating your account. You must not use false information or impersonate others. You are solely responsible for maintaining the confidentiality of your account credentials.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Account Security
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You are responsible for all activities on your account. You must notify us immediately of any unauthorized use or security breach. We are not liable for unauthorized access to your account due to your failure to protect your credentials.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Account Termination
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You may delete your account at any time from Settings → Privacy → Danger Zone. We may suspend or terminate your account if you violate these Terms. Upon termination, your data will be permanently deleted.
              </p>
            </div>
          </div>
        </Card>

        {/* Acceptable Use Policy */}
        <Card title="Acceptable Use Policy">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Permitted Uses
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                The Service is provided for your personal, non-commercial educational use. You may use the Service to organize your academic information, manage your schedule, and improve your productivity as a student.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Prohibited Activities
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                You agree NOT to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>Violate any applicable laws or regulations</li>
                <li>Harass, abuse, or threaten other users</li>
                <li>Spam, send unsolicited messages, or engage in unauthorized marketing</li>
                <li>Attempt to access the Service or its systems without authorization</li>
                <li>Reverse engineer, decompile, or attempt to discover the source code</li>
                <li>Use automated tools (bots, scrapers) to access the Service</li>
                <li>Interfere with the normal operation of the Service</li>
                <li>Share access credentials with other users</li>
                <li>Use the Service for commercial purposes without permission</li>
                <li>Attempt to breach security measures or compromise user data</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* User Content & Data */}
        <Card title="User Content & Data">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Ownership
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You retain full ownership of all content, data, and information you create in the Service (courses, work items, exams, notes, file attachments, shopping lists, calendar events, etc.). We do not claim ownership of your data.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                License to Us
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                By using the Service, you grant us a limited license to use your data solely to provide, maintain, and improve the Service. This license does not allow us to sell, market, or share your data.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Your Responsibility
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You are responsible for the accuracy, completeness, and legality of all data you input. You should maintain regular backups of your data. We are not responsible for data loss if you do not keep backups.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                File Uploads
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You may attach files to notes and courses. Files are limited to 5MB each and are stored securely. Supported formats include images (JPEG, PNG, GIF, WebP, HEIC/HEIF), documents (PDF, DOCX, XLSX, CSV, PPTX, Markdown, TXT), and other common file types. HEIC/HEIF images are automatically converted to JPEG for compatibility.
              </p>
            </div>
          </div>
        </Card>

        {/* Beta Program */}
        <Card title="Beta Program">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Voluntary Participation
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                The Beta Program is entirely voluntary. You may join or leave the beta program at any time from Settings. Beta users get early access to new features before they are released to all users.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Beta Features
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Beta features are experimental and may be unstable, incomplete, or subject to change without notice. We do not guarantee that beta features will become permanent features, and they may be modified or removed at any time. By participating in the beta program, you acknowledge and accept these risks.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Feedback Submission
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                As a beta user, you may submit feedback about beta features directly through the app. By submitting feedback, you grant us a perpetual, royalty-free license to use your feedback to improve the Service. Feedback submissions are reviewed by administrators who may respond to your feedback through in-app notifications.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                No Warranty for Beta Features
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Beta features are provided "AS IS" without any warranty. We are not liable for any issues, data loss, or inconvenience caused by beta features. We recommend maintaining regular backups of your data while using beta features.
              </p>
            </div>
          </div>
        </Card>

        {/* Service Limits */}
        <Card title="Service Limits">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Rate Limiting
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                To ensure fair usage and protect our infrastructure, API requests are limited to 100 requests per minute per endpoint. Excessive requests may result in temporary throttling.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                File Size Limits
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Individual file uploads are limited to 5MB. Files exceeding this limit will be rejected.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Session Duration
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Login sessions are valid for up to 30 days. After this period, you will need to log in again to continue using the Service.
              </p>
            </div>
          </div>
        </Card>

        {/* Intellectual Property */}
        <Card title="Intellectual Property">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Service Ownership
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We own all intellectual property rights to the College Orbit Service, including the website, software, design, and content (except for your user-generated data). You may not reproduce, distribute, or transmit any of this material without our permission.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Trademarks
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                "College Orbit" and related logos are trademarks. School names and logos (universities, high schools, etc.) are trademarks of their respective institutions and are used with permission. You may not use these trademarks without authorization.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Limited License
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We grant you a limited, non-exclusive, non-transferable license to access and use the Service solely for personal educational purposes. You may not license, sell, transfer, or assign this license.
              </p>
            </div>
          </div>
        </Card>

        {/* Third-Party Services */}
        <Card title="Third-Party Services">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                LMS Integrations
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                College Orbit offers optional integration with Learning Management Systems (Canvas, Blackboard, Moodle, and Brightspace). When you connect your LMS account:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>You provide your LMS instance URL and credentials (API token or username/password depending on the platform)</li>
                <li>We use these credentials to fetch your courses, assignments, grades, and calendar events on your behalf</li>
                <li>Your credentials are encrypted and stored securely on our servers</li>
                <li>We only read data from your LMS; we never modify, submit, or delete anything in your LMS account</li>
                <li>You can disconnect your LMS account at any time from Settings, which will delete your stored credentials</li>
              </ul>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                Your use of any LMS is subject to your institution's terms of service. We are not affiliated with Instructure (Canvas), Anthology (Blackboard), Moodle, or D2L (Brightspace) and are not responsible for LMS availability or data accuracy.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Email Services
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We use Resend, a third-party email service provider, to send password reset emails and other transactional communications. Resend processes your email address solely to deliver these messages and is bound by their privacy policy and our data processing agreement.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Calendar Export & External Calendars
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                College Orbit allows you to export your calendar data (work items, exams, courses, and custom events) to external calendar applications like Google Calendar, Apple Calendar, and others. You can download a one-time iCal file or generate a subscription URL that automatically syncs with your College Orbit data. The subscription URL contains a unique token—anyone with this URL can view your calendar data. You are responsible for keeping your subscription URL private. You can regenerate your token at any time to invalidate previous URLs.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                External Services
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                The Service may include links to or reference third-party services and educational resources. We are not responsible for third-party content or services that you access through links in the Service.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                No Endorsement
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Links to third-party services and content do not constitute endorsement or affiliation. You are responsible for reviewing the terms and privacy policies of any third-party services you access through the Service.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Third-Party Terms Apply
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your use of third-party services is governed by their own terms of service and privacy policies, not these Terms.
              </p>
            </div>
          </div>
        </Card>

        {/* Browser Extension */}
        <Card title="Browser Extension">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Purpose
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                The College Orbit browser extension for Chrome allows you to quickly add assignments from Canvas and BYU Learning Suite directly to your College Orbit account without leaving the LMS page.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Data Access
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                The extension only accesses data on Canvas (*.instructure.com) and Learning Suite (learningsuite.byu.edu) pages. It reads assignment titles, due dates, point values, descriptions, and course names from pages you visit. The extension does not access, read, or collect data from any other websites. The extension does not modify any data on Canvas or Learning Suite.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Authentication
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                The extension authenticates with your College Orbit account using either your existing session cookie or email/password login. Your credentials are stored securely in Chrome&apos;s local storage and are only transmitted to College Orbit servers over HTTPS.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                No Affiliation
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                The browser extension is not affiliated with, endorsed by, or sponsored by Instructure (Canvas), Brigham Young University, or any other educational institution. Use of the extension is subject to your institution&apos;s acceptable use policies.
              </p>
            </div>
          </div>
        </Card>

        {/* Referral Program */}
        <Card title="Referral Program">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                How It Works
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You may invite others to College Orbit using your unique referral code. When a new user signs up with your referral code, both you and the referred user may receive rewards such as free premium subscription time, as described in the app.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Restrictions
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You may not create multiple accounts to exploit the referral program. Referral rewards are subject to change at any time. We reserve the right to revoke referral rewards and suspend accounts that abuse the referral system.
              </p>
            </div>
          </div>
        </Card>

        {/* Disclaimers & Limitations */}
        <Card title="Disclaimers & Limitations of Liability">
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              IMPORTANT: College Orbit is a personal productivity aid. You are ultimately responsible for managing your academic obligations. Always verify deadlines and course information with official university sources. We are NOT liable for missed deadlines, lost grades, or academic consequences.
            </p>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                As-Is Service
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                The Service is provided "AS IS" without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or secure.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                No Warranty
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We do not warrant the accuracy, completeness, or timeliness of course information, deadlines, or other academic data. You should independently verify all information with your institution.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Limitation of Liability
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, service interruption, missed deadlines, or academic consequences.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Backup Responsibility
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You are responsible for maintaining backups of your data. We recommend regularly exporting your data. We are not liable for any data loss due to failure to backup.
              </p>
            </div>
          </div>
        </Card>

        {/* Indemnification */}
        <Card title="Indemnification">
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              You agree to defend, indemnify, and hold harmless College Orbit, its operators, and employees from any claims, damages, losses, or expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of applicable laws</li>
              <li>Content or data you input into the Service</li>
              <li>Your infringement of third-party rights</li>
            </ul>
          </div>
        </Card>

        {/* Termination */}
        <Card title="Termination">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                User Termination
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                You may terminate your account at any time by deleting it from Settings → Privacy. Upon termination, your data will be permanently deleted.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Our Termination Rights
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We may suspend or terminate your account at any time if you violate these Terms, engage in illegal activity, or pose a security risk to other users or the Service.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Effect of Termination
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Upon termination, your access to the Service is immediately revoked. Your data will be permanently deleted immediately upon account termination or deletion request.
              </p>
            </div>
          </div>
        </Card>

        {/* Governing Law */}
        <Card title="Governing Law & Dispute Resolution">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Jurisdiction
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                These Terms are governed by and construed in accordance with the laws of the United States, without regard to its conflicts of law principles.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Dispute Resolution
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Any dispute arising from these Terms or your use of the Service shall be resolved through good-faith negotiation. If negotiation fails, disputes may be subject to arbitration or litigation as permitted by law.
              </p>
            </div>
          </div>
        </Card>

        {/* Miscellaneous */}
        <Card title="Miscellaneous">
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Entire Agreement
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                These Terms, along with our Privacy Policy, constitute the entire agreement between you and College Orbit regarding the Service.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Severability
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full effect.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Amendments
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                We reserve the right to modify these Terms at any time. Changes become effective upon posting. Your continued use of the Service constitutes acceptance of the modified Terms.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                No Waiver
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Failure to enforce any provision of these Terms does not constitute a waiver of that provision or any other provision.
              </p>
            </div>
          </div>
        </Card>

      </div>
    </>
  );
}

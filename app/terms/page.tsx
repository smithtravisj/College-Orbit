'use client';

import PageHeader from '@/components/PageHeader';
import Card from '@/components/ui/Card';

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Terms of Service"
        subtitle="Legal agreement for using the College Survival Tool"
      />
      <div className="mx-auto w-full max-w-[900px] flex flex-col gap-6" style={{ padding: 'clamp(16px, 5%, 40px)' }}>
        {/* Acceptance of Terms */}
        <Card title="Acceptance of Terms">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Effective Date: December 2024
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                These Terms of Service ("Terms") govern your use of the College Survival Tool website and services ("Service"). By creating an account and using the Service, you agree to be legally bound by these Terms. If you do not agree to these Terms, please do not use the Service.
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
              College Survival Tool is an educational productivity platform designed to help students manage their academic lives. The Service provides features for organizing courses, tracking deadlines, managing tasks, maintaining a calendar, calculating GPA, and organizing academic information.
            </p>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                What We Provide
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <li>Personal task and deadline management tools</li>
                <li>Course and calendar organization</li>
                <li>GPA calculation and tracking</li>
                <li>University-specific information and branding</li>
                <li>Data export and backup functionality</li>
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
                You retain full ownership of all content, data, and information you create in the Service (courses, tasks, deadlines, notes, etc.). We do not claim ownership of your data.
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
                We own all intellectual property rights to the College Survival Tool Service, including the website, software, design, and content (except for your user-generated data). You may not reproduce, distribute, or transmit any of this material without our permission.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text)', marginBottom: '8px' }}>
                Trademarks
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                "College Survival Tool" and related logos are trademarks. University names and logos (BYU, etc.) are trademarks of their respective institutions and are used with permission. You may not use these trademarks without authorization.
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
                External Services
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                The Service may include links to or integrate with third-party services, including authentication providers (NextAuth, Google, university login systems) and educational resources. We are not responsible for third-party content or services.
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

        {/* Disclaimers & Limitations */}
        <Card title="Disclaimers & Limitations of Liability">
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              IMPORTANT: College Survival Tool is a personal productivity aid. You are ultimately responsible for managing your academic obligations. Always verify deadlines and course information with official university sources. We are NOT liable for missed deadlines, lost grades, or academic consequences.
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
              You agree to defend, indemnify, and hold harmless College Survival Tool, its operators, and employees from any claims, damages, losses, or expenses (including legal fees) arising from:
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
                Upon termination, your access to the Service is immediately revoked. Your data will be permanently deleted within 30 days.
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
                These Terms, along with our Privacy Policy, constitute the entire agreement between you and College Survival Tool regarding the Service.
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

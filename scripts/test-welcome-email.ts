// Run with: npx ts-node scripts/test-welcome-email.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { sendWelcomeEmail } from '../lib/email';

async function main() {
  const testEmail = process.argv[2] || 'collegeorbit.test@passmail.net';
  const testName = process.argv[3] || 'Test User';

  console.log(`Sending welcome email to: ${testEmail}`);
  console.log(`Name: ${testName}`);

  try {
    await sendWelcomeEmail({
      email: testEmail,
      name: testName,
    });
    console.log('Welcome email sent successfully!');
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

main();

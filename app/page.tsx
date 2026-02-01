import { getServerSession } from 'next-auth/next';
import { authConfig } from '@/auth.config';
import LandingPage from '@/components/LandingPage';
import AuthenticatedDashboard from '@/components/AuthenticatedDashboard';

// Server-rendered SEO content for crawlers (visually hidden)
function SEOContent() {
  return (
    <div
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
      aria-hidden="true"
    >
      <h1>College Orbit - Your Personal College Dashboard</h1>
      <p>
        Stay organized throughout college with College Orbit, the privacy-first
        student dashboard designed to help you succeed. Track assignments, manage
        deadlines, schedule exams, organize courses, and boost your productivity
        with powerful tools.
      </p>
      <h2>Features</h2>
      <ul>
        <li>Assignment and deadline tracking with smart reminders</li>
        <li>Exam scheduling with countdown timers</li>
        <li>Course management with grade tracking</li>
        <li>Note-taking with markdown support</li>
        <li>GPA calculator and grade projector</li>
        <li>Flashcards with spaced repetition learning</li>
        <li>Pomodoro timer for focused study sessions</li>
        <li>Calendar sync with Google Calendar</li>
        <li>LMS integration with Canvas, Blackboard, and Moodle</li>
        <li>File converter and productivity tools</li>
      </ul>
      <h2>Why Choose College Orbit?</h2>
      <p>
        College Orbit is built for students who value privacy and simplicity.
        Your data is encrypted and never sold to third parties. Start free with
        core features including task tracking, exam scheduling, up to 10 notes,
        and up to 5 courses. Upgrade to Premium for unlimited access, custom
        themes, file attachments, and more starting at just $3 per month.
      </p>
      <h2>Get Started Today</h2>
      <p>
        Join thousands of college students who use College Orbit to stay
        organized and achieve their academic goals. Sign up for free and
        take control of your college experience.
      </p>
    </div>
  );
}

export default async function HomePage() {
  const session = await getServerSession(authConfig);

  if (!session) {
    return (
      <>
        <SEOContent />
        <LandingPage />
      </>
    );
  }

  return <AuthenticatedDashboard />;
}

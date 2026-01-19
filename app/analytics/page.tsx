'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { collegeColorPalettes, collegeColorPalettesLight } from '@/lib/collegeColors';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface AnalyticsData {
  summary: {
    totalUsers: number;
    newUsersLast30Days: number;
    activeUsersLast30Days: number;
    newUserActivationRate: number;
    uniqueSessions: number;
    totalPageViews: number;
    loginsLast30Days: number;
    pagesPerActiveUser: number;
    returnVisitorRate: number;
    mostPopularPage: { name: string; count: number } | null;
    avgLoginsPerActiveUser: number;
  };
  topPages: Array<{ name: string; count: number }>;
  pageViewTrends: Array<{
    date: string;
    pages: Array<{ page: string; count: number }>;
  }>;
  uniquePages: string[];
  universityDistribution: Array<{ university: string; count: number }>;
}

// Color palettes for pages (theme-aware)
const darkModeColors = [
  '#CC4400', // Very Dark Orange
  '#1E40AF', // Very Dark Blue
  '#065F46', // Very Dark Green
  '#7F1D1D', // Very Dark Red/Pink
  '#451A03', // Very Dark Brown
  '#4C1D95', // Very Dark Purple
  '#991B1B', // Very Dark Dark Orange
  '#0D3B66', // Very Dark Teal
  '#92400E', // Very Dark Gold
  '#581C1C', // Very Dark Dark Red
];

const lightModeColors = [
  '#FFB84D', // Light Orange
  '#7FD8F7', // Light Blue
  '#7FE2B0', // Light Green
  '#FF7FA0', // Light Red/Pink
  '#C4B5A0', // Light Brown
  '#C4A0E0', // Light Purple
  '#F4A460', // Light Orange-Red
  '#5FE3D0', // Light Teal
  '#FFD580', // Light Gold
  '#FF9999', // Light Red
];

function getPageColor(index: number, isDarkMode: boolean): string {
  const palette = isDarkMode ? darkModeColors : lightModeColors;
  const color = palette[index % palette.length];
  console.log(`[getPageColor] index=${index}, isDarkMode=${isDarkMode}, color=${color}`);
  return color;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      // Check both html and body elements
      const htmlStyle = window.getComputedStyle(document.documentElement);
      const bodyStyle = window.getComputedStyle(document.body);

      const htmlBgColor = htmlStyle.backgroundColor;
      const bodyBgColor = bodyStyle.backgroundColor;

      console.log('[Analytics Theme Debug]');
      console.log('HTML bg:', htmlBgColor);
      console.log('Body bg:', bodyBgColor);

      // Determine which background color to use
      let bgColor = htmlBgColor !== 'rgba(0, 0, 0, 0)' ? htmlBgColor : bodyBgColor;
      console.log('Using bg:', bgColor);

      // Parse the color to determine if it's light or dark
      // Extract RGB values and check if they're all high (light background)
      let isLightBg = false;

      // Try to parse rgb() format
      const rgbMatch = bgColor.match(/rgb\((\d+),?\s*(\d+),?\s*(\d+)/);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        // Light colors have high RGB values (threshold: 200)
        isLightBg = r > 200 && g > 200 && b > 200;
        console.log(`RGB values: r=${r}, g=${g}, b=${b}, isLight=${isLightBg}`);
      } else if (bgColor.includes('#FFF') || bgColor.includes('#fff') || bgColor.includes('#ffffff') || bgColor.includes('#FFFFFF')) {
        // Hex white colors
        isLightBg = true;
      }

      console.log('Is light bg:', isLightBg);
      console.log('Setting isDarkMode to:', !isLightBg);

      setIsDarkMode(!isLightBg);
    };

    checkTheme();

    // Check theme on various events
    window.addEventListener('load', checkTheme);
    window.addEventListener('focus', checkTheme);
    document.addEventListener('visibilitychange', checkTheme);

    // Check theme periodically
    const interval = setInterval(checkTheme, 500);

    return () => {
      window.removeEventListener('load', checkTheme);
      window.removeEventListener('focus', checkTheme);
      document.removeEventListener('visibilitychange', checkTheme);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    console.log('[Analytics] isDarkMode changed:', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics/data');

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (response.status === 403) {
          router.push('/');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchAnalytics();
    }
  }, [session, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">Error: {error}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-[var(--text-muted)]">No data available</div>
      </div>
    );
  }

  return (
    <>
      {/* Analytics Header */}
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: isMobile ? '8px 20px 8px' : '12px 24px 12px', position: 'relative', zIndex: 1 }}>
        <div>
          <h1
            style={{
              fontSize: isMobile ? '26px' : '34px',
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}
          >
            Analytics
          </h1>
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'var(--text-muted)', marginTop: '-4px' }}>
            Usage statistics and insights.
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-[1400px]" style={{ padding: 'clamp(12px, 4%, 24px)', paddingTop: '0', position: 'relative', zIndex: 1 }}>
        <div className="w-full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--grid-gap)' }}>
          {/* Summary Stats */}
          <Card title="Summary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Users</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                  {analytics.summary.totalUsers}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Total number of user accounts created
                </p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>New Users (Last 30 Days)</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                  {analytics.summary.newUsersLast30Days}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  New user signups in the past month
                </p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Active Users (Last 30 Days)</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                  {analytics.summary.activeUsersLast30Days}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Users who have logged in or used the app in the past month
                </p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>New User Activation Rate</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                  {analytics.summary.newUserActivationRate}%
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Percentage of new signups who became active
                </p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Unique Sessions</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                  {analytics.summary.uniqueSessions}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Total browsing sessions tracked (resets every 30 minutes of inactivity)
                </p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Logins (Last 30 Days)</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                  {analytics.summary.loginsLast30Days}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Total number of login events in the past month
                </p>
              </div>
            </div>
          </Card>

          {/* Activity Stats */}
          <Card title="Engagement">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Page Views</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                  {analytics.summary.totalPageViews}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Total page visits across all users (all-time)
                </p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Avg Views per Session</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                  {analytics.summary.uniqueSessions > 0
                    ? (analytics.summary.totalPageViews / analytics.summary.uniqueSessions).toFixed(1)
                    : 0}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Average pages viewed per session
                </p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Pages per Active User</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                  {analytics.summary.pagesPerActiveUser}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Average pages viewed per active user (last 30 days)
                </p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Return Visitor Rate</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                  {analytics.summary.returnVisitorRate}%
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Percentage of users with multiple sessions
                </p>
              </div>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Avg Logins per User</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                  {analytics.summary.avgLoginsPerActiveUser}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Average logins per active user (last 30 days)
                </p>
              </div>
              {analytics.summary.mostPopularPage && (
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Most Popular Page</p>
                  <p style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' }}>
                    {analytics.summary.mostPopularPage.name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {analytics.summary.mostPopularPage.count} visits
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Top Pages */}
        <div style={{ marginTop: 'var(--grid-gap)' }}>
          <Card title="Most Visited Pages">
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                Pages ranked by total visits. Shows which features your users visit most frequently.
              </p>
            </div>
            {analytics.topPages.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No page views yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analytics.topPages.map((page, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      backgroundColor: 'var(--panel-2)',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <p style={{ fontSize: '14px', color: 'var(--text)', margin: 0 }}>{page.name}</p>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                      {page.count} visits
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Page View Trends */}
        <div style={{ marginTop: 'var(--grid-gap)' }}>
          <Card title="Daily Page Views (Last 7 Days)">
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                Hover over sections to see page details.
              </p>
            </div>
            {analytics.pageViewTrends.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No page views yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
                {analytics.pageViewTrends.map((trend, index) => {
                  const dayTotal = trend.pages.reduce((sum, p) => sum + p.count, 0);

                  return (
                    <div key={index}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '90px', fontWeight: '500' }}>
                          {trend.date}
                        </p>
                        <div
                          style={{
                            flex: 1,
                            height: '40px',
                            backgroundColor: 'var(--panel-2)',
                            borderRadius: '4px',
                            overflow: 'visible',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            position: 'relative',
                            minHeight: 'auto',
                          }}
                        >
                          {[...analytics.uniquePages]
                          .sort()
                          .map((page) => trend.pages.find((p) => p.page === page))
                          .filter((page) => page !== undefined)
                          .map((pageData) => {
                            if (!pageData) return null;
                            const pagePercentage =
                              dayTotal > 0
                                ? (pageData.count / dayTotal) * 100
                                : 0;
                            const isHovered = hoveredSegment === `${trend.date}-${pageData.page}`;

                            return (
                              <div
                                key={pageData.page}
                                onMouseEnter={() => setHoveredSegment(`${trend.date}-${pageData.page}`)}
                                onMouseLeave={() => setHoveredSegment(null)}
                                style={{
                                  height: '100%',
                                  width: `${Math.max(0, pagePercentage)}%`,
                                  backgroundColor: getPageColor(analytics.uniquePages.indexOf(pageData.page), isDarkMode),
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  minWidth: pagePercentage > 0 ? '4px' : '0',
                                  transform: isHovered ? 'scaleY(1.3)' : 'scaleY(1)',
                                  position: 'relative',
                                  zIndex: isHovered ? 10 : 1,
                                  cursor: 'pointer',
                                }}
                              >
                                {isHovered && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      bottom: 'calc(100% + 8px)',
                                      left: '50%',
                                      transform: 'translateX(-50%)',
                                      backgroundColor: 'var(--panel)',
                                      color: 'var(--text)',
                                      border: '1px solid var(--border)',
                                      padding: '12px 20px',
                                      borderRadius: '6px',
                                      fontSize: '13px',
                                      lineHeight: '1',
                                      fontWeight: '500',
                                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
                                      whiteSpace: 'nowrap',
                                      pointerEvents: 'none',
                                      zIndex: 100,
                                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                      textTransform: 'capitalize',
                                      display: 'block',
                                      WebkitFontSmoothing: 'antialiased',
                                      MozOsxFontSmoothing: 'grayscale',
                                      textRendering: 'optimizeLegibility',
                                    } as React.CSSProperties}
                                  >
                                    {pageData.page}: {pageData.count}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text)', minWidth: '35px', textAlign: 'right' }}>
                          {dayTotal}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* University Distribution */}
        <div style={{ marginTop: 'var(--grid-gap)' }}>
          <Card title="Users by University">
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                Number of users with each university selected in their settings.
              </p>
            </div>
            {analytics.universityDistribution.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No university data yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analytics.universityDistribution.map((item, index) => {
                  const colorPalette = isDarkMode
                    ? collegeColorPalettes[item.university]
                    : collegeColorPalettesLight[item.university];
                  const accentColor = colorPalette?.accent || '#666666';

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: 'var(--panel-2)',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          backgroundColor: accentColor,
                          flexShrink: 0,
                        }}
                      />
                      <p style={{ fontSize: '14px', color: 'var(--text)', margin: 0, flex: 1 }}>
                        {item.university}
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                        {item.count} {item.count === 1 ? 'user' : 'users'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Info Message */}
        <div
          style={{
            marginTop: 'var(--grid-gap)',
            padding: '16px',
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text-muted)',
            fontSize: '13px',
            lineHeight: '1.6',
          }}
        >
          <p style={{ margin: 0, marginBottom: '12px', fontWeight: '500', color: 'var(--text)' }}>How This Works</p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '6px' }}>
              <strong>Anonymous Session IDs:</strong> Each visitor gets a unique session ID (not tied to their user account) that resets every 30 minutes
            </li>
            <li style={{ marginBottom: '6px' }}>
              <strong>No Personal Data:</strong> Only page visits and interactions are tracked, no personally identifiable information is stored
            </li>
            <li style={{ marginBottom: '6px' }}>
              <strong>Aggregated Stats:</strong> All numbers shown are totals and rankings, never individual user data
            </li>
            <li>
              <strong>Admin Only:</strong> This dashboard is only visible to administrators and shows high-level insights
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

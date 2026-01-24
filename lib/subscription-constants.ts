// Client-safe subscription constants
// Keep this file free of server-only imports (like Prisma)

export const FREE_TIER_LIMITS = {
  maxNotes: 10,
  maxCourses: 8,
  canUploadFiles: false,
  canUseRecurring: false,
  canAccessCalendar: false,
  canAccessShopping: false,
  canAccessFullTools: false, // Only Quick Links free
};

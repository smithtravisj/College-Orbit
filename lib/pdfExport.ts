import { jsPDF } from 'jspdf';

// Types for PDF export
interface WorkItemForPDF {
  title: string;
  type: string;
  dueAt: string | null;
  priority: string | null;
  effort: string | null;
  status: string;
  course?: { name: string; code: string } | null;
  notes?: string;
  tags?: string[];
  links?: Array<{ label: string; url: string }>;
  checklist?: Array<{ text: string; done: boolean }>;
  isRecurring?: boolean;
  recurringInfo?: string; // Human-readable recurrence description
}

interface CourseForPDF {
  name: string;
  code: string;
  meetingTimes: Array<{
    days: string[];
    start: string;
    end: string;
    location?: string;
  }>;
  colorTag?: string | null;
}

// Helper to clean text for PDF (handle special characters)
function cleanTextForPDF(text: string): string {
  if (!text) return '';
  // Replace problematic characters and normalize whitespace
  return text
    .replace(/[\u2018\u2019]/g, "'")  // Smart quotes to regular
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-')  // En-dash and em-dash
    .replace(/\u2026/g, '...')        // Ellipsis
    .replace(/\u00A0/g, ' ')          // Non-breaking space
    .replace(/\r\n/g, '\n')           // Normalize line endings
    .replace(/\r/g, '\n');
}

// Helper to format date for display
function formatDateForPDF(dateStr: string | null): string {
  if (!dateStr) return 'No due date';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Helper to format time (12-hour format)
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Priority labels
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

// Effort labels
const EFFORT_LABELS: Record<string, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

// Type labels
const TYPE_LABELS: Record<string, string> = {
  task: 'Task',
  assignment: 'Assignment',
  reading: 'Reading',
  project: 'Project',
};

/**
 * Export work items (assignments, tasks, etc.) to PDF
 */
export function exportWorkItemsToPDF(
  items: WorkItemForPDF[],
  options: {
    title?: string;
    filterLabel?: string;
  } = {}
): void {
  const {
    title = 'Work Items',
    filterLabel = '',
  } = options;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper to check and add new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin - 10) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(cleanTextForPDF(title), margin, yPos);
  yPos += 10;

  // Filter info and date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated: ${dateStr}${filterLabel ? `  |  Filter: ${filterLabel}` : ''}`, margin, yPos);
  yPos += 5;
  doc.text(`Total items: ${items.length}`, margin, yPos);
  yPos += 10;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Divider line
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Items
  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
    const item = items[itemIndex];

    // Estimate height needed for this item
    let estimatedHeight = 30; // Base height for title and details
    if (item.notes && item.notes.trim()) {
      const noteLines = doc.splitTextToSize(cleanTextForPDF(item.notes.trim()), contentWidth - 10);
      estimatedHeight += noteLines.length * 4 + 8;
    }
    if (item.checklist && item.checklist.length > 0) {
      estimatedHeight += item.checklist.length * 5 + 6;
    }
    if (item.links && item.links.length > 0) {
      estimatedHeight += item.links.length * 4 + 6;
    }
    if (item.tags && item.tags.length > 0) {
      estimatedHeight += 8;
    }

    checkNewPage(Math.min(estimatedHeight, 60)); // At least check for partial fit

    // Item number and type badge
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 120, 120);
    doc.text(`${itemIndex + 1}.`, margin, yPos);

    // Type badge
    const typeLabel = TYPE_LABELS[item.type] || item.type;
    doc.setFillColor(66, 133, 244);
    const badgeWidth = doc.getTextWidth(typeLabel) + 8;
    doc.roundedRect(margin + 12, yPos - 4, badgeWidth, 6, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(typeLabel, margin + 16, yPos);
    doc.setTextColor(0, 0, 0);

    // Recurring badge (if applicable)
    let recurringBadgeWidth = 0;
    if (item.isRecurring) {
      doc.setFillColor(156, 39, 176); // Purple for recurring
      const recurringLabel = 'Recurring';
      recurringBadgeWidth = doc.getTextWidth(recurringLabel) + 8;
      doc.roundedRect(margin + 12 + badgeWidth + 4, yPos - 4, recurringBadgeWidth, 6, 1, 1, 'F');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(recurringLabel, margin + 16 + badgeWidth + 4, yPos);
      doc.setTextColor(0, 0, 0);
      recurringBadgeWidth += 4; // Add spacing
    }

    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const titleX = margin + 16 + badgeWidth + recurringBadgeWidth + 4;
    const maxTitleWidth = contentWidth - badgeWidth - recurringBadgeWidth - 28;
    const titleLines = doc.splitTextToSize(cleanTextForPDF(item.title), maxTitleWidth);
    for (let i = 0; i < titleLines.length; i++) {
      if (i > 0) {
        yPos += 5;
        checkNewPage(20);
      }
      doc.text(titleLines[i], i === 0 ? titleX : margin + 16, yPos);
    }
    yPos += 7;

    // Details row (course, due date, priority, effort)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    const details: string[] = [];
    if (item.course) {
      details.push(`Course: ${item.course.code || item.course.name}`);
    }
    details.push(`Due: ${formatDateForPDF(item.dueAt)}`);
    if (item.priority) {
      details.push(`Priority: ${PRIORITY_LABELS[item.priority] || item.priority}`);
    }
    if (item.effort) {
      details.push(`Effort: ${EFFORT_LABELS[item.effort] || item.effort}`);
    }

    const detailsText = details.join('  |  ');
    const detailLines = doc.splitTextToSize(cleanTextForPDF(detailsText), contentWidth - 10);
    for (const line of detailLines) {
      doc.text(line, margin + 6, yPos);
      yPos += 4;
    }
    yPos += 2;
    doc.setTextColor(0, 0, 0);

    // Tags
    if (item.tags && item.tags.length > 0) {
      checkNewPage(10);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Tags: ${item.tags.join(', ')}`, margin + 6, yPos);
      yPos += 5;
      doc.setTextColor(0, 0, 0);
    }

    // Recurring info
    if (item.isRecurring && item.recurringInfo) {
      checkNewPage(10);
      doc.setFontSize(8);
      doc.setTextColor(156, 39, 176); // Purple to match badge
      doc.text(`Repeats: ${cleanTextForPDF(item.recurringInfo)}`, margin + 6, yPos);
      yPos += 5;
      doc.setTextColor(0, 0, 0);
    }

    // Notes (full, not truncated)
    if (item.notes && item.notes.trim()) {
      checkNewPage(15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Notes:', margin + 6, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 70, 70);
      doc.setFontSize(9);
      const noteLines = doc.splitTextToSize(cleanTextForPDF(item.notes.trim()), contentWidth - 16);
      for (const line of noteLines) {
        checkNewPage(5);
        doc.text(line, margin + 10, yPos);
        yPos += 4;
      }
      yPos += 3;
      doc.setTextColor(0, 0, 0);
    }

    // Checklist
    if (item.checklist && item.checklist.length > 0) {
      checkNewPage(15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Checklist:', margin + 6, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      for (const checkItem of item.checklist) {
        checkNewPage(5);
        const checkbox = checkItem.done ? '[x]' : '[ ]';
        doc.setTextColor(checkItem.done ? 130 : 70, checkItem.done ? 130 : 70, checkItem.done ? 130 : 70);
        doc.text(`${checkbox} ${cleanTextForPDF(checkItem.text)}`, margin + 10, yPos);
        yPos += 4;
      }
      yPos += 3;
      doc.setTextColor(0, 0, 0);
    }

    // Links
    if (item.links && item.links.length > 0) {
      checkNewPage(15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Links:', margin + 6, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(66, 133, 244);
      doc.setFontSize(8);
      for (const link of item.links) {
        checkNewPage(5);
        const linkText = link.label ? `${link.label}: ${link.url}` : link.url;
        doc.text(cleanTextForPDF(linkText), margin + 10, yPos);
        yPos += 4;
      }
      yPos += 3;
      doc.setTextColor(0, 0, 0);
    }

    yPos += 4;

    // Separator between items
    if (itemIndex < items.length - 1) {
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin + 10, yPos, pageWidth - margin - 10, yPos);
      yPos += 8;
    }
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('College Orbit', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 25, pageHeight - 8);
  }

  // Save the PDF
  const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Map abbreviated day names to full names
const DAY_ABBREV_TO_FULL: Record<string, string> = {
  'Sun': 'Sunday',
  'Mon': 'Monday',
  'Tue': 'Tuesday',
  'Wed': 'Wednesday',
  'Thu': 'Thursday',
  'Fri': 'Friday',
  'Sat': 'Saturday',
  // Also handle full names
  'Sunday': 'Sunday',
  'Monday': 'Monday',
  'Tuesday': 'Tuesday',
  'Wednesday': 'Wednesday',
  'Thursday': 'Thursday',
  'Friday': 'Friday',
  'Saturday': 'Saturday',
};

/**
 * Export weekly study schedule to PDF
 */
export function exportScheduleToPDF(
  courses: CourseForPDF[],
  options: {
    title?: string;
  } = {}
): void {
  const { title = 'Weekly Class Schedule' } = options;

  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, yPos);
  yPos += 6;

  // Date
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated: ${dateStr}`, margin, yPos);
  yPos += 10;
  doc.setTextColor(0, 0, 0);

  // Days of the week (starting with Monday)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayWidth = (pageWidth - margin * 2) / 7;
  const scheduleStartY = yPos;

  // Collect all meeting times by day
  const meetingsByDay: Map<string, Array<{
    course: CourseForPDF;
    start: string;
    end: string;
    location?: string;
  }>> = new Map();

  days.forEach(day => meetingsByDay.set(day, []));

  for (const course of courses) {
    if (!course.meetingTimes || !Array.isArray(course.meetingTimes)) continue;

    for (const meeting of course.meetingTimes) {
      if (!meeting.days || !Array.isArray(meeting.days)) continue;
      if (!meeting.start || !meeting.end) continue; // Skip meetings without times

      for (const day of meeting.days) {
        // Convert abbreviated day names to full names
        const fullDayName = DAY_ABBREV_TO_FULL[day];
        if (!fullDayName) continue;

        const dayMeetings = meetingsByDay.get(fullDayName);
        if (dayMeetings) {
          dayMeetings.push({
            course,
            start: meeting.start,
            end: meeting.end,
            location: meeting.location,
          });
        }
      }
    }
  }

  // Sort meetings by start time for each day
  meetingsByDay.forEach((meetings) => {
    meetings.sort((a, b) => a.start.localeCompare(b.start));
  });

  // Draw day headers
  doc.setFillColor(66, 133, 244);
  doc.rect(margin, scheduleStartY, pageWidth - margin * 2, 8, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  days.forEach((day, index) => {
    const x = margin + index * dayWidth + dayWidth / 2;
    doc.text(day, x, scheduleStartY + 5.5, { align: 'center' });
  });

  doc.setTextColor(0, 0, 0);
  yPos = scheduleStartY + 12;

  // Draw vertical lines for columns
  doc.setDrawColor(220, 220, 220);
  for (let i = 0; i <= days.length; i++) {
    const x = margin + i * dayWidth;
    doc.line(x, scheduleStartY, x, pageHeight - margin - 15);
  }

  // Draw schedule entries
  const rowHeight = 18;

  // Find max number of classes in any day
  let maxClasses = 0;
  meetingsByDay.forEach((meetings) => {
    if (meetings.length > maxClasses) maxClasses = meetings.length;
  });

  // Generate pastel colors for courses
  const courseColors = new Map<string, { r: number; g: number; b: number }>();
  const colorPalette = [
    { r: 227, g: 242, b: 253 }, // Light blue
    { r: 232, g: 245, b: 233 }, // Light green
    { r: 255, g: 243, b: 224 }, // Light orange
    { r: 243, g: 229, b: 245 }, // Light purple
    { r: 255, g: 235, b: 238 }, // Light pink
    { r: 224, g: 247, b: 250 }, // Light cyan
    { r: 255, g: 249, b: 196 }, // Light yellow
    { r: 239, g: 235, b: 233 }, // Light brown
  ];

  courses.forEach((course, index) => {
    courseColors.set(course.code || course.name, colorPalette[index % colorPalette.length]);
  });

  // Draw classes for each day
  days.forEach((day, dayIndex) => {
    const meetings = meetingsByDay.get(day) || [];
    const x = margin + dayIndex * dayWidth;

    meetings.forEach((meeting, meetingIndex) => {
      const entryY = yPos + meetingIndex * (rowHeight + 2);

      if (entryY + rowHeight > pageHeight - margin - 20) return; // Skip if off page

      // Background color
      const color = courseColors.get(meeting.course.code || meeting.course.name) || { r: 240, g: 240, b: 240 };
      doc.setFillColor(color.r, color.g, color.b);
      doc.roundedRect(x + 2, entryY, dayWidth - 4, rowHeight, 2, 2, 'F');

      // Course code/name
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      const courseLabel = meeting.course.code || meeting.course.name;
      const truncatedLabel = courseLabel.length > 12 ? courseLabel.substring(0, 11) + '...' : courseLabel;
      doc.text(truncatedLabel, x + 4, entryY + 5);

      // Time
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      const timeStr = `${formatTime(meeting.start)} - ${formatTime(meeting.end)}`;
      doc.text(timeStr, x + 4, entryY + 10);

      // Location (if present)
      if (meeting.location) {
        doc.setFontSize(6);
        doc.setTextColor(100, 100, 100);
        const truncatedLoc = meeting.location.length > 15 ? meeting.location.substring(0, 14) + '...' : meeting.location;
        doc.text(truncatedLoc, x + 4, entryY + 14);
      }
    });
  });

  // Draw horizontal line above legend
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, pageHeight - margin - 25, pageWidth - margin, pageHeight - margin - 25);

  // Course legend at bottom (supports multiple rows)
  let legendY = pageHeight - margin - 20;
  let legendX = margin;
  const legendRowHeight = 6;
  const maxLegendY = pageHeight - 8; // Leave room for footer

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Courses:', legendX, legendY);
  legendX += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  for (const course of courses) {
    const color = courseColors.get(course.code || course.name) || { r: 240, g: 240, b: 240 };
    const label = course.code || course.name;
    const truncatedLabel = label.length > 20 ? label.substring(0, 19) + '...' : label;
    const itemWidth = doc.getTextWidth(truncatedLabel) + 16;

    // Check if we need to wrap to next line
    if (legendX + itemWidth > pageWidth - margin) {
      legendX = margin + 22;
      legendY += legendRowHeight;
      if (legendY > maxLegendY) break; // Stop if we run out of space
    }

    doc.setFillColor(color.r, color.g, color.b);
    doc.roundedRect(legendX, legendY - 3.5, 8, 5, 1, 1, 'F');
    doc.setTextColor(60, 60, 60);
    doc.text(truncatedLabel, legendX + 10, legendY);

    legendX += itemWidth + 6;
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('College Orbit', pageWidth - margin - 25, pageHeight - 5);

  // Save the PDF
  const filename = `weekly-schedule-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

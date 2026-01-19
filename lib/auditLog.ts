import { prisma } from '@/lib/prisma';

export type AuditAction =
  | 'grant_premium'
  | 'revoke_premium'
  | 'grant_admin'
  | 'revoke_admin'
  | 'send_announcement'
  | 'approve_college_request'
  | 'reject_college_request'
  | 'resolve_issue_report'
  | 'reject_issue_report'
  | 'implement_feature_request'
  | 'reject_feature_request'
  | 'add_college'
  | 'update_college'
  | 'delete_college';

interface LogAuditParams {
  adminId: string;
  adminEmail: string;
  action: AuditAction;
  targetUserId?: string;
  targetEmail?: string;
  details?: Record<string, any>;
}

export async function logAuditEvent({
  adminId,
  adminEmail,
  action,
  targetUserId,
  targetEmail,
  details,
}: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        adminEmail,
        action,
        targetUserId,
        targetEmail,
        details: details || undefined,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main action
    console.error('[AuditLog] Failed to log event:', error);
  }
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    grant_premium: 'Granted Lifetime Premium',
    revoke_premium: 'Revoked Premium',
    grant_admin: 'Granted Admin Access',
    revoke_admin: 'Revoked Admin Access',
    send_announcement: 'Sent Announcement',
    approve_college_request: 'Approved College Request',
    reject_college_request: 'Rejected College Request',
    resolve_issue_report: 'Resolved Issue Report',
    reject_issue_report: 'Rejected Issue Report',
    implement_feature_request: 'Implemented Feature Request',
    reject_feature_request: 'Rejected Feature Request',
    add_college: 'Added College',
    update_college: 'Updated College',
    delete_college: 'Deleted College',
  };
  return labels[action] || action;
}

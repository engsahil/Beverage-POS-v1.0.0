import prisma from '../lib/prisma.js';
import { createAuditLog, AuditActions } from './auditService.js';
import { logger } from '../lib/logger.js';

export interface CreatePermissionInput {
  businessId: string;
  name: string;
  module: string;
  action: string;
  description?: string;
}

/**
 * Create a permission
 */
export async function createPermission(
  input: CreatePermissionInput,
  adminId: string,
  ipAddress?: string,
  userAgent?: string
) {
  const permission = await prisma.permission.create({
    data: input,
  });

  await createAuditLog({
    businessId: input.businessId,
    userId: adminId,
    action: AuditActions.PERMISSION_CREATED,
    entityType: 'permission',
    entityId: permission.id,
    newValues: { name: permission.name, module: permission.module, action: permission.action },
    ipAddress,
    userAgent,
  });

  return permission;
}

/**
 * Get all permissions for a business
 */
export async function getPermissions(businessId: string) {
  return prisma.permission.findMany({
    where: { businessId },
    orderBy: [{ module: 'asc' }, { action: 'asc' }],
  });
}

/**
 * Get permissions grouped by module
 */
export async function getPermissionsByModule(businessId: string) {
  const permissions = await prisma.permission.findMany({
    where: { businessId },
    orderBy: [{ module: 'asc' }, { action: 'asc' }],
  });

  const grouped: Record<string, typeof permissions> = {};
  for (const perm of permissions) {
    if (!grouped[perm.module]) {
      grouped[perm.module] = [];
    }
    grouped[perm.module].push(perm);
  }

  return grouped;
}

/** Add any missing catalogue permissions without deleting custom permissions. */
export async function seedDefaultPermissions(businessId: string) {
  const { DEFAULT_PERMISSIONS } = await import('../config/permissions.js');
  let created = 0;
  for (const permission of DEFAULT_PERMISSIONS) {
    const existing = await prisma.permission.findUnique({ where: { name: permission.name } });
    if (!existing) {
      await prisma.permission.create({ data: { ...permission, businessId } });
      created += 1;
    }
  }
  logger.info('Default permissions synchronized', { businessId, created, total: DEFAULT_PERMISSIONS.length });
}

import prisma from '../lib/prisma.js';
import { CASHIER_PERMISSION_NAMES, DEFAULT_PERMISSIONS } from '../config/permissions.js';
import { logger } from '../lib/logger.js';

/**
 * Adds newly introduced permissions and repairs system-role assignments.
 * It never changes users, passwords, business data, or custom roles.
 */
export async function synchronizeSystemPermissions(): Promise<void> {
  const businesses = await prisma.business.findMany({ select: { id: true } });

  for (const { id: businessId } of businesses) {
    for (const permission of DEFAULT_PERMISSIONS) {
      const existing = await prisma.permission.findUnique({ where: { name: permission.name } });
      if (!existing) {
        await prisma.permission.create({ data: { ...permission, businessId } });
      } else if (existing.businessId === businessId) {
        await prisma.permission.update({
          where: { id: existing.id },
          data: {
            module: permission.module,
            action: permission.action,
            description: permission.description,
          },
        });
      }
    }

    const permissions = await prisma.permission.findMany({ where: { businessId } });
    const adminRole = await prisma.role.findFirst({ where: { businessId, name: 'Admin' } });
    if (adminRole) {
      await prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({ roleId: adminRole.id, permissionId: permission.id })),
        skipDuplicates: true,
      });
    }

    const cashierRole = await prisma.role.findFirst({ where: { businessId, name: 'Cashier', isSystem: true } });
    if (cashierRole) {
      const cashierPermissions = permissions.filter((permission) => CASHIER_PERMISSION_NAMES.includes(permission.name));
      await prisma.$transaction([
        prisma.rolePermission.deleteMany({ where: { roleId: cashierRole.id } }),
        prisma.rolePermission.createMany({
          data: cashierPermissions.map((permission) => ({ roleId: cashierRole.id, permissionId: permission.id })),
          skipDuplicates: true,
        }),
      ]);
    }
  }

  logger.info('System permissions synchronized', {
    businesses: businesses.length,
    catalogueSize: DEFAULT_PERMISSIONS.length,
  });
}

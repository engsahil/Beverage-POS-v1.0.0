import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../src/lib/config.js';
import { CASHIER_PERMISSION_NAMES, DEFAULT_PERMISSIONS } from '../src/config/permissions.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting idempotent database seed...');

  let business = await prisma.business.findFirst();
  if (!business) {
    business = await prisma.business.create({
      data: {
        name: config.SEED_BUSINESS_NAME,
        currency: 'PKR', timezone: 'Asia/Karachi',
        phone: '+923001234567', address: 'Lahore, Punjab, Pakistan',
      },
    });
  }

  let branch = await prisma.branch.findFirst({ where: { businessId: business.id } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: { businessId: business.id, name: 'Main Branch', code: 'MAIN', address: business.address, phone: business.phone },
    });
  }

  for (const permission of DEFAULT_PERMISSIONS) {
    const existing = await prisma.permission.findUnique({ where: { name: permission.name } });
    if (!existing) {
      await prisma.permission.create({ data: { ...permission, businessId: business.id } });
    } else if (existing.businessId === business.id) {
      await prisma.permission.update({ where: { id: existing.id }, data: permission });
    }
  }

  const adminRole = await prisma.role.upsert({
    where: { businessId_name: { businessId: business.id, name: 'Admin' } },
    create: { businessId: business.id, name: 'Admin', description: 'Full system administrator', isSystem: true },
    update: { isSystem: true },
  });
  const cashierRole = await prisma.role.upsert({
    where: { businessId_name: { businessId: business.id, name: 'Cashier' } },
    create: { businessId: business.id, name: 'Cashier', description: 'POS cashier with limited access', isSystem: true },
    update: { isSystem: true },
  });

  const allPermissions = await prisma.permission.findMany({ where: { businessId: business.id } });
  const cashierPermissions = allPermissions.filter((permission) => CASHIER_PERMISSION_NAMES.includes(permission.name));
  await prisma.$transaction([
    prisma.rolePermission.createMany({
      data: allPermissions.map((permission) => ({ roleId: adminRole.id, permissionId: permission.id })),
      skipDuplicates: true,
    }),
    prisma.rolePermission.deleteMany({ where: { roleId: cashierRole.id } }),
    prisma.rolePermission.createMany({
      data: cashierPermissions.map((permission) => ({ roleId: cashierRole.id, permissionId: permission.id })),
      skipDuplicates: true,
    }),
  ]);

  // Never update an existing admin's password or profile during a repair seed.
  let adminUser = await prisma.user.findFirst({
    where: { businessId: business.id, username: config.SEED_ADMIN_USERNAME },
  });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        businessId: business.id, branchId: branch.id,
        username: config.SEED_ADMIN_USERNAME, email: config.SEED_ADMIN_EMAIL,
        fullName: 'System Administrator',
        passwordHash: await bcrypt.hash(config.SEED_ADMIN_PASSWORD, config.BCRYPT_SALT_ROUNDS),
        roleId: adminRole.id, isActive: true,
      },
    });
  }

  const defaultSettings: Array<[string, unknown]> = [
    ['invoice_number_prefix', 'INV-'], ['invoice_number_sequence', 1],
    ['receipt_show_logo', true], ['receipt_show_address', true], ['receipt_show_phone', true],
    ['currency_symbol', 'Rs.'], ['date_format', 'DD/MM/YYYY'], ['time_format', 'HH:mm'],
  ];
  for (const [key, value] of defaultSettings) {
    const existing = await prisma.setting.findFirst({ where: { businessId: business.id, key } });
    if (!existing) await prisma.setting.create({ data: { businessId: business.id, key, value: value as object } });
  }

  console.log(`Seed complete: ${DEFAULT_PERMISSIONS.length} permissions synchronized; existing passwords preserved.`);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
}).finally(async () => prisma.$disconnect());

/**
 * Canonical permission catalogue. Route middleware, the seed, and the
 * idempotent startup backfill must use names from this list.
 */
const permissionNames = [
  'audit.view',
  'backup.manage', 'backup.view',
  'branches.manage', 'branches.view',
  'cashier.manage', 'cashier.view',
  'categories.create', 'categories.delete', 'categories.edit', 'categories.view',
  'claims.approve', 'claims.create', 'claims.edit', 'claims.manage', 'claims.review', 'claims.view',
  'commission.approve', 'commission.create', 'commission.edit', 'commission.manage', 'commission.view',
  'customers.add_payment', 'customers.create', 'customers.delete', 'customers.edit', 'customers.view', 'customers.view_ledger',
  'daily_open_close.manage', 'daily_open_close.view',
  'data.export', 'data.import',
  'discounts.apply', 'discounts.manage', 'discounts.override', 'discounts.view',
  'expense_categories.manage', 'expense_categories.view',
  'expenses.approve', 'expenses.create', 'expenses.edit', 'expenses.manage', 'expenses.view',
  'inventory.adjust', 'inventory.count', 'inventory.expiry.manage', 'inventory.expiry.view',
  'inventory.movements.view', 'inventory.opening_stock', 'inventory.transfer',
  'inventory.transfer.approve', 'inventory.transfer.create', 'inventory.transfer.receive', 'inventory.transfer.view', 'inventory.view',
  'pos.access', 'pos.cart.manage', 'pos.offline.sync', 'pos.products.search',
  'price_limits.manage', 'price_limits.override', 'price_limits.view',
  'products.create', 'products.delete', 'products.edit', 'products.export', 'products.import', 'products.view',
  'purchases.cancel', 'purchases.create', 'purchases.edit', 'purchases.receive', 'purchases.view',
  'receipts.print', 'receipts.view',
  'reports.customers.view', 'reports.expenses.view', 'reports.export', 'reports.financial',
  'reports.inventory.view', 'reports.purchases.view', 'reports.sales.view', 'reports.shifts.view', 'reports.targets.view', 'reports.view',
  'roles.manage', 'roles.view',
  'sales.apply_discount', 'sales.create', 'sales.edit', 'sales.override_price', 'sales.refund', 'sales.view', 'sales.void',
  'settings.manage', 'settings.view',
  'shifts.close', 'shifts.manage', 'shifts.open', 'shifts.override', 'shifts.view',
  'system.view',
  'targets.create', 'targets.edit', 'targets.manage', 'targets.view',
  'units.manage', 'units.view',
  'vendors.create', 'vendors.edit', 'vendors.manage', 'vendors.view',
  'whatsapp.manage', 'whatsapp.view',
] as const;

export const DEFAULT_PERMISSIONS = permissionNames.map((name) => {
  const [module, ...actionParts] = name.split('.');
  const action = actionParts.join('.');
  return {
    name,
    module,
    action,
    description: `${action.replaceAll('_', ' ')} ${module.replaceAll('_', ' ')}`,
  };
});

/** Least-privilege permissions required by the existing cashier/POS UI. */
export const CASHIER_PERMISSION_NAMES: readonly string[] = [
  'pos.access', 'pos.cart.manage', 'pos.products.search', 'pos.offline.sync',
  'sales.create', 'sales.view',
  'products.view', 'inventory.view',
  'customers.view', 'customers.create',
  'receipts.view', 'receipts.print',
  'shifts.view', 'shifts.open', 'shifts.close',
  'settings.view',
];

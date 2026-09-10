import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createUserSchema } from '../src/api/validators/schemas.js';
import { CASHIER_PERMISSION_NAMES, DEFAULT_PERMISSIONS } from '../src/config/permissions.js';
import { hashPassword, verifyPassword } from '../src/utils/hashing.js';

describe('Production repair contracts', () => {
  it('accepts the sanitized Cashier creation payload', () => {
    const parsed = createUserSchema.parse({
      username: 'cashier_test',
      password: 'Cashier@Test123',
      fullName: 'Test Cashier',
      roleId: '11111111-1111-4111-8111-111111111111',
      branchId: '22222222-2222-4222-8222-222222222222',
      isActive: true,
    });
    assert.equal(parsed.isActive, true);
    assert.equal(parsed.branchId, '22222222-2222-4222-8222-222222222222');
    assert.equal('email' in parsed, false);
  });

  it('rejects null role/branch and weak passwords instead of weakening auth', () => {
    assert.equal(createUserSchema.safeParse({ username: 'cashier', password: 'password', fullName: 'Cashier', roleId: null, branchId: null }).success, false);
  });

  it('hashes a user password without retaining plaintext', async () => {
    const plaintext = 'Cashier@Test123';
    const hash = await hashPassword(plaintext);
    assert.notEqual(hash, plaintext);
    assert.equal(hash.includes(plaintext), false);
    assert.equal(await verifyPassword(plaintext, hash), true);
  });

  it('contains required admin and cashier route permissions', () => {
    const names = new Set(DEFAULT_PERMISSIONS.map(permission => permission.name));
    for (const required of ['branches.view', 'targets.view', 'shifts.view', 'vendors.view', 'reports.sales.view', 'cashier.manage']) {
      assert.equal(names.has(required), true, `missing ${required}`);
    }
    for (const required of ['pos.access', 'sales.create', 'shifts.open', 'shifts.close', 'pos.offline.sync']) {
      assert.equal(CASHIER_PERMISSION_NAMES.includes(required), true, `cashier missing ${required}`);
    }
    assert.equal(CASHIER_PERMISSION_NAMES.includes('cashier.manage'), false);
    assert.equal(CASHIER_PERMISSION_NAMES.includes('backup.manage'), false);
  });
});

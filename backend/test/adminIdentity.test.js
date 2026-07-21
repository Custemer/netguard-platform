const test = require('node:test');
const assert = require('node:assert/strict');
const {
  adminLoginEmail,
  adminPassword,
  adminUsername,
  isAdminUsername,
  isOwnerEmail,
} = require('../lib/adminIdentity');

const original = {
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_LOGIN_EMAIL: process.env.ADMIN_LOGIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
};

test.after(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('uses the requested admin/admin demo login by default', () => {
  delete process.env.ADMIN_LOGIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_USERNAME;
  assert.equal(adminUsername(), 'admin');
  assert.equal(adminPassword(), 'admin');
  assert.equal(adminLoginEmail(), 'admin@netguard.local');
  assert.equal(isAdminUsername(' ADMIN '), true);
  assert.equal(isOwnerEmail('ADMIN@NETGUARD.LOCAL'), true);
});

test('also recognizes the configured Google owner email', () => {
  process.env.ADMIN_EMAIL = 'owner@example.com';
  assert.equal(isOwnerEmail(' Owner@Example.com '), true);
  assert.equal(isOwnerEmail('member@example.com'), false);
});

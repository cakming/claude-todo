import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://localhost:3001/__test__/reset');
});

test('shows login, can register, and enters the app', async ({ page }) => {
  await page.goto('/');

  // Auth enabled -> login screen is shown first.
  await expect(page.getByRole('heading', { name: 'Login to Vibe Todo' })).toBeVisible();

  // Switch to register and create an account.
  await page.getByRole('button', { name: 'Register here' }).click();
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  await page.getByLabel('Username').fill('alice');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Secret12');
  await page.getByLabel('Confirm Password').fill('Secret12');
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Registered + logged in -> main app with the user shown in the header.
  await expect(page.getByRole('heading', { name: 'No Project Selected' })).toBeVisible();
  await expect(page.getByText('Logged in as')).toBeVisible();
  await expect(page.getByText('alice')).toBeVisible();
});

test('first user is admin: can see Users view and change password', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Register here' }).click();
  await page.getByLabel('Username').fill('boss');
  await page.getByLabel('Email').fill('boss@example.com');
  await page.getByLabel('Password', { exact: true }).fill('Secret12');
  await page.getByLabel('Confirm Password').fill('Secret12');
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.getByText('Logged in as')).toBeVisible();
  await expect(page.getByText('(admin)')).toBeVisible();

  // Admin-only Users view lists the account.
  await page.getByRole('button', { name: '👥 Users' }).click();
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  await expect(page.getByText('boss@example.com')).toBeVisible();

  // Change password: modal opens, submits, and closes on success.
  await page.getByRole('button', { name: 'Change Password' }).click();
  await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible();
  await page.getByPlaceholder('Current password').fill('Secret12');
  await page.getByPlaceholder(/New password/).fill('Brandnew1');
  await page.getByPlaceholder('Confirm new password').fill('Brandnew1');
  await page.getByRole('button', { name: 'Change Password' }).last().click();
  await expect(page.getByRole('heading', { name: 'Change Password' })).toHaveCount(0);
});

test('rejects login with wrong credentials', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Username').fill('nobody');
  await page.getByLabel('Password', { exact: true }).fill('Whatever12');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page.getByText(/Invalid username or password/)).toBeVisible();
});

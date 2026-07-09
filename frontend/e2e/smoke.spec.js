import { test, expect } from '@playwright/test';

// End-to-end smoke test of the core loop through the real UI + API + MongoDB:
//   create project -> epic -> feature -> task -> mark task done -> auto-status.

// Click a button until the expected modal/heading appears. The views re-render
// as background fetches settle, so a single click can land mid-render; retrying
// the click-then-assert makes the flow deterministic.
async function clickUntil(page, buttonName, expectVisible) {
  await expect(async () => {
    await page.getByRole('button', { name: buttonName }).click();
    await expect(expectVisible()).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

test('project -> epic -> feature -> task -> done propagates auto-status', async ({ page }) => {
  await page.goto('/');

  // --- Create a project (unique per run to avoid collisions on reuse) ---
  const projectName = `E2E Smoke ${Date.now()}`;
  const sanitized = projectName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  await clickUntil(page, '+ New Project', () => page.getByRole('heading', { name: 'Create New Project' }));
  await page.getByPlaceholder('My Awesome Project').fill(projectName);
  await page.getByRole('button', { name: 'Create Project' }).click();

  // The new project becomes the selected one and the Epics view loads empty.
  await expect(page.getByRole('heading', { name: 'No Epics Yet' })).toBeVisible();

  // --- Create an epic ---
  await clickUntil(page, 'Create First Epic', () => page.getByRole('heading', { name: 'Create New Epic' }));
  await page.getByPlaceholder('E-Commerce Platform v2').fill('Checkout Epic');
  await page.getByRole('button', { name: 'Create Epic' }).click();
  await expect(page.getByRole('heading', { name: /Checkout Epic/ })).toBeVisible();

  // --- Create a feature under that epic ---
  await clickUntil(page, '✨ Features', () => page.getByRole('button', { name: 'Create First Feature' }));
  await clickUntil(page, 'Create First Feature', () => page.getByRole('heading', { name: 'Create New Feature' }));
  const epicSelect = page.locator('select').filter({ has: page.getByRole('option', { name: 'Select an epic' }) });
  await epicSelect.selectOption({ label: 'Checkout Epic' });
  await page.getByPlaceholder('Shopping Cart', { exact: true }).fill('Cart Feature');
  await page.getByRole('button', { name: 'Create Feature' }).click();
  await expect(page.getByText('Cart Feature')).toBeVisible();

  // --- Create a task under that feature ---
  await clickUntil(page, '✅ Tasks', () => page.getByRole('button', { name: 'Create First Task' }));
  await clickUntil(page, 'Create First Task', () => page.getByRole('heading', { name: 'Create New Task' }));
  const featureSelect = page.locator('select').filter({ has: page.getByRole('option', { name: 'Select a feature' }) });
  await featureSelect.selectOption({ label: 'Checkout Epic / Cart Feature' });
  await page.getByPlaceholder('Add item to cart API').fill('Build cart endpoint');
  await page.getByRole('button', { name: 'Create Task' }).click();

  // Task lands in the "To Do" column of the Kanban board.
  await expect(page.getByText('To Do (1)')).toBeVisible();
  await expect(page.getByText('Done (0)')).toBeVisible();

  // --- Mark the task done via its inline status selector ---
  const taskCard = page.locator('.card', { hasText: 'Build cart endpoint' });
  await taskCard.getByRole('combobox').selectOption('done');

  // It moves to the Done column.
  await expect(page.getByText('Done (1)')).toBeVisible();
  await expect(page.getByText('To Do (0)')).toBeVisible();

  // --- Auto-status: the epic should now be Done at 100% on the Epics view ---
  await page.getByRole('button', { name: '📊 Epics' }).click();
  const epicCard = page.locator('.card', { hasText: 'Checkout Epic' });
  await expect(epicCard.getByText('Done')).toBeVisible();
  await expect(epicCard.getByText('100%')).toBeVisible();

  // Sanity: the sanitized project is the active selection.
  await expect(page.locator('select').first()).toHaveValue(sanitized);
});

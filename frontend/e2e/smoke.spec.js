import { test, expect } from '@playwright/test';
import { createProject, createEpic, createFeature, createTask, resetDb } from './helpers.js';

test.beforeEach(async ({ request }) => {
  await resetDb(request);
});

// Core-loop smoke test through the real UI + API + MongoDB:
//   create project -> epic -> feature -> task -> mark done -> auto-status.
test('project -> epic -> feature -> task -> done propagates auto-status', async ({ page }) => {
  await page.goto('/');

  const { sanitized } = await createProject(page);
  await createEpic(page, 'Checkout Epic');
  await createFeature(page, 'Checkout Epic', 'Cart Feature');
  await createTask(page, 'Checkout Epic / Cart Feature', 'Build cart endpoint');

  // Task lands in the "To Do" column of the Kanban board.
  await expect(page.getByText('To Do (1)')).toBeVisible();
  await expect(page.getByText('Done (0)')).toBeVisible();

  // Mark the task done via its inline status selector.
  const taskCard = page.locator('.card', { hasText: 'Build cart endpoint' });
  await taskCard.getByRole('combobox').selectOption('done');

  // It moves to the Done column.
  await expect(page.getByText('Done (1)')).toBeVisible();
  await expect(page.getByText('To Do (0)')).toBeVisible();

  // Auto-status: the epic should now be Done at 100% on the Epics view.
  await page.getByRole('button', { name: '📊 Epics' }).click();
  const epicCard = page.locator('.card', { hasText: 'Checkout Epic' });
  await expect(epicCard.getByText('Done')).toBeVisible();
  await expect(epicCard.getByText('100%')).toBeVisible();

  // Sanity: the sanitized project is the active selection.
  await expect(page.locator('select').first()).toHaveValue(sanitized);
});

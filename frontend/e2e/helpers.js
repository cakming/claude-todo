import { expect } from '@playwright/test';

// Drop the backend database so each test starts from a clean, isolated state
// (the E2E backend shares one ephemeral MongoDB across the whole run).
export async function resetDb(request) {
  const res = await request.post('http://localhost:3001/__test__/reset');
  expect(res.ok()).toBeTruthy();
}

// Click a button until the expected element appears. The views re-render as
// background fetches settle, so a single click can land mid-render; retrying
// the click-then-assert makes the flows deterministic.
export async function clickUntil(page, buttonName, expectVisible) {
  await expect(async () => {
    await page.getByRole('button', { name: buttonName }).click();
    await expect(expectVisible()).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}

let seq = 0;

// Create a fresh, uniquely named project. Returns { projectName, sanitized }.
export async function createProject(page) {
  const projectName = `E2E ${Date.now()}-${seq++}`;
  const sanitized = projectName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  await clickUntil(page, '+ New Project', () => page.getByRole('heading', { name: 'Create New Project' }));
  await page.getByPlaceholder('My Awesome Project').fill(projectName);
  await page.getByRole('button', { name: 'Create Project' }).click();
  await expect(page.getByRole('heading', { name: 'No Epics Yet' })).toBeVisible();

  return { projectName, sanitized };
}

// Create the first epic in the current (empty) project.
export async function createEpic(page, title) {
  await clickUntil(page, 'Create First Epic', () => page.getByRole('heading', { name: 'Create New Epic' }));
  await page.getByPlaceholder('E-Commerce Platform v2').fill(title);
  await page.getByRole('button', { name: 'Create Epic' }).click();
  await expect(page.getByRole('heading', { name: new RegExp(title) })).toBeVisible();
}

// Create the first feature under the named epic.
export async function createFeature(page, epicTitle, title) {
  await clickUntil(page, '✨ Features', () => page.getByRole('button', { name: 'Create First Feature' }));
  await clickUntil(page, 'Create First Feature', () => page.getByRole('heading', { name: 'Create New Feature' }));
  const epicSelect = page.locator('select').filter({ has: page.getByRole('option', { name: 'Select an epic' }) });
  await epicSelect.selectOption({ label: epicTitle });
  await page.getByPlaceholder('Shopping Cart', { exact: true }).fill(title);
  await page.getByRole('button', { name: 'Create Feature' }).click();
  await expect(page.getByText(title)).toBeVisible();
}

// Create the first task under the named feature ("Epic / Feature" label).
export async function createTask(page, featureLabel, title) {
  await clickUntil(page, '✅ Tasks', () => page.getByRole('button', { name: 'Create First Task' }));
  await clickUntil(page, 'Create First Task', () => page.getByRole('heading', { name: 'Create New Task' }));
  const featureSelect = page.locator('select').filter({ has: page.getByRole('option', { name: 'Select a feature' }) });
  await featureSelect.selectOption({ label: featureLabel });
  await page.getByPlaceholder('Add item to cart API').fill(title);
  await page.getByRole('button', { name: 'Create Task' }).click();
}

// Open a card's actions menu (the "⋯" button) and click a menu item.
export async function cardMenuAction(page, cardText, action) {
  const card = page.locator('.card', { hasText: cardText });
  await card.getByRole('button').first().click(); // the ⋯ toggle
  await card.getByRole('button', { name: action }).click();
}

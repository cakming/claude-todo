import { test, expect } from '@playwright/test';
import { createProject, createEpic, createFeature, createTask, cardMenuAction, resetDb } from './helpers.js';

test.beforeEach(async ({ request }) => {
  await resetDb(request);
});

test('editing an epic updates its title', async ({ page }) => {
  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Original Epic');

  await cardMenuAction(page, 'Original Epic', 'Edit');
  await expect(page.getByRole('heading', { name: 'Edit Epic' })).toBeVisible();

  const titleInput = page.getByPlaceholder('E-Commerce Platform v2');
  await expect(titleInput).toHaveValue('Original Epic'); // form is prefilled
  await titleInput.fill('Renamed Epic');
  await page.getByRole('button', { name: 'Update Epic' }).click();

  await expect(page.getByRole('heading', { name: /Renamed Epic/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Original Epic/ })).toHaveCount(0);
});

test('deleting an epic cascades and empties the project', async ({ page }) => {
  // The delete flow uses window.confirm(); auto-accept it.
  page.on('dialog', (d) => d.accept());

  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Doomed Epic');
  await createFeature(page, 'Doomed Epic', 'Doomed Feature');
  await createTask(page, 'Doomed Epic / Doomed Feature', 'Doomed Task');

  // Delete the epic from the Epics view.
  await page.getByRole('button', { name: '📊 Epics' }).click();
  await cardMenuAction(page, 'Doomed Epic', 'Delete');

  // The project is empty again...
  await expect(page.getByRole('heading', { name: 'No Epics Yet' })).toBeVisible();

  // ...and the cascade removed the feature too.
  await page.getByRole('button', { name: '✨ Features' }).click();
  await expect(page.getByRole('heading', { name: 'No Features Yet' })).toBeVisible();
});

test('search filters the epic list', async ({ page }) => {
  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Searchable Epic');

  const search = page.getByPlaceholder('Search epics...');
  await search.fill('zzz');
  await expect(page.getByRole('heading', { name: /Searchable Epic/ })).toHaveCount(0);
  await expect(page.getByText(/No epics match/)).toBeVisible();

  await search.fill('Search');
  await expect(page.getByRole('heading', { name: /Searchable Epic/ })).toBeVisible();
});

test('dragging a task to the Done column changes its status', async ({ page }) => {
  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Drag Epic');
  await createFeature(page, 'Drag Epic', 'Drag Feature');
  await createTask(page, 'Drag Epic / Drag Feature', 'Draggable Task');
  await expect(page.getByText('To Do (1)')).toBeVisible();

  const card = page.locator('.card', { hasText: 'Draggable Task' });
  const doneColumn = page.getByTestId('column-done');
  const from = await card.boundingBox();
  const to = await doneColumn.boundingBox();

  // Simulate a pointer drag past the 8px activation threshold, then drop.
  await page.mouse.move(from.x + from.width / 2, from.y + 12);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 20, from.y + 30, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 40, { steps: 10 });
  await page.mouse.up();

  await expect(page.getByText('Done (1)')).toBeVisible();
  await expect(page.getByText('To Do (0)')).toBeVisible();
});

test('tree view renders the full hierarchy', async ({ page }) => {
  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Tree Epic');
  await createFeature(page, 'Tree Epic', 'Tree Feature');
  await createTask(page, 'Tree Epic / Tree Feature', 'Tree Task');

  await page.getByRole('button', { name: '🌲 Tree View' }).click();

  await expect(page.getByRole('heading', { name: 'Tree Epic' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tree Feature' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Tree Task' })).toBeVisible();
});

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

test('activity feed lists recent changes', async ({ page }) => {
  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Activity Epic');

  await page.getByRole('button', { name: '📜 Activity' }).click();
  await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
  await expect(page.getByText(/Activity Epic/)).toBeVisible();
  await expect(page.getByText('created').first()).toBeVisible();
});

test('dark mode toggle flips and persists the theme', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const toggle = page.getByRole('button', { name: 'Toggle dark mode' });

  const wasDark = await html.evaluate((el) => el.classList.contains('dark'));
  await toggle.click();
  if (wasDark) {
    await expect(html).not.toHaveClass(/dark/);
  } else {
    await expect(html).toHaveClass(/dark/);
  }

  // Preference persists across a reload.
  const nowDark = await html.evaluate((el) => el.classList.contains('dark'));
  await page.reload();
  await expect(html).toHaveClass(nowDark ? /dark/ : /^(?!.*dark).*$/);
});

test('changes propagate to another tab in real time (websocket)', async ({ page, context }) => {
  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Realtime Epic');

  // A second tab on the same project (auto-selected — it's the only one).
  const pageB = await context.newPage();
  await pageB.goto('/');
  await expect(pageB.getByRole('heading', { name: /Realtime Epic/ })).toBeVisible();

  // Add a second epic in tab A...
  await page.getByRole('button', { name: '+ Add Epic' }).click();
  await page.getByPlaceholder('E-Commerce Platform v2').fill('Pushed Epic');
  await page.getByRole('button', { name: 'Create Epic' }).click();
  await expect(page.getByRole('heading', { name: /Pushed Epic/ })).toBeVisible();

  // ...and tab B sees it appear without any navigation or manual refresh.
  await expect(pageB.getByRole('heading', { name: /Pushed Epic/ })).toBeVisible();
  await pageB.close();
});

test('epics list paginates with a Load more button', async ({ page, request }) => {
  // Seed 11 epics directly via the API for speed.
  await request.post('http://localhost:3001/api/projects', { data: { name: 'paged' } });
  for (let i = 1; i <= 11; i++) {
    await request.post('http://localhost:3001/api/paged/epics', {
      data: { title: `Epic ${String(i).padStart(2, '0')}` }
    });
  }

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Epics' })).toBeVisible();

  // First page shows 9; Load more reveals the rest, then disappears.
  await expect(page.locator('.card')).toHaveCount(9);
  const loadMore = page.getByRole('button', { name: 'Load more' });
  await expect(loadMore).toBeVisible();
  await loadMore.click();
  await expect(page.locator('.card')).toHaveCount(11);
  await expect(loadMore).toHaveCount(0);
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

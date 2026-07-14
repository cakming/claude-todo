import { test, expect } from '@playwright/test';
import { createProject, createEpic, createFeature, createTask, cardMenuAction, resetDb, clickUntil } from './helpers.js';

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

test('undo restores a deleted epic and its children', async ({ page }) => {
  page.on('dialog', (d) => d.accept());

  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Undoable Epic');
  await createFeature(page, 'Undoable Epic', 'Undoable Feature');

  await page.getByRole('button', { name: '📊 Epics' }).click();
  await cardMenuAction(page, 'Undoable Epic', 'Delete');
  await expect(page.getByRole('heading', { name: 'No Epics Yet' })).toBeVisible();

  // The delete toast offers an Undo that restores the epic and its feature.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('heading', { name: /Undoable Epic/ })).toBeVisible();

  await page.getByRole('button', { name: '✨ Features' }).click();
  await expect(page.getByText('Undoable Feature')).toBeVisible();
});

test('trash: a deleted epic can be restored from the Trash view', async ({ page }) => {
  page.on('dialog', (d) => d.accept());

  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Trashable Epic');

  await cardMenuAction(page, 'Trashable Epic', 'Delete');
  await expect(page.getByRole('heading', { name: 'No Epics Yet' })).toBeVisible();

  // The deleted epic sits in the persistent Trash view.
  await page.getByRole('button', { name: '🗑 Trash' }).click();
  await expect(page.getByText('📊 Trashable Epic')).toBeVisible();

  // Restoring empties the trash and brings the epic back.
  await page.getByRole('button', { name: 'Restore' }).click();
  await expect(page.getByRole('heading', { name: 'Trash is empty' })).toBeVisible();

  await page.getByRole('button', { name: '📊 Epics' }).click();
  await expect(page.getByRole('heading', { name: /Trashable Epic/ })).toBeVisible();
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

test('search reaches epics beyond the first page (server-side)', async ({ page, request }) => {
  // Seed 12 epics; only the first 9 are loaded initially. A client-side filter
  // would miss "Epic 12" — server-side search must find it.
  await request.post('http://localhost:3001/api/projects', { data: { name: 'srv_search' } });
  for (let i = 1; i <= 12; i++) {
    await request.post('http://localhost:3001/api/srv_search/epics', {
      data: { title: `Epic ${String(i).padStart(2, '0')}` }
    });
  }

  await page.goto('/');
  await expect(page.locator('.card')).toHaveCount(9); // first page only

  await page.getByPlaceholder('Search epics...').fill('Epic 12');
  await expect(page.getByRole('heading', { name: /Epic 12/ })).toBeVisible();
  await expect(page.locator('.card')).toHaveCount(1);
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

test('bulk-selecting tasks and marking them done moves them together', async ({ page }) => {
  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Bulk Epic');
  await createFeature(page, 'Bulk Epic', 'Bulk Feature');
  await createTask(page, 'Bulk Epic / Bulk Feature', 'Bulk Task 1');

  // Add a second task under the same feature via the "+ Add Task" button.
  await page.getByRole('button', { name: '+ Add Task' }).click();
  await expect(page.getByRole('heading', { name: 'Create New Task' })).toBeVisible();
  const featureSelect = page.locator('select').filter({ has: page.getByRole('option', { name: 'Select a feature' }) });
  await featureSelect.selectOption({ label: 'Bulk Epic / Bulk Feature' });
  await page.getByPlaceholder('Add item to cart API').fill('Bulk Task 2');
  await page.getByRole('button', { name: 'Create Task' }).click();

  await expect(page.getByText('To Do (2)')).toBeVisible();

  // Select both, then mark them done in one action.
  await page.getByLabel('Select Bulk Task 1').check();
  await page.getByLabel('Select Bulk Task 2').check();
  await expect(page.getByText('2 selected')).toBeVisible();
  await page.getByRole('button', { name: 'Mark Done' }).click();

  await expect(page.getByText('Done (2)')).toBeVisible();
  await expect(page.getByText('To Do (0)')).toBeVisible();
});

test('docs: create a page, upload an image, and preview markdown', async ({ page }) => {
  await page.goto('/');
  await createProject(page);

  await page.getByRole('button', { name: '📄 Docs' }).click();
  await expect(page.getByRole('heading', { name: 'Docs' })).toBeVisible();

  await page.getByRole('button', { name: '+ New Page' }).click();
  await page.getByLabel('Page title').fill('My First Doc');
  await page.getByLabel('Page body').fill('# Hello\n\nSome **bold** text.');

  // Upload a 1x1 PNG through the hidden file input.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  await page.locator('input[accept="image/*"]').setInputFiles({ name: 'dot.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByText('Image uploaded')).toBeVisible();

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Page saved')).toBeVisible();

  // The saved page appears in the list.
  await expect(page.getByRole('button', { name: /My First Doc/ })).toBeVisible();

  // Preview renders the markdown heading and the uploaded image actually loads.
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.locator('.markdown-body h1')).toHaveText('Hello');
  const img = page.locator('.markdown-body img');
  await expect(img).toHaveAttribute('src', /\/uploads\//);
  await expect.poll(() => img.evaluate((el) => el.naturalWidth)).toBeGreaterThan(0);
});

test('sharing a project produces a working public read-only link', async ({ page }) => {
  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Shared Epic');
  await createFeature(page, 'Shared Epic', 'Shared Feature');

  // Create a share link; the toast carries the URL (clipboard may be blocked).
  await page.getByRole('button', { name: 'Share' }).click();
  const toast = page.getByText(/Read-only link/);
  await expect(toast).toBeVisible();
  const url = (await toast.textContent()).match(/https?:\/\/\S+/)[0];

  // The public link renders a standalone read-only view (no app chrome).
  await page.goto(url);
  await expect(page.getByText('Read-only · shared')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Shared Epic/ })).toBeVisible();
  await expect(page.getByText('✨ Shared Feature')).toBeVisible();
  // No editing affordances leak into the public view.
  await expect(page.getByRole('button', { name: '+ Add Epic' })).toHaveCount(0);
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

test('a task shows its due date and flags overdue', async ({ page }) => {
  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Due Epic');
  await createFeature(page, 'Due Epic', 'Due Feature');

  await clickUntil(page, '✅ Tasks', () => page.getByRole('button', { name: 'Create First Task' }));
  await clickUntil(page, 'Create First Task', () => page.getByRole('heading', { name: 'Create New Task' }));
  const featSel = page.locator('select').filter({ has: page.getByRole('option', { name: 'Select a feature' }) });
  await featSel.selectOption({ label: 'Due Epic / Due Feature' });
  await page.getByPlaceholder('Add item to cart API').fill('Task with due');
  await page.locator('input[type="date"]').fill('2020-01-01'); // in the past -> overdue
  await page.getByRole('button', { name: 'Create Task' }).click();

  const card = page.locator('.card', { hasText: 'Task with due' });
  await expect(card.getByText(/Due 2020-01-01/)).toBeVisible();
  await expect(card.getByText(/overdue/)).toBeVisible();
});

test('export then import round-trips a project', async ({ page }) => {
  await page.goto('/');
  await createProject(page);
  await createEpic(page, 'Portable Epic');

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export' }).click()
  ]);
  const filePath = await download.path();

  // New, empty project, then import the exported file into it.
  await createProject(page);
  await page.locator('input[type="file"]').setInputFiles(filePath);

  // Import replaces contents and pushes a realtime update -> the epic appears.
  await expect(page.getByRole('heading', { name: /Portable Epic/ })).toBeVisible();
});

test('number keys switch views', async ({ page }) => {
  await page.goto('/');
  await createProject(page);

  await page.keyboard.press('3');
  await expect(page.getByRole('heading', { name: 'No Tasks Yet' })).toBeVisible();
  await page.keyboard.press('1');
  await expect(page.getByRole('heading', { name: 'No Epics Yet' })).toBeVisible();
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

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ids = ['tro-choi-ghep-chu', 'tinh-diem-mon-hoc', 'tach-chuoi-con-doi-xung', 'sudoku', 'sinh-hoan-vi', 'liet-ke-tat-ca-hoan-vi', 'do-min', 'dia-chi-ip', 'truyvantong', 'tiem_sach', 'rut_bai_trung_thuong', 'nguoi_giao_com', 'duong_di_an_toan', 'do_an', 'daycontangdainhat', 'daicontangdainhat2'];

test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('algo-view', '2d')); });

test('all modules render, step, highlight both code tabs and reset', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  for (const id of ids) {
    await page.goto(`/#${id}`);
    await expect(page.getByTestId('visual-stage')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bước tiếp', exact: true })).toBeEnabled();
    await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
    await expect(page.locator('.code .highlight')).toHaveCount(1);
    await page.getByRole('tab', { name: 'C++ gốc' }).click(); await expect(page.locator('.code .highlight')).toHaveCount(1);
    const line = Number(await page.locator('.code .highlight em').innerText()); expect(line).toBeGreaterThan(0);
    const visible = await page.locator('.code .highlight').evaluate(element => {
      const parent = element.parentElement!.getBoundingClientRect(), rect = element.getBoundingClientRect();
      return rect.top >= parent.top && rect.bottom <= parent.bottom;
    }); expect(visible).toBe(true);
    await page.getByRole('button', { name: 'Làm lại', exact: true }).click(); await expect(page.locator('.code .highlight')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
  await page.goto('/#tro-choi-ghep-chu'); await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
  await page.screenshot({ path: `test-results/${testInfo.project.name}-word.png`, fullPage: true });
  await page.goto('/#sudoku'); await expect(page.locator('.grid-cell')).toHaveCount(81);
  await page.screenshot({ path: `test-results/${testInfo.project.name}-sudoku.png`, fullPage: true });
});

test('plays, pauses, seeks stored history, replays and stops immediately', async ({ page }) => {
  await page.goto('/#sinh-hoan-vi');
  await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
  await expect(page.locator('.step-count')).toHaveText('BƯỚC 1 / 1');
  await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
  await expect(page.locator('.step-count')).toHaveText('BƯỚC 2 / 2');
  await page.getByRole('button', { name: 'Bước trước', exact: true }).click(); await expect(page.locator('.step-count')).toHaveText('BƯỚC 1 / 2');
  await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click(); await expect(page.locator('.step-count')).toHaveText('BƯỚC 2 / 2');
  await page.getByRole('button', { name: 'Chạy', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Chi tiết', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Tạm dừng', exact: true }).click();
  const paused = await page.locator('.step-count').innerText(); await page.waitForTimeout(700); expect(await page.locator('.step-count').innerText()).toBe(paused);
  await page.getByRole('button', { name: 'Dừng', exact: true }).click(); await expect(page.locator('.status')).toHaveText('Đã dừng');
  await expect(page.getByRole('button', { name: 'Chạy', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Bước trước', exact: true }).click(); await expect(page.getByRole('button', { name: 'Bước tiếp', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Làm lại', exact: true }).click(); await expect(page.getByRole('button', { name: 'Chạy', exact: true })).toBeEnabled();
  await page.locator('#preset').selectOption('2'); await page.getByRole('button', { name: 'Chạy', exact: true }).click();
  await page.getByRole('button', { name: 'Dừng', exact: true }).click(); await expect(page.locator('.status')).toHaveText('Đã dừng');
});

test('finishes strict interval preset, restores completion after seeking', async ({ page }) => {
  await page.goto('/#do_an'); await page.locator('#preset').selectOption('1');
  await page.getByRole('slider', { name: 'Tốc độ', exact: true }).fill('16');
  await page.getByRole('button', { name: 'Chạy', exact: true }).click();
  await expect(page.locator('.status')).toHaveText('Đã hoàn thành'); await expect(page.getByTestId('result')).toContainText('7');
  await expect(page.locator('.output-row code')).toHaveText('7');
  await page.getByRole('button', { name: 'Bước trước', exact: true }).click();
  await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click(); await expect(page.locator('.status')).toHaveText('Đã hoàn thành');
});

test('keeps the final target when history is scrubbed rapidly', async ({ page }) => {
  await page.goto('/#truyvantong');
  for (let i = 1; i <= 3; i++) {
    await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click();
    await expect(page.locator('.step-count')).toHaveText(`BƯỚC ${i} / ${i}`);
  }
  await page.getByRole('slider', { name: 'Lịch sử thực thi' }).evaluate(element => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    for (const value of ['1', '2', '0']) { setter.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await expect(page.locator('.step-count')).toHaveText('BƯỚC 0 / 3');
  await expect(page.locator('.code .highlight')).toHaveCount(0);
});

test('warns and runs when IndexedDB is unavailable', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'indexedDB', { get() { throw new Error('Unavailable'); } }));
  await page.goto('/#truyvantong'); await expect(page.getByRole('alert')).toContainText('2.000');
  await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click(); await expect(page.locator('.step-count')).toHaveText('BƯỚC 1 / 1');
});

test('hash navigation and module search work', async ({ page }, testInfo) => {
  await page.goto('/');
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Thư viện thuật toán', exact: true }).click();
  await page.getByRole('textbox', { name: 'Tìm thuật toán' }).fill('fenwick');
  await page.getByRole('button', { name: /LIS với Fenwick/ }).click(); await expect(page).toHaveURL(/#daycontangdainhat$/);
  await page.goto('/#nguoi_giao_com'); await expect(page.locator('.tree-svg')).toBeVisible();
  const pixels = await page.locator('.tree-svg').screenshot(); expect(pixels.length).toBeGreaterThan(1000);
});

test('accessibility: labels, roles and readable contrast', async ({ page }, testInfo) => {
  await page.goto('/#tro-choi-ghep-chu');
  await expect(page.getByRole('button', { name: 'Chạy', exact: true })).toBeEnabled();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, message: n.failureSummary })) }))).toEqual([]);
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Thư viện thuật toán', exact: true }).click();
    const nav = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze(); expect(nav.violations).toEqual([]);
  }
});

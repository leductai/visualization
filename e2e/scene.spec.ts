import { expect, test, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function pixels(canvas: Locator) {
  return canvas.evaluate(element => {
    const source = element as HTMLCanvasElement, image = document.createElement('canvas');
    image.width = source.width; image.height = source.height;
    const context = image.getContext('2d')!; context.drawImage(source, 0, 0);
    const data = context.getImageData(0, 0, image.width, image.height).data;
    let occupied = 0, left = image.width, top = image.height, right = 0, bottom = 0;
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const index = (y * image.width + x) * 4;
      if (Math.min(data[index], data[index + 1], data[index + 2]) < 175) { occupied++; left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
    }
    return { occupied, left, top, right, bottom, width: image.width, height: image.height };
  });
}

test('all 16 Three.js scenes are nonblank, framed and synchronized', async ({ page }, info) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  const ids = ['tro-choi-ghep-chu', 'tinh-diem-mon-hoc', 'tach-chuoi-con-doi-xung', 'sudoku', 'sinh-hoan-vi', 'liet-ke-tat-ca-hoan-vi', 'do-min', 'dia-chi-ip', 'truyvantong', 'tiem_sach', 'rut_bai_trung_thuong', 'nguoi_giao_com', 'duong_di_an_toan', 'do_an', 'daycontangdainhat', 'daicontangdainhat2'];
  for (const id of ids) {
    await page.goto(`/#${id}`);
    const canvas = page.locator('.algorithm-canvas'); await expect(canvas).toHaveAttribute('data-ready', 'true');
    await canvas.scrollIntoViewIfNeeded(); await page.waitForTimeout(550);
    const sample = await pixels(canvas); expect(sample.occupied, id).toBeGreaterThan(150);
    expect(sample.left, id).toBeGreaterThan(2); expect(sample.right, id).toBeLessThan(sample.width - 2);
    expect(sample.top, id).toBeGreaterThan(2); expect(sample.bottom, id).toBeLessThan(sample.height - 2);
    await page.getByRole('button', { name: info.project.name === 'mobile' ? 'Bước tiếp trong cảnh' : 'Bước tiếp', exact: true }).click();
    await expect(page.locator('.scene-step small')).toHaveText('Bước 1');
    await canvas.scrollIntoViewIfNeeded(); await expect(canvas).toHaveAttribute('data-step', '1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (['tro-choi-ghep-chu', 'sudoku', 'nguoi_giao_com', 'daycontangdainhat'].includes(id)) {
      await page.waitForTimeout(450); await page.screenshot({ path: `test-results/${info.project.name}-3d-${id}.png`, fullPage: true });
    }
  }
  expect(errors).toEqual([]);
});

test('3D responds to steps, camera controls, drag, and motion preferences', async ({ page }, info) => {
  await page.goto('/#sinh-hoan-vi');
  const canvas = page.locator('.algorithm-canvas'); await expect(canvas).toHaveAttribute('data-ready', 'true');
  await canvas.scrollIntoViewIfNeeded(); await page.waitForTimeout(1000);
  const first = await canvas.screenshot();
  await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click(); await expect(page.locator('.scene-step small')).toHaveText('Bước 1');
  await canvas.scrollIntoViewIfNeeded(); await page.waitForTimeout(800); expect((await canvas.screenshot()).equals(first)).toBe(false);
  const step = await canvas.screenshot();
  await page.getByRole('button', { name: 'Phóng to', exact: true }).click(); expect((await canvas.screenshot()).equals(step)).toBe(false);
  await page.getByRole('button', { name: 'Đặt lại góc nhìn', exact: true }).click();
  if (info.project.name === 'desktop') {
    const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2 + 20, { steps: 8 }); await page.mouse.up();
    await page.waitForTimeout(400); expect((await canvas.screenshot()).equals(step)).toBe(false);
  }
  await page.getByRole('button', { name: 'Tự xoay cảnh', exact: true }).click();
  const frame = Number(await canvas.getAttribute('data-frames')); await page.waitForTimeout(350);
  expect(Number(await canvas.getAttribute('data-frames'))).toBeGreaterThan(frame + 2);
  await page.getByRole('button', { name: 'Tắt chuyển động', exact: true }).click();
  await expect(canvas).toHaveAttribute('data-motion', 'reduced'); await expect(page.getByRole('button', { name: 'Tự xoay cảnh', exact: true })).toBeDisabled();
  await canvas.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
  const stable = await canvas.screenshot(); await page.waitForTimeout(350); expect((await canvas.screenshot()).equals(stable)).toBe(true);
  await page.getByRole('button', { name: 'Chế độ 2D', exact: true }).click(); await expect(canvas).toHaveCount(0); await expect(page.locator('.array-cell')).toHaveCount(6);
  await page.getByRole('button', { name: 'Chế độ 3D', exact: true }).click(); await expect(page.locator('.algorithm-canvas')).toHaveAttribute('data-ready', 'true');
});

test('respects system reduced motion and accessible 3D controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/#sudoku');
  await expect(page.locator('.algorithm-canvas')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.getByRole('button', { name: 'Giảm chuyển động theo hệ thống' })).toBeDisabled();
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.failureSummary) }))).toEqual([]);
});

test('falls back to 2D when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args: any[]) { if (String(args[0]).startsWith('webgl')) return null; return original.apply(this, args as Parameters<typeof original>); } as typeof original;
  });
  await page.goto('/#tro-choi-ghep-chu');
  await expect(page.getByRole('alert')).toContainText('Đã chuyển về 2D');
  await expect(page.locator('.grid-cell')).toHaveCount(9);
  await page.getByRole('button', { name: 'Bước tiếp', exact: true }).click(); await expect(page.locator('.step-count')).toHaveText('BƯỚC 1 / 1');
});

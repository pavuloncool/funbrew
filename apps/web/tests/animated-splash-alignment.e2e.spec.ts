import { expect, test, type Page } from '@playwright/test';

type AlignmentMetrics = {
  centerFingerprintX: number;
  centerTextX: number;
  delta: number;
};

async function measureSplashAlignment(page: Page): Promise<AlignmentMetrics> {
  const splashButton = page.getByRole('button', { name: /fun•brew/i });
  await splashButton.waitFor({ state: 'visible', timeout: 10_000 });

  const metrics = await page.evaluate(async () => {
    const fingerprint = document.querySelector('img[alt="Fingerprint"]');
    const label = Array.from(document.querySelectorAll('p')).find(
      (p) => p.textContent?.trim() === 'fun•brew'
    );
    if (!(fingerprint instanceof HTMLImageElement) || !(label instanceof HTMLElement)) {
      return null;
    }

    const fingerprintRect = fingerprint.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();
    const image = new Image();
    image.src = fingerprint.src;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(image, 0, 0);

    const pixel = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let alphaSum = 0;
    let weightedX = 0;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const alpha = pixel[(y * canvas.width + x) * 4 + 3] ?? 0;
        if (alpha > 0) {
          alphaSum += alpha;
          weightedX += alpha * x;
        }
      }
    }
    if (alphaSum === 0) return null;

    const inkCenterX = weightedX / alphaSum;
    const centerFingerprintX =
      fingerprintRect.left + ((inkCenterX + 0.5) / canvas.width) * fingerprintRect.width;
    const centerTextX = labelRect.left + labelRect.width / 2;
    return {
      centerFingerprintX,
      centerTextX,
      delta: centerTextX - centerFingerprintX,
    };
  });

  expect(metrics).not.toBeNull();
  return metrics!;
}

test.describe('Animated splash alignment guard', () => {
  test('keeps fun•brew centered to fingerprint axis on desktop and mobile-wide viewports', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1728, height: 1117 });
    await page.goto('/');
    const desktop = await measureSplashAlignment(page);
    expect(Math.abs(desktop.delta)).toBeLessThanOrEqual(2);

    await page.setViewportSize({ width: 430, height: 932 });
    await page.goto('/');
    const mobile = await measureSplashAlignment(page);
    expect(Math.abs(mobile.delta)).toBeLessThanOrEqual(2);
  });
});

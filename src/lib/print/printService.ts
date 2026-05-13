export interface PrintOptions {
  title?: string;
  withBarcodes?: boolean;
  printDelay?: number;
  extraStyles?: string;
}

export type PrintResult =
  | { ok: true }
  | { ok: false; error: string };

export interface ThermalPrintOptions {
  title?: string;
  html: string;
  widthMm: number;
  heightMm: number;
  styles?: string;
  closeAfterPrint?: boolean;
}

function escapeTitle(title: string): string {
  return title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function waitForWindowLoad(printWindow: Window): Promise<void> {
  return new Promise((resolve) => {
    if (printWindow.document.readyState === 'complete') {
      resolve();
      return;
    }

    printWindow.addEventListener('load', () => resolve(), { once: true });
  });
}

async function waitForPrintableAssets(printWindow: Window): Promise<void> {
  await waitForWindowLoad(printWindow);

  if (printWindow.document.fonts?.ready) {
    await printWindow.document.fonts.ready;
  }

  const images = Array.from(printWindow.document.images);
  await Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve();

      return new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      });
    })
  );

  await new Promise<void>((resolve) => {
    printWindow.requestAnimationFrame(() => resolve());
  });
}

export async function printThermalLabel({
  title = 'Etiquettes',
  html,
  widthMm,
  heightMm,
  styles = '',
  closeAfterPrint = true,
}: ThermalPrintOptions): Promise<PrintResult> {
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    return { ok: false, error: 'La fenetre d impression a ete bloquee par le navigateur.' };
  }

  try {
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeTitle(title)}</title>
        <style>
          @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
          ${styles}
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);
    printWindow.document.close();

    await waitForPrintableAssets(printWindow);

    if (closeAfterPrint) {
      printWindow.onafterprint = () => printWindow.close();
    }

    printWindow.focus();
    printWindow.print();

    return { ok: true };
  } catch (error) {
    printWindow.close();

    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Impossible de preparer l impression.',
    };
  }
}

export function openPrintWindow(
  htmlContent: string,
  options: PrintOptions = {},
): (() => void) | null {
  const {
    title = 'Impression',
    printDelay = 200,
    extraStyles = '',
  } = options;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Impossible d ouvrir la fenetre d impression - popups bloques ?');
    return null;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>${escapeTitle(title)}</title>
      <style>
        @page { margin: 0; }
        body  { margin: 0; padding: 0; }
        ${extraStyles}
      </style>
    </head>
    <body>
      ${htmlContent}
      <script>
        window.onload = function () {
          setTimeout(function () {
            window.print();
            window.onafterprint = function () { window.close(); };
          }, ${printDelay});
        };
      <\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
  return () => printWindow.close();
}

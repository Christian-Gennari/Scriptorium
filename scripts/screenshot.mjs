import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCREENSHOTS = resolve(ROOT, 'screenshots');

const SAMPLE_CONTENT = `# The Art of Writing

Writing is not merely the act of putting words on a page. It is the delicate craft of arranging thoughts into patterns that resonate with the human mind. Every sentence is a thread in a tapestry that, when woven with care, becomes something far greater than the sum of its parts.

## On Discipline

The blank page has defeated more writers than poor grammar ever will. The secret is simple: sit down and begin. Not with grandeur, but with a single word. Then another. The momentum will carry you forward.

> "Start writing, no matter what. The water does not flow until the faucet is turned on."
> — Louis L'Amour

### Daily Practice

- Write at the same time each morning
- Set a timer for twenty-five minutes
- Do not edit until the session is complete
- Read what you wrote aloud
- Repeat tomorrow

## Finding Your Voice

Voice is not discovered through searching. It emerges through the accumulated weight of sentences written and rewritten. You cannot force originality; you can only create the conditions for it to arise naturally.

*This sample document is rendered using TipTap, a ProseMirror-based editor with rich text formatting.*`;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function startServer(port) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['server.js'], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(port), NODE_ENV: 'production' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let started = false;
    const check = (text) => {
      if (!started && (text.includes('listening') || text.includes('port'))) {
        started = true;
        resolve(proc);
      }
    };
    proc.stdout.on('data', (d) => check(d.toString()));
    proc.stderr.on('data', (d) => check(d.toString()));
    proc.on('error', reject);
    setTimeout(() => { if (!started) resolve(proc); }, 5000);
  });
}

async function shoot(page, name, setupFn) {
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(500);
  if (setupFn) await setupFn(page);
  await sleep(800);
  const path = resolve(SCREENSHOTS, name);
  await page.screenshot({ path, fullPage: false });
  console.log(`  ✓ ${name}`);
}

async function main() {
  const PORT = 9876;
  const URL = `http://localhost:${PORT}`;

  console.log('Starting server...');
  const server = await startServer(PORT);
  await sleep(1000);

  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/home/dev/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    env: {
      ...process.env,
      LD_LIBRARY_PATH: '/tmp/chromelibs',
    },
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const injectContent = async (p) => {
    await p.goto(URL, { waitUntil: 'networkidle' });
    await p.evaluate((content) => {
      localStorage.setItem('scriptorium-draft', JSON.stringify({
        content,
        name: 'the-art-of-writing.md',
      }));
    }, SAMPLE_CONTENT);
  };

  const setTheme = (p, theme) =>
    p.evaluate((t) => { document.body.className = `theme-${t}`; }, theme);

  // Prime localStorage with content on first visit
  await injectContent(page);

  console.log('Taking screenshots...');

  // 1. Hero — Writer's Study, clean editor
  await shoot(page, 'hero.png', async (p) => {
    setTheme(p, 'study');
    // Wait for TipTap to render
    await p.waitForSelector('.ProseMirror', { timeout: 5000 });
    await sleep(500);
  });

  // 2. Sidebar open
  await shoot(page, 'sidebar.png', async (p) => {
    setTheme(p, 'study');
    await p.waitForSelector('.ProseMirror', { timeout: 5000 });
    await p.evaluate(() => {
      document.getElementById('sidebar').classList.add('open');
      document.getElementById('sidebar-backdrop').classList.add('open');
      document.querySelector('.menu-toggle').classList.add('sidebar-open');
    });
    await sleep(400);
  });

  // 3. Paper theme
  await shoot(page, 'theme-paper.png', async (p) => {
    setTheme(p, 'paper');
    await p.waitForSelector('.ProseMirror', { timeout: 5000 });
    await sleep(400);
  });

  // 4. Dark theme
  await shoot(page, 'theme-dark.png', async (p) => {
    setTheme(p, 'dark');
    await p.waitForSelector('.ProseMirror', { timeout: 5000 });
    await sleep(400);
  });

  // 5. Settings panel
  await shoot(page, 'settings.png', async (p) => {
    setTheme(p, 'study');
    await p.waitForSelector('.ProseMirror', { timeout: 5000 });
    await p.evaluate(() => {
      const s = document.getElementById('sidebar');
      s.classList.add('open');
      s.classList.add('show-settings');
      document.getElementById('sidebar-backdrop').classList.add('open');
      document.querySelector('.menu-toggle').classList.add('sidebar-open');
    });
    await sleep(400);
  });

  await browser.close();
  server.kill();
  console.log('Done!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

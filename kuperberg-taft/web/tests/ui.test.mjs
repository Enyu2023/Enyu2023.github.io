import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const WEB_ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const PROJECT_ROOT = path.resolve(WEB_ROOT, "..");
const MIME = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

let browser;
let server;
let baseUrl;

before(async () => {
  server = createServer((request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const relative = decodeURIComponent(url.pathname === "/" ? "index.html" : url.pathname.slice(1));
      const requested = path.resolve(WEB_ROOT, relative);
      if (requested !== WEB_ROOT && !requested.startsWith(`${WEB_ROOT}${path.sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      const stat = fs.statSync(requested);
      const filename = stat.isDirectory() ? path.join(requested, "index.html") : requested;
      response.writeHead(200, {
        "content-type": MIME[path.extname(filename).toLowerCase()] || "application/octet-stream",
        "cache-control": "no-store"
      });
      fs.createReadStream(filename).pipe(response);
    } catch (_) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}/`;

  const candidates = [
    process.env.PLAYWRIGHT_CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ].filter(Boolean);
  const executablePath = candidates.find((candidate) => fs.existsSync(candidate));
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function openLab(options = {}) {
  const page = await browser.newPage({ viewport: options.viewport || { width: 1440, height: 1000 } });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  return { page, errors };
}

async function computeTemplate(templateId, expected, expectedStates = null) {
  const { page, errors } = await openLab();
  try {
    await page.selectOption("#template-select", templateId);
    assert.equal(await page.locator("#certified-input").isChecked(), true);
    assert.equal(await page.locator("#compute-button").isDisabled(), false);
    await page.locator("#compute-button").click();
    await page.waitForFunction(
      (value) => !document.querySelector("#result-card").hidden && document.querySelector("#exact-result").textContent === value,
      expected,
      { timeout: 20_000 }
    );
    assert.equal(await page.locator("#exact-result").textContent(), expected);
    if (expectedStates != null) {
      assert.equal(await page.locator("#states-result").textContent(), expectedStates);
    }
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
}

test("page loads every catalog entry with clean browser diagnostics", async () => {
  const { page, errors } = await openLab();
  try {
    assert.equal(await page.title(), "Kuperberg / Taft Diagram Lab");
    assert.equal(await page.locator("#template-select option").count(), 7);
    assert.equal(await page.locator("#lower-count").textContent(), "0");
    assert.equal(await page.locator("#upper-count").textContent(), "0");
    assert.equal(await page.locator("#crossing-count").textContent(), "0");
    assert.deepEqual(
      await page.evaluate(() => [Boolean(window.KuperbergTaft), Boolean(window.KuperbergCatalog)]),
      [true, true]
    );
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("verified S3, lens-space, and 3-torus templates compute exact browser oracles", async () => {
  await computeTemplate("s3-stabilized", "1", "3");
  await computeTemplate(
    "lens-l7-1",
    "7 - 35*zeta - 28*zeta^2 - 21*zeta^3 - 14*zeta^4 - 7*zeta^5",
    "6,468"
  );
  await computeTemplate("lens-l7-2", "0", "6,468");
  await computeTemplate("t3", "0", "27,000");
});

test("dynamic lens generator creates a certified, computable special diagram", async () => {
  const { page, errors } = await openLab();
  try {
    await page.locator("#lens-generator summary").click();
    await page.locator("#lens-n").fill("9");
    await page.locator("#lens-k").fill("2");
    await page.selectOption("#lens-framing", "auto");
    await page.locator("#generate-lens").click();
    assert.match(await page.locator("#diagram-name").inputValue(), /L\(9,2\)/);
    assert.equal(await page.locator("#crossing-count").textContent(), "9");
    assert.equal(await page.locator("#certified-input").isChecked(), true);
    assert.match(await page.locator("#validation-box").textContent(), /Valid schema-v1/);
    await page.locator("#compute-button").click();
    await page.waitForSelector("#result-card:not([hidden])", { timeout: 20_000 });
    assert.notEqual((await page.locator("#exact-result").textContent()).trim(), "");
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("overflowed numerical approximations are never presented as zero", async () => {
  const { page, errors } = await openLab();
  try {
    await page.selectOption("#template-select", "s3-stabilized");
    await page.evaluate(() => {
      const original = window.KuperbergTaft;
      window.KuperbergTaft = {
        ...original,
        evaluateDiagram() {
          return {
            diagram: "overflow display test",
            ell: 3,
            root_power: 1,
            root: "q = zeta, with zeta a primitive 3-rd root",
            exact: "999999999999999999999999999999999999",
            coefficients_mod_cyclotomic_polynomial: ["999999999999999999999999999999999999", "0"],
            approximate: { real: null, imag: null },
            states_evaluated: 1,
            estimated_work: 1,
          };
        },
      };
    });
    await page.locator("#compute-button").click();
    await page.waitForSelector("#result-card:not([hidden])");
    assert.equal(await page.locator("#approx-result").textContent(), "Unavailable (exact value retained)");
    assert.doesNotMatch(await page.locator("#approx-result").textContent(), /^0(?:\.0+)?\s*[+−-]/);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

async function drawClosedCurve(page, tool, userPoints) {
  await page.locator(`#tool-${tool}`).click();
  const canvas = page.locator("#diagram-canvas");
  const box = await canvas.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100, "canvas has a usable layout box");
  for (const [x, y] of userPoints) {
    await canvas.click({ position: { x: x / 900 * box.width, y: y / 560 * box.height } });
  }
  await page.locator("#finish-curve").click();
}

test("freehand editor detects crossings, accepts 4g/local numbers, computes, and exports strict JSON", async () => {
  const { page, errors } = await openLab();
  try {
    await drawClosedCurve(page, "lower", [[140, 170], [760, 170], [760, 390], [140, 390]]);
    await drawClosedCurve(page, "upper", [[390, 70], [510, 70], [510, 490], [390, 490]]);
    assert.equal(await page.locator("#lower-count").textContent(), "1");
    assert.equal(await page.locator("#upper-count").textContent(), "1");
    assert.equal(await page.locator("#crossing-count").textContent(), "4");
    assert.equal(await page.locator(".crossing-target").count(), 4);

    await page.locator(".crossing-target").first().click();
    const editedCrossing = await page.locator("#crossing-id-label").textContent();
    await page.locator("#antipode-power").fill("3");
    await page.locator("input[aria-label='alpha combing coordinate for handle 1']").fill("2");
    await page.locator("#certified-input").check();
    assert.equal(await page.locator("#compute-button").isDisabled(), false);
    await page.locator("#compute-button").click();
    await page.waitForSelector("#result-card:not([hidden])", { timeout: 20_000 });

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#export-button").click();
    const download = await downloadPromise;
    const downloadedPath = await download.path();
    const payload = JSON.parse(fs.readFileSync(downloadedPath, "utf8"));
    assert.equal(payload.schema_version, 1);
    assert.equal(payload.local_labels_certified, true);
    assert.deepEqual(payload.combing.alpha, [2]);
    assert.equal(payload.crossings.length, 4);
    assert.equal(payload.lower[0].crossings.length, 4);
    assert.equal(payload.upper[0].crossings.length, 4);
    assert.equal(payload.crossings.find((crossing) => crossing.id === editedCrossing).antipode_power, 3);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("compiled Python JSON imports as a protected order schematic and remains computable", async () => {
  const { page, errors } = await openLab();
  try {
    await page.locator("#file-input").setInputFiles(path.join(PROJECT_ROOT, "examples", "lens_L7_1.json"));
    await page.waitForFunction(() => document.querySelector("#crossing-count").textContent === "7");
    assert.equal(await page.locator("#certified-input").isChecked(), true);
    assert.match(await page.locator("#drawing-help").textContent(), /Compiled-order schematic/);
    await page.locator("#compute-button").click();
    await page.waitForFunction(() => document.querySelector("#exact-result").textContent.startsWith("7 - 35*zeta"));
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

test("mobile layout has no horizontal overflow and interactive controls have accessible names", async () => {
  const { page, errors } = await openLab({ viewport: { width: 390, height: 844 } });
  try {
    await page.selectOption("#template-select", "s3-stabilized");
    const audit = await page.evaluate(() => {
      const controls = Array.from(document.querySelectorAll("button, select, input:not([type='hidden']):not([hidden])"));
      const unnamed = controls.filter((element) => {
        const labels = element.labels ? Array.from(element.labels).map((label) => label.textContent.trim()).join("") : "";
        const text = element.textContent ? element.textContent.trim() : "";
        return !(element.getAttribute("aria-label") || element.getAttribute("aria-labelledby") || labels || text || element.title);
      }).map((element) => `${element.tagName.toLowerCase()}#${element.id}`);
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        unnamed,
        canvasLabel: document.querySelector("#diagram-canvas").getAttribute("aria-label")
      };
    });
    assert.ok(audit.overflow <= 1, `horizontal overflow was ${audit.overflow}px`);
    assert.deepEqual(audit.unnamed, []);
    assert.match(audit.canvasLabel, /Interactive Heegaard diagram/);
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }
});

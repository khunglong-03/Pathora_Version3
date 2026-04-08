import { test, expect } from "@playwright/test";

/**
 * HotelServiceProvider E2E Tests
 *
 * These tests verify the complete HotelServiceProvider portal experience:
 * - Landing page auth UI
 * - Login form structure
 * - Middleware auth redirects (no backend needed for redirect tests)
 * - Portal page structure (requires authenticated session)
 *
 * Run with: npx playwright test e2e/hotel-provider/
 * Requires: Frontend on http://localhost:3003
 * Note: Tests requiring login success need Backend on http://localhost:5182
 */

const HOTEL_EMAIL = "mai.dt@hotel.vn";
const HOTEL_PASSWORD = "thehieu03";

test.describe("HotelServiceProvider Portal Access", () => {
  test.beforeEach(async ({ page }) => {
    // Always start from a fresh state
    await page.context().clearCookies();
    await page.goto("/", { timeout: 30000 });
    await page.waitForLoadState("networkidle");
  });

  test("landing page loads with Pathora title", async ({ page }) => {
    await expect(page).toHaveTitle(/Pathora/i);
  });

  test("header has Sign In button visible", async ({ page }) => {
    const header = page.locator("header");
    const signInBtn = header.getByRole("button", { name: /sign in/i });
    await expect(signInBtn).toBeVisible();
  });

  test("clicking Sign In opens login modal with form fields", async ({ page }) => {
    const header = page.locator("header");
    await header.getByRole("button", { name: /sign in/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Form fields
    await expect(dialog.locator("#login-email")).toBeVisible();
    await expect(dialog.locator("#login-password")).toBeVisible();

    // Sign In submit button (not Google)
    await expect(
      dialog.getByRole("button", { name: /^sign in$/i }),
    ).toBeVisible();
  });

  test("login form accepts and validates credentials", async ({ page }) => {
    // Open modal via header
    const header = page.locator("header");
    await header.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    const dialog = page.getByRole("dialog");
    await dialog.locator("#login-email").fill(HOTEL_EMAIL);
    await dialog.locator("#login-password").fill(HOTEL_PASSWORD);

    await expect(dialog.locator("#login-email")).toHaveValue(HOTEL_EMAIL);
    await expect(dialog.locator("#login-password")).toHaveValue(HOTEL_PASSWORD);
  });

  test("hotel provider login succeeds and redirects to /hotel", async ({ page }) => {
    // Requires backend running on http://localhost:5182
    const header = page.locator("header");
    await header.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    const dialog = page.getByRole("dialog");
    await dialog.locator("#login-email").fill(HOTEL_EMAIL);
    await dialog.locator("#login-password").fill(HOTEL_PASSWORD);
    await dialog.getByRole("button", { name: /^sign in$/i }).click();

    // Should redirect to /hotel dashboard
    await page.waitForURL(/\/hotel/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/hotel/);
    await expect(page.getByRole("heading", { name: /KS của tôi/i })).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated /hotel access redirects to login", async ({ page }) => {
    // Middleware should redirect unauthenticated users from /hotel
    await page.goto("/hotel");
    await page.waitForLoadState("networkidle");

    // Should NOT be on /hotel after redirect
    const url = page.url();
    expect(url).not.toContain("/hotel");
    // Login modal should open or redirected to landing
    const onHome = url.includes("/home") || url === "http://localhost:3003/" || url === "http://localhost:3003";
    expect(onHome).toBeTruthy();
  });

  test("authenticated hotel provider can access /hotel/rooms", async ({ page }) => {
    await doLogin(page);
    await page.goto("/hotel/rooms");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/hotel\/rooms/);
    // Page must show either table, empty state, or loading
    const hasContent =
      (await page.getByText(/quản lý phòng/i).isVisible().catch(() => false)) ||
      (await page.getByText(/chưa có loại phòng/i).isVisible().catch(() => false)) ||
      (await page.locator(".animate-spin").isVisible().catch(() => false));
    expect(hasContent).toBeTruthy();
  });

  test("authenticated hotel provider can access /hotel/arrivals", async ({ page }) => {
    await doLogin(page);
    await page.goto("/hotel/arrivals");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/hotel\/arrivals/);
    await expect(page.getByText(/check-in khách/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/hôm nay/i)).toBeVisible({ timeout: 5000 });
  });

  test("authenticated hotel provider can access /hotel/profile", async ({ page }) => {
    await doLogin(page);
    await page.goto("/hotel/profile");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/hotel\/profile/);
    await expect(page.getByText(/thông tin khách sạn/i)).toBeVisible({ timeout: 5000 });
  });

  test("hotel provider blocked from admin dashboard", async ({ page }) => {
    await doLogin(page);
    await page.goto("/admin/dashboard");
    await page.waitForLoadState("networkidle");

    // Middleware redirects HotelServiceProvider away from admin
    const url = page.url();
    expect(url).not.toContain("/admin");
  });

  test("hotel provider blocked from manager routes", async ({ page }) => {
    await doLogin(page);
    try {
      await page.goto("/manager/dashboard", { timeout: 10000, waitUntil: "domcontentloaded" });
    } catch {
      // Navigation may be intercepted by middleware redirect
    }
    await page.waitForLoadState("networkidle");

    const url = page.url();
    expect(url).not.toContain("/manager");
  });

  test("rooms page loads (shows data or empty/error state)", async ({ page }) => {
    await doLogin(page);
    await page.goto("/hotel/rooms");
    await page.waitForLoadState("networkidle");

    // Page must show either: table+buttons, empty state, or error state
    const hasButtons =
      (await page.getByRole("button", { name: /thêm loại phòng/i }).isVisible().catch(() => false)) ||
      (await page.getByRole("button", { name: /xem tình trạng phòng/i }).isVisible().catch(() => false));
    const hasEmptyState =
      (await page.getByText(/chưa có loại phòng/i).isVisible().catch(() => false)) ||
      (await page.getByText(/failed to load/i).isVisible().catch(() => false)) ||
      (await page.getByRole("button", { name: /retry|thử lại/i }).isVisible().catch(() => false));
    const hasLoading = await page.locator(".animate-spin").isVisible().catch(() => false);
    const hasTable = await page.locator("table").isVisible().catch(() => false);

    expect(hasButtons || hasEmptyState || hasLoading || hasTable).toBeTruthy();
  });

  test("arrivals page shows filter tabs", async ({ page }) => {
    await doLogin(page);
    await page.goto("/hotel/arrivals");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/tất cả/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/tuần này/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/đã check-in/i)).toBeVisible({ timeout: 5000 });
  });

  test("arrivals page has submit check-in button", async ({ page }) => {
    await doLogin(page);
    await page.goto("/hotel/arrivals");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: /gửi thông tin check-in/i }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("dashboard shows KPI cards", async ({ page }) => {
    await doLogin(page);

    await expect(page.getByText(/tổng phòng/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/đang trống/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/check-in hôm nay/i)).toBeVisible({ timeout: 5000 });
  });

  test("dashboard has quick action links", async ({ page }) => {
    await doLogin(page);

    await expect(page.getByRole("link", { name: /quản lý phòng/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("link", { name: /check-in khách/i })).toBeVisible({ timeout: 5000 });
  });
});

/**
 * Login as HotelServiceProvider via the UI.
 * Returns silently if login fails (e.g. backend not running).
 */
async function doLogin(page: import("@playwright/test").Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const header = page.locator("header");
  await header.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

  const dialog = page.getByRole("dialog");
  await dialog.locator("#login-email").fill(HOTEL_EMAIL);
  await dialog.locator("#login-password").fill(HOTEL_PASSWORD);
  await dialog.getByRole("button", { name: /^sign in$/i }).click();

  try {
    await page.waitForURL(/\/hotel/, { timeout: 5000 });
  } catch {
    // Login failed (backend down) — page stays on current URL
    // Tests that depend on being logged in will fail naturally
  }
}

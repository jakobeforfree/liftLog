import { expect, test, type Page } from "@playwright/test";

// Uses a pre-confirmed test account in the Supabase project (see README).
const EMAIL = process.env.E2E_EMAIL ?? "e2e-a@liftlog.test";
const PASSWORD = process.env.E2E_PASSWORD ?? "";
const run = Date.now().toString(36);
const SQUAT = `E2E Squat ${run}`;
const BENCH = `E2E Bench ${run}`;

test.skip(!PASSWORD, "Set E2E_PASSWORD to run end-to-end tests");

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("heading", { name: "Start a workout" })).toBeVisible();
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("signed-out visitors are sent to login", async ({ page }) => {
  await page.goto("/exercises");
  await expect(page).toHaveURL(/\/login$/);
  await expectNoHorizontalScroll(page);
});

test("wrong password shows an error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Invalid login credentials")).toBeVisible();
});

test("log a workout, manage exercises, and see progress", async ({ page }) => {
  await login(page);
  await expectNoHorizontalScroll(page);

  // Start a workout; date defaults to today.
  await expect(page.getByLabel("Date")).not.toHaveValue("");
  await page.getByLabel("Notes").fill(`Leg day ${run}`);
  await page.getByRole("button", { name: "Start workout" }).click();
  await expect(page).toHaveURL(/\/workouts\/[0-9a-f-]{36}$/);
  await expect(page.getByText("No sets yet")).toBeVisible();

  // First set creates the exercise by typing its name.
  await page.getByLabel("Exercise").fill(SQUAT);
  await page.getByLabel("Weight (lb)").fill("135");
  await page.getByLabel("Reps").fill("5");
  await page.getByRole("button", { name: "Add set" }).click();
  const squat = page.getByRole("region", { name: SQUAT });
  await expect(squat.getByText("135 lb × 5")).toBeVisible();

  // Form is prefilled from the last set, so repeating is one tap.
  await expect(page.getByLabel("Exercise")).toHaveValue(SQUAT);
  await expect(page.getByLabel("Weight (lb)")).toHaveValue("135");
  await expect(page.getByLabel("Reps")).toHaveValue("5");
  await page.getByRole("button", { name: "Add set" }).click();
  await expect(squat.getByText("135 lb × 5")).toHaveCount(2);

  await page.getByLabel("Weight (lb)").fill("147.5");
  await page.getByLabel("Reps").fill("3");
  await page.getByRole("button", { name: "Add set" }).click();
  await expect(squat.getByText("147.5 lb × 3")).toBeVisible();

  // Case-insensitive match reuses the existing exercise instead of duplicating it.
  await page.getByLabel("Exercise").fill(SQUAT.toUpperCase());
  await page.getByLabel("Weight (lb)").fill("95");
  await page.getByLabel("Reps").fill("10");
  await page.getByRole("button", { name: "Add set" }).click();
  await expect(squat.getByText("95 lb × 10")).toBeVisible();

  await page.getByLabel("Exercise").fill(BENCH);
  await page.getByLabel("Weight (lb)").fill("95");
  await page.getByLabel("Reps").fill("8");
  await page.getByRole("button", { name: "Add set" }).click();
  await expect(page.getByRole("region", { name: BENCH }).getByText("95 lb × 8")).toBeVisible();

  // Delete a set.
  await squat.getByRole("button", { name: "Delete set 4" }).click();
  await expect(squat.getByText("95 lb × 10")).toHaveCount(0);
  await expect(squat.getByRole("listitem")).toHaveCount(3);
  await expectNoHorizontalScroll(page);
  const workoutUrl = page.url();

  // History on the home screen.
  await page.getByRole("link", { name: "Workouts", exact: true }).click();
  const entry = page.getByRole("link").filter({ hasText: `Leg day ${run}` });
  await expect(entry).toContainText("4 sets");
  await expect(entry).toContainText(`${SQUAT} · ${BENCH}`);

  // Exercises tab: both saved, plus one added directly.
  await page.getByRole("link", { name: "Exercises", exact: true }).click();
  await expect(page.getByRole("link", { name: new RegExp(`${SQUAT}\\s*3 sets logged`) })).toBeVisible();
  await page.getByLabel("Exercise name").fill(`E2E Row ${run}`);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("link", { name: new RegExp(`E2E Row ${run}\\s*0 sets logged`) })).toBeVisible();
  await page.getByLabel("Exercise name").fill(`e2e row ${run}`);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText(new RegExp(`E2E Row ${run}`, "i"))).toHaveCount(1);
  await expectNoHorizontalScroll(page);

  // Progress for squat.
  await page.getByRole("link", { name: new RegExp(SQUAT) }).click();
  await expect(page).toHaveURL(/\/progress\?exercise=/);
  await expect(page.getByRole("heading", { name: SQUAT })).toBeVisible();
  await expect(page.getByText("Heaviest").locator("..")).toContainText("147.5 lb");
  // Best e1RM: max(135 × (1 + 5/30), 147.5 × (1 + 3/30)) = 162.3 (rounded to 0.1)
  await expect(page.getByText("Best e1RM").locator("..")).toContainText("162.3 lb");
  await expect(page.getByRole("img", { name: /Estimated 1RM/ })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.screenshot({ path: "test-results/progress.png", fullPage: true });

  // Clean up: delete the workout, then this run's exercises.
  await page.goto(workoutUrl);
  await page.screenshot({ path: "test-results/workout.png", fullPage: true });
  await page.getByText("Delete this workout").click();
  await page.getByRole("button", { name: /Yes, delete workout/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(`Leg day ${run}`)).toHaveCount(0);
  await page.screenshot({ path: "test-results/home.png", fullPage: true });

  await page.getByRole("link", { name: "Exercises", exact: true }).click();
  await page.screenshot({ path: "test-results/exercises.png", fullPage: true });
  for (const name of [SQUAT, BENCH, `E2E Row ${run}`]) {
    const row = page.getByRole("listitem").filter({ hasText: name });
    await page.getByLabel(`Delete ${name}`).click();
    await row.getByRole("button", { name: "Confirm delete" }).click();
    await expect(page.getByText(name)).toHaveCount(0);
  }

  // Log out and confirm the session is gone.
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

import { Router } from "express";
import { MessController } from "../controllers/mess.controller";
import {
  requireAuth,
  requirePermission,
} from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validateRequest";
import {
  createMenuSchema,
  updateMenuSchema,
  selectMealSchema,
  overrideSelectionSchema,
  kitchenRosterQuerySchema,
  submitFeedbackSchema,
} from "../validations/mess.validation";

const router = Router();

// ── Daily Menus ────────────────────────────────────────────────────────────

// POST /api/v1/mess/menu - Admin/Mess Staff creates a meal menu
router.post(
  "/menu",
  requireAuth,
  requirePermission("mess:manage_menu"),
  validateRequest(createMenuSchema),
  MessController.createMenu
);

// PUT /api/v1/mess/menu/:id - Admin/Mess Staff updates a menu
router.put(
  "/menu/:id",
  requireAuth,
  requirePermission("mess:manage_menu"),
  validateRequest(updateMenuSchema),
  MessController.updateMenu
);

// DELETE /api/v1/mess/menu/:id - Admin/Mess Staff deletes a menu
router.delete(
  "/menu/:id",
  requireAuth,
  requirePermission("mess:manage_menu"),
  MessController.deleteMenu
);

// GET /api/v1/mess/menu - Display upcoming menus (default: next 3 days)
router.get(
  "/menu",
  requireAuth,
  MessController.getMenus
);

// ── Meal Selections & Cutoff ───────────────────────────────────────────────

// POST /api/v1/mess/selection - Student submits lunch choice before cutoff
router.post(
  "/selection",
  requireAuth,
  requirePermission("mess:select_meal"),
  validateRequest(selectMealSchema),
  MessController.selectMeal
);

// GET /api/v1/mess/selection/me - Student views their lunch selection for date
router.get(
  "/selection/me",
  requireAuth,
  requirePermission("mess:select_meal"),
  MessController.getMySelection
);

// PATCH /api/v1/mess/selection/override - Admin overrides choice post-cutoff with audit log
router.patch(
  "/selection/override",
  requireAuth,
  requirePermission("mess:override_selection"),
  validateRequest(overrideSelectionSchema),
  MessController.overrideSelection
);

// ── Reports & Rosters ──────────────────────────────────────────────────────

// GET /api/v1/mess/reports/daily-kitchen - Kitchen roster with confirmed counts
router.get(
  "/reports/daily-kitchen",
  requireAuth,
  requirePermission("mess:view_roster"),
  validateRequest(kitchenRosterQuerySchema),
  MessController.getDailyKitchenReport
);

// ── Ratings & Feedback ─────────────────────────────────────────────────────

// POST /api/v1/mess/feedback - Student submits meal rating and feedback
router.post(
  "/feedback",
  requireAuth,
  requirePermission("mess:feedback"),
  validateRequest(submitFeedbackSchema),
  MessController.submitFeedback
);

// GET /api/v1/mess/feedback - View feedback (Students: own; Admins/Staff: all + summary)
router.get(
  "/feedback",
  requireAuth,
  requirePermission("mess:feedback", "mess:view_roster", "mess:manage_menu"),
  MessController.listFeedback
);

export default router;

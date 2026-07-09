import { Router } from "express";
import {
  getUsers,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
} from "@/controllers/user.controller";
import { protect } from "@/middlewares/auth.middleware";
import { restrictTo } from "@/middlewares/admin.middleware";
import { validate } from "@/middlewares/validate.middleware";
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from "@/validators/user.validator";

const router = Router();

// Protect all routes under /api/v1/users to admin role only
router.use(protect, restrictTo("admin"));

// GET /api/v1/users - Retrieve paginated & searched users
// POST /api/v1/users - Create new client/employee user
router
  .route("/")
  .get(getUsers)
  .post(validate({ body: createUserSchema }), createUser);

// PATCH /api/v1/users/:id - Update user fields/status
// DELETE /api/v1/users/:id - Delete user
router
  .route("/:id")
  .patch(validate({ body: updateUserSchema }), updateUser)
  .delete(deleteUser);

// POST /api/v1/users/:id/reset-password - Reset user password
router.post("/:id/reset-password", validate({ body: resetPasswordSchema }), resetPassword);

export default router;

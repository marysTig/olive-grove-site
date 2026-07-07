import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import User from '@/models/User.model';

const normalizeRole = (value: unknown): 'admin' | 'client' => {
  if (value === 'admin' || value === 'client') return value;
  return 'client';
};

/**
 * GET /api/v1/users
 * Retrieve users with search, filtering, and pagination.
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Build filter query
  const query: Record<string, any> = {};

  // Search by name or email
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search as string, 'i');
    query.$or = [{ fullName: searchRegex }, { email: searchRegex }];
  }

  // Filter by role
  if (req.query.role) {
    query.role = req.query.role;
  }

  // Filter by status (active/inactive)
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  ApiResponse.success(
    res,
    {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
    'Users retrieved successfully'
  );
});

/**
 * POST /api/v1/users
 * Create a new user (admin or employee/client).
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, password, role } = req.body;

  // Check if email already registered
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('Email address is already in use');
  }

  const user = await User.create({
    fullName,
    email,
    passwordHash: password,
    role: normalizeRole(role),
    isActive: true,
  });

  ApiResponse.created(res, { user }, 'User created successfully');
});

/**
 * PATCH /api/v1/users/:id
 * Update user details or toggle status.
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { fullName, email, role, isActive } = req.body;
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Prevent admin from deactivating themselves
  if (isActive === false && req.user?.id === id) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (email !== undefined) {
    if (email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        throw ApiError.conflict('Email address is already in use');
      }
    }
    user.email = email;
  }
  if (role !== undefined) {
    // Prevent admin from changing their own role
    if (role !== user.role && req.user?.id === id) {
      throw ApiError.badRequest('You cannot change your own role');
    }
    user.role = normalizeRole(role);
  }
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  ApiResponse.success(res, { user }, 'User updated successfully');
});

/**
 * POST /api/v1/users/:id/reset-password
 * Reset user password.
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body;
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  user.passwordHash = password; // Trigger mongoose pre-save hook to hash
  await user.save();

  ApiResponse.success(res, null, 'User password reset successfully');
});

/**
 * DELETE /api/v1/users/:id
 * Delete a user. Admins cannot delete themselves.
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (req.user?.id === id) {
    throw ApiError.badRequest('You cannot delete your own administrative account');
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  ApiResponse.success(res, null, 'User deleted successfully');
});

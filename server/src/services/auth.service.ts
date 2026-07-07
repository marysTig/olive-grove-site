import { Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '@/models/User.model';
import { env } from '@/config/env.config';
import { ApiError } from '@/utils/ApiError';

export class AuthService {
  /**
   * Authenticate a user with email and password.
   * Returns the user document (with passwordHash for verification).
   */
  static async login(email: string, password: string): Promise<IUser> {
    // 1. Find user by email — explicitly select passwordHash
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // 2. Check if account is active
    if (!user.isActive) {
      throw ApiError.forbidden(
        'Your account has been deactivated. Contact an administrator.'
      );
    }

    // 3. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // 4. Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save({ validateModifiedOnly: true });

    return user;
  }

  /**
   * Generate a signed JWT for the given user.
   */
  static generateToken(user: IUser): string {
    const payload = {
      id: user._id.toString(),
      role: user.role,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as string & { __brand: 'StringValue' },
    } as jwt.SignOptions);
  }

  /**
   * Set the JWT as an HttpOnly cookie on the response.
   */
  static setTokenCookie(res: Response, token: string): void {
    const cookieOptions: {
      expires: Date;
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      path: string;
    } = {
      expires: new Date(
        Date.now() + env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
    };

    res.cookie('jwt', token, cookieOptions);
  }

  /**
   * Clear the JWT cookie (logout).
   */
  static clearTokenCookie(res: Response): void {
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });
  }

  /**
   * Get a user by ID (for session restoration via /me endpoint).
   * Returns null if user not found or inactive.
   */
  static async getUserById(id: string): Promise<IUser | null> {
    const user = await User.findById(id);
    if (!user || !user.isActive) return null;
    return user;
  }
}

import { Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabase } from "@server/database/supabase";
import { env } from "@server/config/env.config";
import { ApiError } from "@server/utils/ApiError";

export interface IUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin: Date | null;
  language: string;
}

export class AuthService {
  /**
   * Authenticate a user with email and password.
   * Returns the user object.
   */
  static async login(email: string, password: string): Promise<IUser> {
    console.log("Login attempt:", { email, password });
    const { data: user, error } = await supabase
      .from("mongo_users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    console.log("Supabase fetch:", { user, error });

    if (error || !user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    if (!user.is_active) {
      throw ApiError.forbidden("Your account has been deactivated. Contact an administrator.");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("Password match:", { isMatch, inputPassword: password, hash: user.password_hash });

    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Update last login
    await supabase
      .from("mongo_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      lastLogin: user.last_login ? new Date(user.last_login) : null,
      language: user.language,
    };
  }

  /**
   * Generate a signed JWT for the given user.
   */
  static generateToken(user: IUser): string {
    const payload = {
      id: user.id,
      role: user.role,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as string & { __brand: "StringValue" },
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
      sameSite: "strict" | "lax" | "none";
      path: string;
    } = {
      expires: new Date(Date.now() + env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    };

    res.cookie("jwt", token, cookieOptions);
  }

  /**
   * Clear the JWT cookie (logout).
   */
  static clearTokenCookie(res: Response): void {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
  }

  /**
   * Get a user by ID (for session restoration via /me endpoint).
   * Returns null if user not found or inactive.
   */
  static async getUserById(id: string): Promise<IUser | null> {
    const { data: user, error } = await supabase
      .from("mongo_users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !user || !user.is_active) return null;
    
    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      lastLogin: user.last_login ? new Date(user.last_login) : null,
      language: user.language,
    };
  }
}

import { Response } from "express";
import { supabase, supabaseAuthClient } from "@server/database/supabase";
import { env } from "@server/config/env.config";
import { ApiError } from "@server/utils/ApiError";
import { getUserRole, toApiRole } from "@server/utils/db-helpers";

export interface IUser {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "client";
  isActive: boolean;
  lastLogin: Date | null;
  language: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class AuthService {
  static async login(email: string, password: string): Promise<{ user: IUser; session: AuthSession }> {
    if (!email || !password) {
      throw ApiError.badRequest("Email and password are required");
    }

    const { data, error } = await supabaseAuthClient.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error || !data.user || !data.session) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const user = await AuthService.getUserById(data.user.id);
    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    if (!user.isActive) {
      throw ApiError.forbidden("Your account has been deactivated. Contact an administrator.");
    }

    return {
      user,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
      },
    };
  }

  static async verifyAccessToken(token: string): Promise<IUser> {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw ApiError.unauthorized("Invalid or expired session");
    }

    const user = await AuthService.getUserById(data.user.id);
    if (!user) {
      throw ApiError.unauthorized("The user belonging to this token no longer exists.");
    }

    if (!user.isActive) {
      throw ApiError.forbidden("Your account has been deactivated. Contact an administrator.");
    }

    return user;
  }

  static setSessionCookies(res: Response, session: AuthSession): void {
    const maxAgeMs = Math.max((session.expiresAt - Math.floor(Date.now() / 1000)) * 1000, 0);
    const cookieOptions = {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? ("strict" as const) : ("lax" as const),
      path: "/",
      maxAge: maxAgeMs,
    };

    res.cookie("sb-access-token", session.accessToken, cookieOptions);
    res.cookie("sb-refresh-token", session.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  static clearSessionCookies(res: Response): void {
    res.clearCookie("sb-access-token", { path: "/" });
    res.clearCookie("sb-refresh-token", { path: "/" });
    res.clearCookie("jwt", { path: "/" });
  }

  static extractTokenFromRequest(req: {
    headers: { authorization?: string };
    cookies?: Record<string, string | undefined>;
  }): string | undefined {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      return authHeader.split(" ")[1];
    }

    return req.cookies?.["sb-access-token"] ?? req.cookies?.jwt;
  }

  static async getUserById(id: string): Promise<IUser | null> {
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id);
    if (authError || !authUser.user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, language, is_active")
      .eq("id", id)
      .maybeSingle();

    const role = await getUserRole(id);

    return {
      id,
      fullName: profile?.name ?? authUser.user.user_metadata?.name ?? authUser.user.email ?? "",
      email: authUser.user.email ?? "",
      role: toApiRole(role),
      isActive: profile?.is_active ?? true,
      lastLogin: authUser.user.last_sign_in_at ? new Date(authUser.user.last_sign_in_at) : null,
      language: profile?.language ?? "fr",
    };
  }

  static async verifyCurrentPassword(userId: string, password: string): Promise<void> {
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser.user?.email;
    if (!email) {
      throw ApiError.notFound("User not found");
    }

    const { error } = await supabaseAuthClient.auth.signInWithPassword({ email, password });
    if (error) {
      throw ApiError.unauthorized("Current password is incorrect");
    }
  }
}

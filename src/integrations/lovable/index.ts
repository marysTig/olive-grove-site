// This bridge is intentionally kept as a lightweight no-op so the storefront
// stays fully on the local Express backend instead of depending on Supabase.

import { createLovableAuth } from "@lovable.dev/cloud-auth-js";

const lovableAuth = createLovableAuth();

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (
      provider: "google" | "apple" | "microsoft" | "lovable",
      opts?: SignInOptions,
    ) => {
      const result = await lovableAuth.signInWithOAuth(provider, {
        redirect_uri: opts?.redirect_uri,
        extraParams: {
          ...opts?.extraParams,
        },
      });

      if (result.redirected || result.error) {
        return result;
      }

      return {
        ...result,
        error: new Error("OAuth sign-in is handled by the local storefront auth flow."),
      };
    },
  },
};

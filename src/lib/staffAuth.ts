/**
 * Staff signup is request-only. Creating an auth user does not grant a row in
 * `user_roles`. Admin access requires one of the roles below, assigned later
 * from the Team tab (manage-staff). These helpers keep the Auth page, the
 * Admin gate, and the Team UI on the same rules.
 */

export const STAFF_ROLES = ["admin", "manager", "agent", "employee"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const PENDING_APPROVAL_NOTICE =
  "This account is waiting for an admin to approve it. You can sign in after it is approved.";

export const CONFIRM_EMAIL_NOTICE =
  "Check your email and confirm this address. After an admin approves the account, sign in here.";

export const ALREADY_REGISTERED_NOTICE =
  "An account with this email already exists. Sign in, or ask an admin to approve it if you have not been given access yet.";

export function highestStaffRole(roles: readonly string[]): StaffRole | null {
  for (const role of STAFF_ROLES) {
    if (roles.includes(role)) return role;
  }
  return null;
}

export interface SignupResult {
  error: { message: string } | null;
  user: { identities?: unknown[] | null } | null;
  session: unknown | null;
}

export type SignupOutcome =
  | { kind: "confirm_email"; message: string }
  | { kind: "already_registered"; message: string }
  | { kind: "pending_approval"; message: string }
  | { kind: "error"; message: string };

/**
 * Supabase returns a user with an empty `identities` array and no error when
 * email confirmation is on and the address is already registered. A null
 * session on an otherwise new user means the confirmation email still has to
 * be opened. A session means the project auto-confirms, but this app still
 * withholds dashboard access until a staff role exists.
 */
export function interpretSignup(result: SignupResult): SignupOutcome {
  if (result.error) {
    const message = result.error.message || "Failed to sign up";
    if (/already registered|already been registered|already exists/i.test(message)) {
      return { kind: "already_registered", message: ALREADY_REGISTERED_NOTICE };
    }
    if (/redirect/i.test(message)) {
      return {
        kind: "error",
        message:
          "Signup could not finish because this site URL is not on the Supabase auth redirect allow list. Add this site's /auth URL in Authentication → URL configuration, then try again.",
      };
    }
    if (/email not confirmed/i.test(message)) {
      return { kind: "confirm_email", message: CONFIRM_EMAIL_NOTICE };
    }
    return { kind: "error", message };
  }

  const identities = result.user?.identities;
  if (result.user && Array.isArray(identities) && identities.length === 0) {
    return { kind: "already_registered", message: ALREADY_REGISTERED_NOTICE };
  }

  if (!result.session) {
    return { kind: "confirm_email", message: CONFIRM_EMAIL_NOTICE };
  }

  return { kind: "pending_approval", message: PENDING_APPROVAL_NOTICE };
}

export function signInErrorMessage(message: string): string {
  if (/email not confirmed/i.test(message)) {
    return "Confirm the email from your inbox before signing in. If it never arrived, ask an admin to approve the account — approval also confirms the email.";
  }
  if (/invalid login credentials/i.test(message)) {
    return "Email or password is incorrect.";
  }
  return message || "Failed to sign in";
}

/** supabase-js hides non-2xx function bodies behind FunctionsHttpError.context. */
export async function readEdgeFunctionError(error: unknown): Promise<string> {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        const body = await context.clone().json();
        if (body && typeof body.error === "string" && body.error.trim()) {
          return body.error;
        }
      } catch {
        // Response body was not JSON.
      }
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return "Request failed";
}

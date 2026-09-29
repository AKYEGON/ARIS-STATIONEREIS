import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALREADY_REGISTERED_NOTICE,
  CONFIRM_EMAIL_NOTICE,
  PENDING_APPROVAL_NOTICE,
  highestStaffRole,
  interpretSignup,
  readEdgeFunctionError,
  signInErrorMessage,
} from "./staffAuth.ts";

describe("highestStaffRole", () => {
  it("ranks admin above every other staff role", () => {
    assert.equal(highestStaffRole(["employee", "admin", "agent"]), "admin");
    assert.equal(highestStaffRole(["agent", "manager"]), "manager");
    assert.equal(highestStaffRole(["employee", "agent"]), "agent");
    assert.equal(highestStaffRole(["employee"]), "employee");
  });

  it("treats a signup with no staff role as pending", () => {
    assert.equal(highestStaffRole([]), null);
    assert.equal(highestStaffRole(["user"]), null);
  });
});

describe("interpretSignup", () => {
  it("asks the user to confirm email when signup returns no session", () => {
    const outcome = interpretSignup({
      error: null,
      user: { identities: [{ id: "identity-1" }] },
      session: null,
    });
    assert.equal(outcome.kind, "confirm_email");
    assert.equal(outcome.message, CONFIRM_EMAIL_NOTICE);
  });

  it("does not claim a new account when Supabase obfuscates an existing email", () => {
    const outcome = interpretSignup({
      error: null,
      user: { identities: [] },
      session: null,
    });
    assert.equal(outcome.kind, "already_registered");
    assert.equal(outcome.message, ALREADY_REGISTERED_NOTICE);
  });

  it("keeps an auto-confirmed signup pending until a role is assigned", () => {
    const outcome = interpretSignup({
      error: null,
      user: { identities: [{ id: "identity-1" }] },
      session: { access_token: "token" },
    });
    assert.equal(outcome.kind, "pending_approval");
    assert.equal(outcome.message, PENDING_APPROVAL_NOTICE);
  });

  it("maps duplicate-user and redirect failures to actionable messages", () => {
    assert.equal(
      interpretSignup({
        error: { message: "User already registered" },
        user: null,
        session: null,
      }).kind,
      "already_registered",
    );
    assert.match(
      interpretSignup({
        error: { message: "redirect URL is not allowed" },
        user: null,
        session: null,
      }).message,
      /redirect allow list/i,
    );
  });
});

describe("signInErrorMessage", () => {
  it("explains an unconfirmed email instead of the raw auth error", () => {
    assert.match(signInErrorMessage("Email not confirmed"), /Confirm the email/);
  });
});

describe("readEdgeFunctionError", () => {
  it("reads the JSON error from a failed function response", async () => {
    const error = new Error("Edge Function returned a non-2xx status code");
    Object.assign(error, {
      context: new Response(JSON.stringify({ error: "Invalid JWT" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    });
    assert.equal(await readEdgeFunctionError(error), "Invalid JWT");
  });
});

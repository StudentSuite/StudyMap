import { describe, expect, it, vi } from "vitest";

let mockRpc: (name: string, args: unknown) => Promise<{ data: unknown; error: unknown }>;
vi.mock("@/lib/supabase/anon", () => ({
  createAnonClient: () =>
    mockRpc
      ? {
          rpc: (name: string, args: unknown) => mockRpc(name, args),
        }
      : null,
}));

import { allowPasswordResetAttempt } from "@/lib/password-reset-rate-limit";

describe("allowPasswordResetAttempt", () => {
  it("returns true when Supabase is not configured", async () => {
    mockRpc = undefined as unknown as typeof mockRpc;
    expect(await allowPasswordResetAttempt("user@example.com")).toBe(true);
  });

  it("returns true when the RPC itself errors (fails open)", async () => {
    mockRpc = () => Promise.resolve({ data: null, error: { message: "boom" } });
    expect(await allowPasswordResetAttempt("user@example.com")).toBe(true);
  });

  it("returns true when the RPC allows the attempt", async () => {
    mockRpc = () => Promise.resolve({ data: true, error: null });
    expect(await allowPasswordResetAttempt("user@example.com")).toBe(true);
  });

  it("returns false when the RPC rejects the attempt (rate limited)", async () => {
    mockRpc = () => Promise.resolve({ data: false, error: null });
    expect(await allowPasswordResetAttempt("user@example.com")).toBe(false);
  });

  it("calls the RPC with a sha256 hash of the email, not the raw address", async () => {
    let receivedArgs: { p_email_hash?: string } | undefined;
    mockRpc = (_name, args) => {
      receivedArgs = args as { p_email_hash: string };
      return Promise.resolve({ data: true, error: null });
    };
    await allowPasswordResetAttempt("user@example.com");
    expect(receivedArgs?.p_email_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(receivedArgs?.p_email_hash).not.toContain("user@example.com");
  });

  it("hashes case- and whitespace-normalized so the same address always maps to one bucket", async () => {
    const seen: string[] = [];
    mockRpc = (_name, args) => {
      seen.push((args as { p_email_hash: string }).p_email_hash);
      return Promise.resolve({ data: true, error: null });
    };
    await allowPasswordResetAttempt("User@Example.com");
    await allowPasswordResetAttempt("  user@example.com  ");
    expect(seen[0]).toBe(seen[1]);
  });

  it("calls the RPC by name", async () => {
    let calledName: string | undefined;
    mockRpc = (name) => {
      calledName = name;
      return Promise.resolve({ data: true, error: null });
    };
    await allowPasswordResetAttempt("user@example.com");
    expect(calledName).toBe("check_and_record_password_reset_attempt");
  });
});

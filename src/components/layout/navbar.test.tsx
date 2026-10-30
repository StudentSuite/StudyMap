import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Navbar } from "@/components/layout/navbar";

const { pathname, createClient, getUser } = vi.hoisted(() => ({
  pathname: { current: "/map" },
  createClient: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("next/dynamic", () => ({ default: () => () => null }));
vi.mock("@/lib/supabase/client", () => ({ createClient }));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: () => true }));
vi.mock("@/components/layout/theme-toggle", () => ({ ThemeToggle: () => null }));

beforeEach(() => {
  getUser.mockReset().mockResolvedValue({ data: { user: null } });
  createClient.mockReset().mockReturnValue({
    auth: {
      getUser,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  });
});

afterEach(cleanup);

describe("Navbar auth lookup", () => {
  it("asks Supabase who the visitor is on a normal page", () => {
    pathname.current = "/map";
    const { container } = render(<Navbar />);

    expect(createClient).toHaveBeenCalled();
    expect(getUser).toHaveBeenCalled();
    expect(container.querySelector("header")).not.toBeNull();
  });

  it.each(["/embed", "/embed/anything"])(
    "renders nothing and never touches Supabase on %s (the third-party iframe)",
    (path) => {
      pathname.current = path;
      const { container } = render(<Navbar />);

      expect(container.innerHTML).toBe("");
      expect(createClient).not.toHaveBeenCalled();
      expect(getUser).not.toHaveBeenCalled();
    },
  );
});

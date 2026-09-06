export const site = {
  name: "StudyMap",
  tagline: "Find student places and perks in cities worldwide.",
  description:
    "A crowdsourced map of student-important places (exam centres, libraries, book shops, and more) covering hundreds of cities worldwide.",
  url: "https://studyymap.com",
  repo: "https://github.com/StudentSuite/StudyMap",
} as const;

export const navLinks = [
  { href: "/map", label: "Map" },
  { href: "/competitions", label: "Competitions" },
  { href: "/calendar", label: "Calendar" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
] as const;

/** Links shown directly in the navbar (desktop). */
export const primaryNavLinks = [
  { href: "/map", label: "Map" },
  { href: "/competitions", label: "Competitions" },
  { href: "/calendar", label: "Calendar" },
] as const;

/** Links grouped under the "More" dropdown (desktop). */
export const secondaryNavLinks = [
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
] as const;
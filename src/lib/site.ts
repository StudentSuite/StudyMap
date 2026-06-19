export const site = {
  name: "StudyMap",
  tagline: "Find student places and perks across Mumbai, Thane, and Navi Mumbai.",
  description:
    "A crowdsourced map of student-important places (exam centres, libraries, book shops, and more) for the Mumbai Metropolitan Region.",
  repo: "https://github.com/anaydhawan/studymap",
} as const;

export const navLinks = [
  { href: "/map", label: "Map" },
  { href: "/calendar", label: "Calendar" },
  { href: "/docs", label: "Docs" },
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
] as const;
export const site = {
  name: "StudyMap",
  tagline: "Find student places, papers, and perks across Mumbai, Thane, and Navi Mumbai.",
  description:
    "A crowdsourced map of student-important places (exam centres, libraries, book depots, and more) for the Mumbai Metropolitan Region, plus a past-paper catalogue and a student-benefits guide.",
  repo: "https://github.com/anaydhawan/studymap",
} as const;

export const navLinks = [
  { href: "/", label: "Map" },
  { href: "/resources", label: "Resources" },
  { href: "/papers", label: "Papers" },
  { href: "/benefits", label: "Benefits" },
  { href: "/account", label: "Account" },
] as const;

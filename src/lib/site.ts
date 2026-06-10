export const site = {
  name: "StudyMap",
  tagline: "Find student places and perks across Mumbai, Thane, and Navi Mumbai.",
  description:
    "A crowdsourced map of student-important places (exam centres, libraries, book shops, and more) for the Mumbai Metropolitan Region, plus curated resources and a student-benefits guide.",
  repo: "https://github.com/anaydhawan/studymap",
} as const;

export const navLinks = [
  { href: "/", label: "Map" },
  { href: "/resources", label: "Resources" },
  { href: "/benefits", label: "Student Docs" },
  { href: "/account", label: "Account" },
] as const;
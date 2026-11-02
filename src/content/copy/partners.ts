import { heroFields, type CopyGroup } from "./types";

export const partnersCopy: CopyGroup = {
  id: "partners",
  label: "For partners",
  path: "/partners",
  fields: [
    ...heroFields("partners.hero"),
    { key: "partners.businessHeading", label: "Section heading – businesses" },
    { key: "partners.point1.kicker", label: "Business point 1 – label" },
    { key: "partners.point1.title", label: "Business point 1 – heading" },
    { key: "partners.point1.body", label: "Business point 1 – text", multiline: true },
    { key: "partners.point2.kicker", label: "Business point 2 – label" },
    { key: "partners.point2.title", label: "Business point 2 – heading" },
    { key: "partners.point2.body", label: "Business point 2 – text", multiline: true },
    { key: "partners.photoCaption", label: "Venue photo caption" },
    { key: "partners.govHeading", label: "Section heading – local government" },
    { key: "partners.govLead", label: "Local government intro paragraph", multiline: true },
    { key: "partners.gov1.title", label: "Local government point 1 – heading" },
    { key: "partners.gov1.body", label: "Local government point 1 – text", multiline: true },
    { key: "partners.gov2.title", label: "Local government point 2 – heading" },
    { key: "partners.gov2.body", label: "Local government point 2 – text", multiline: true },
    { key: "partners.gov3.title", label: "Local government point 3 – heading" },
    { key: "partners.gov3.body", label: "Local government point 3 – text", multiline: true },
    { key: "partners.cta", label: "Closing button text" },
  ],
  text: {
    "partners.hero.eyebrow": "For businesses & local government",
    "partners.hero.title": "Play local. Build loyalty.",
    "partners.hero.lead":
      "Become visibly, genuinely part of the community that makes local music possible – and be able to prove it.",
    "partners.businessHeading": "For businesses",
    "partners.point1.kicker": "In-venue",
    "partners.point1.title": "Licensed, local, and yours",
    "partners.point1.body":
      "Play your neighbourhood's artists for your customers instead of the same global playlist as every other café on the strip.",
    "partners.point2.kicker": "Rewards",
    "partners.point2.title": "Join the local ecosystem",
    "partners.point2.body":
      "Offer perks to Pack members nearby and get discovered by the people already spending in your suburb.",
    "partners.photoCaption": "The local, on a good night",
    "partners.govHeading": "For local government",
    "partners.govLead":
      "A per-capita patronage model built for measurable outcomes and real place activation – a direct pipeline into your local music economy. Evidence-based, ready to go, and considerably more fun than most infrastructure spending.",
    "partners.gov1.title": "Spend that stays home",
    "partners.gov1.body":
      "Every dollar is mapped to artists inside your LGA, not averaged across a national pool.",
    "partners.gov2.title": "Reporting you can table",
    "partners.gov2.body":
      "Artists paid, plays counted, venues activated – quarterly figures your council can publish.",
    "partners.gov3.title": "A visible funding gap, closed",
    "partners.gov3.body":
      "WA sits near 23c per person on arts against roughly $2 in NSW. This is a direct, trackable way to move that number.",
    "partners.cta": "Start a conversation",
  },
};

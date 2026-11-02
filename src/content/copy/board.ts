import { heroFields, type CopyGroup } from "./types";

export const boardCopy: CopyGroup = {
  id: "board",
  label: "Board",
  path: "/board",
  fields: [
    ...heroFields("board.hero"),
    { key: "board.say.heading", label: "Closing panel – heading" },
    { key: "board.say.body", label: "Closing panel – text", multiline: true },
    { key: "board.say.cta", label: "Closing panel – button text" },
  ],
  text: {
    "board.hero.eyebrow": "Governance",
    "board.hero.title": "Our board.",
    "board.hero.lead":
      "Twelve directors. Musicians, arts professionals, technologists and community advocates. Every major decision comes through them – and our members inform them. That's how a co-operative works.",
    "board.say.heading": "Want a say in who sits here?",
    "board.say.body":
      "Member Directors are elected by the membership – one member, one vote. Join the co-op and you get a voice in how The Pack is run, not just a subscription.",
    "board.say.cta": "How the co-op works",
  },
};

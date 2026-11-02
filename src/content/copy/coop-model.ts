import { heroFields, type CopyGroup } from "./types";

export const coopModelCopy: CopyGroup = {
  id: "coop-model",
  label: "Co-op model",
  path: "/coop-model",
  fields: [
    ...heroFields("coop-model.hero"),
    { key: "coop-model.what.summary", label: "FAQ – what is a cooperative – question" },
    { key: "coop-model.what.p1", label: "FAQ – what is a cooperative – paragraph 1", multiline: true },
    { key: "coop-model.what.p2", label: "FAQ – what is a cooperative – paragraph 2", multiline: true },
    { key: "coop-model.what.p2Link", label: "FAQ – what is a cooperative – link text" },
    { key: "coop-model.why.summary", label: "FAQ – why a platform co-op – question" },
    { key: "coop-model.why.p1", label: "FAQ – why a platform co-op – paragraph 1", multiline: true },
    { key: "coop-model.why.p2", label: "FAQ – why a platform co-op – paragraph 2", multiline: true },
    { key: "coop-model.mechanicsHeading", label: "Section heading – the mechanics" },
    { key: "coop-model.mech1.kicker", label: "Mechanic 1 – label" },
    { key: "coop-model.mech1.title", label: "Mechanic 1 – heading" },
    { key: "coop-model.mech1.body", label: "Mechanic 1 – text", multiline: true },
    { key: "coop-model.mech2.kicker", label: "Mechanic 2 – label" },
    { key: "coop-model.mech2.title", label: "Mechanic 2 – heading" },
    { key: "coop-model.mech2.body", label: "Mechanic 2 – text", multiline: true },
    { key: "coop-model.mech3.kicker", label: "Mechanic 3 – label" },
    { key: "coop-model.mech3.title", label: "Mechanic 3 – heading" },
    { key: "coop-model.mech3.body", label: "Mechanic 3 – text", multiline: true },
    { key: "coop-model.mech4.kicker", label: "Mechanic 4 – label" },
    { key: "coop-model.mech4.title", label: "Mechanic 4 – heading" },
    { key: "coop-model.mech4.body", label: "Mechanic 4 – text", multiline: true },
    { key: "coop-model.mech5.kicker", label: "Mechanic 5 – label" },
    { key: "coop-model.mech5.title", label: "Mechanic 5 – heading" },
    { key: "coop-model.mech5.body", label: "Mechanic 5 – text", multiline: true },
    { key: "coop-model.mech6.kicker", label: "Mechanic 6 – label" },
    { key: "coop-model.mech6.title", label: "Mechanic 6 – heading" },
    { key: "coop-model.mech6.body", label: "Mechanic 6 – text", multiline: true },
    { key: "coop-model.boardCta", label: "Button – meet the board" },
    { key: "coop-model.rulesCta", label: "Button – cooperative rules" },
  ],
  text: {
    "coop-model.hero.eyebrow": "The Model",
    "coop-model.hero.title": "Why we're a co-op, not a corporation.",
    "coop-model.hero.lead":
      "A cooperative is member-owned and democratically governed – built to serve its community rather than outside investors.",
    "coop-model.what.summary": "What is a cooperative?",
    "coop-model.what.p1":
      "A cooperative is a member-owned, democratically governed organisation, built to serve its community rather than outside investors. Every member gets an equal say in decisions and a genuine share in whatever success looks like.",
    "coop-model.what.p2":
      "For more on cooperatives and the principles we operate under, see the",
    "coop-model.what.p2Link": "International Cooperative Alliance",
    "coop-model.why.summary": "Why a platform co-op?",
    "coop-model.why.p1":
      "The Pack chose the platform co-op model to put the power back where it belongs: with the people who make the music and the people who listen to it. Yes, that means our investment options are narrower than a venture-backed competitor's. We're fine with that trade. It's the whole point.",
    "coop-model.why.p2":
      "By pooling our voices and resources, we make sure revenue follows listening, data stays in artists' hands, and no major shareholder gets to quietly override what the community agreed to. That isn't a bonus feature on top of the business model. It is the business model, all the way down.",
    "coop-model.mechanicsHeading": "The mechanics",
    "coop-model.mech1.kicker": "Who's on it",
    "coop-model.mech1.title": "Unsigned & indie artists only",
    "coop-model.mech1.body":
      "Original, human-made music from unsigned or independently signed musicians, and nothing else. A space where creativity leads, free of corporate agendas and big tech's fingerprints.",
    "coop-model.mech2.kicker": "The money",
    "coop-model.mech2.title": "Artist-centric payments",
    "coop-model.mech2.body":
      "Stream a track and the artist you actually listened to gets paid. No pro-rata splits quietly funnelling your subscription toward artists you've never once played.",
    "coop-model.mech3.kicker": "The rights",
    "coop-model.mech3.title": "Artist ownership",
    "coop-model.mech3.body":
      "Musicians keep full rights to their work, their data and their creative decisions. Revenue flows back to the community that built it, not to shareholders who have never even heard it.",
    "coop-model.mech4.kicker": "Discovery",
    "coop-model.mech4.title": "Hyper-local discovery",
    "coop-model.mech4.body":
      "We connect artists with the local listeners, businesses, venues and governments around them, and surface community-powered playlists that celebrate the best of your own region.",
    "coop-model.mech5.kicker": "Curation",
    "coop-model.mech5.title": "Human curation",
    "coop-model.mech5.body":
      "Real people, not algorithms, shape the playlists here. No black boxes deciding what gets heard – just genuine attention to diversity, cultural context and connection.",
    "coop-model.mech6.kicker": "The tech",
    "coop-model.mech6.title": "Ethical tech & data sovereignty",
    "coop-model.mech6.body":
      "Your information stays yours. We don't sell it, we don't exploit it, and First Nations data governance and cultural preservation are built into the architecture from the ground up.",
    "coop-model.boardCta": "Meet the board",
    "coop-model.rulesCta": "Our cooperative rules",
  },
};

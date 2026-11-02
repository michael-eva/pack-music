import { heroFields, cardFields, type CopyGroup } from "./types";

export const artistsCopy: CopyGroup = {
  id: "artists",
  label: "For artists",
  path: "/artists",
  fields: [
    ...heroFields("artists.hero"),
    ...cardFields("artists.card1", "Card 1"),
    ...cardFields("artists.card2", "Card 2"),
    ...cardFields("artists.card3", "Card 3"),
    ...cardFields("artists.card4", "Card 4"),
    { key: "artists.photoCaption", label: "Photo caption" },
    { key: "artists.cta", label: "CTA button text" },
  ],
  text: {
    "artists.hero.eyebrow": "For music creators",
    "artists.hero.title": "Your music. Your data. Your cut.",
    "artists.hero.lead":
      "Upload for free, keep full ownership, and earn a genuine share from the people who actually listen to you.",
    "artists.card1.kicker": "Payment",
    "artists.card1.title": "Paid by your listeners, not an algorithm",
    "artists.card1.body":
      "Each subscriber's dollar is split across what that person played. No pooled pot skimmed by the platform's biggest acts.",
    "artists.card2.kicker": "Ownership",
    "artists.card2.title": "You keep the masters. All of them.",
    "artists.card2.body":
      "No exclusivity clauses, no rights grabs. Upload is free and you can walk with your catalogue and your listener data at any time.",
    "artists.card3.kicker": "Governance",
    "artists.card3.title": "One member, one vote",
    "artists.card3.body":
      "Playing to three people at the local counts the same as selling out a stadium. Members set the rules, including the split.",
    "artists.card4.kicker": "Audience",
    "artists.card4.title": "Found by people near you",
    "artists.card4.body":
      "Geo-fenced discovery surfaces you to listeners in your actual catchment – the ones who can turn up on a Friday night.",
    "artists.photoCaption": "Upload free. Keep everything.",
    "artists.cta": "Register as an artist",
  },
};

import { heroFields, cardFields, type CopyGroup } from "./types";

export const listenersCopy: CopyGroup = {
  id: "listeners",
  label: "For listeners",
  path: "/listeners",
  fields: [
    ...heroFields("listeners.hero"),
    ...cardFields("listeners.card1", "Card 1"),
    ...cardFields("listeners.card2", "Card 2"),
    ...cardFields("listeners.card3", "Card 3"),
    { key: "listeners.photoCaption", label: "Photo caption" },
    { key: "listeners.cta", label: "CTA button text" },
  ],
  text: {
    "listeners.hero.eyebrow": "For music lovers",
    "listeners.hero.title": "Hear the sounds of your home.",
    "listeners.hero.lead":
      "There's a musician a few suburbs over playing every Friday night. The algorithm has never once thought to mention them.",
    "listeners.card1.kicker": "Discovery",
    "listeners.card1.title": "Geo-fenced, not black-boxed",
    "listeners.card1.body":
      "Find what's playing in your postcode this week, curated by humans who live there. No mystery logic deciding what you're allowed to find.",
    "listeners.card2.kicker": "Your money",
    "listeners.card2.title": "Goes where you meant it to",
    "listeners.card2.body":
      "Your subscription is split by what you played. The quiet satisfaction of knowing it landed with the right people.",
    "listeners.card3.kicker": "Rewards",
    "listeners.card3.title": "Perks that reach the artist",
    "listeners.card3.body":
      "Fan rewards, gig drops and local business offers that keep the money circulating in your scene.",
    "listeners.photoCaption": "Friday night, three suburbs over",
    "listeners.cta": "Join as a listener",
  },
};

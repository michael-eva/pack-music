import { heroFields, type CopyGroup } from "./types";

export const supportCopy: CopyGroup = {
  id: "support",
  label: "Support us",
  path: "/support",
  fields: [
    ...heroFields("support.hero"),
    { key: "support.spendHeading", label: "Section heading – where your money goes" },
    { key: "support.spend1.title", label: "Spend item 1 – heading" },
    { key: "support.spend1.body", label: "Spend item 1 – text", multiline: true },
    { key: "support.spend2.title", label: "Spend item 2 – heading" },
    { key: "support.spend2.body", label: "Spend item 2 – text", multiline: true },
    { key: "support.spend3.title", label: "Spend item 3 – heading" },
    { key: "support.spend3.body", label: "Spend item 3 – text", multiline: true },
    { key: "support.campaign.label", label: "Campaign panel – small label" },
    { key: "support.campaign.heading", label: "Campaign panel – heading" },
    { key: "support.campaign.body", label: "Campaign panel – text", multiline: true },
    { key: "support.campaign.cta", label: "Campaign panel – button text" },
  ],
  text: {
    "support.hero.eyebrow": "Fundraising",
    "support.hero.title": "Support the campaign.",
    "support.hero.lead":
      "The prototype is built. The vision is clear. What stands between us and launch is funding – for final tech development, artist onboarding and community outreach.",
    "support.spendHeading": "Where your money goes",
    "support.spend1.title": "Final tech build",
    "support.spend1.body":
      "Geo-fenced music delivery, artist dashboards and real-time payment systems – finished properly.",
    "support.spend2.title": "Artist onboarding",
    "support.spend2.body":
      "Onboarding workshops and Living Labs coordination with artists right across WA.",
    "support.spend3.title": "Launch",
    "support.spend3.body":
      "Marketing and launch preparation, so the first playlist lands in front of real listeners.",
    "support.campaign.label": "StartSomeGood",
    "support.campaign.heading": "$45,000 target",
    "support.campaign.body":
      "Every dollar is a vote for a different kind of music industry – and a world where \"streaming royalties\" isn't a punchline.",
    "support.campaign.cta": "Contribute to the campaign",
  },
};

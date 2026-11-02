import type { CopyGroup } from "./types";

export const libraryCopy: CopyGroup = {
  id: "library",
  label: "Library",
  path: "/governance",
  fields: [
    // Governance – hero
    { key: "library.eyebrow", label: "Governance – small label above the headline" },
    { key: "library.title", label: "Governance – headline", multiline: true },
    { key: "library.lead", label: "Governance – intro paragraph", multiline: true },
    // Governance – "In the Library" section
    { key: "library.inLibraryHeading", label: "Governance – section heading (In the Library)" },
    { key: "library.section1.title", label: "Governance – section 1 title" },
    { key: "library.section1.body", label: "Governance – section 1 text", multiline: true },
    { key: "library.section1.cta", label: "Governance – section 1 button" },
    { key: "library.section2.title", label: "Governance – section 2 title" },
    { key: "library.section2.body", label: "Governance – section 2 text", multiline: true },
    { key: "library.section2.cta", label: "Governance – section 2 button" },
    { key: "library.section3.title", label: "Governance – section 3 title" },
    { key: "library.section3.body", label: "Governance – section 3 text", multiline: true },
    { key: "library.section3.cta", label: "Governance – section 3 button" },
    // Governance – "How we're governed" section
    { key: "library.governedHeading", label: "Governance – section heading (How we're governed)" },
    { key: "library.principle1.title", label: "Governance – principle 1 title" },
    { key: "library.principle1.body", label: "Governance – principle 1 text", multiline: true },
    { key: "library.principle2.title", label: "Governance – principle 2 title" },
    { key: "library.principle2.body", label: "Governance – principle 2 text", multiline: true },
    { key: "library.principle3.title", label: "Governance – principle 3 title" },
    { key: "library.principle3.body", label: "Governance – principle 3 text", multiline: true },
    { key: "library.principle4.title", label: "Governance – principle 4 title" },
    { key: "library.principle4.body", label: "Governance – principle 4 text", multiline: true },
    // Governance – "Our policies" section
    { key: "library.policiesHeading", label: "Governance – section heading (Our policies)" },
    { key: "library.policy1.title", label: "Governance – policy 1 title" },
    { key: "library.policy1.body", label: "Governance – policy 1 text", multiline: true },
    { key: "library.policy2.title", label: "Governance – policy 2 title" },
    { key: "library.policy2.body", label: "Governance – policy 2 text", multiline: true },
    { key: "library.policy3.title", label: "Governance – policy 3 title" },
    { key: "library.policy3.body", label: "Governance – policy 3 text", multiline: true },
    { key: "library.policy4.title", label: "Governance – policy 4 title" },
    { key: "library.policy4.body", label: "Governance – policy 4 text", multiline: true },
    { key: "library.policy5.title", label: "Governance – policy 5 title" },
    { key: "library.policy5.body", label: "Governance – policy 5 text", multiline: true },
    { key: "library.policy6.title", label: "Governance – policy 6 title" },
    { key: "library.policy6.body", label: "Governance – policy 6 text", multiline: true },
    { key: "library.askHeading", label: "Governance – ask us anything heading" },
    { key: "library.askBody", label: "Governance – ask us anything text", multiline: true },

    // Papers – headline
    { key: "papers.eyebrow", label: "Papers – small label above the headline" },
    { key: "papers.title", label: "Papers – headline", multiline: true },
    { key: "papers.lead", label: "Papers – intro paragraph", multiline: true },
    { key: "papers.readCta", label: "Papers – read paper button" },
    { key: "papers.backLink", label: "Papers – back to library link" },

    // Policies – headline
    { key: "policies.eyebrow", label: "Policies – small label above the headline" },
    { key: "policies.title", label: "Policies – headline", multiline: true },
    { key: "policies.lead", label: "Policies – intro paragraph", multiline: true },
    { key: "policies.readCta", label: "Policies – read policy button" },
    { key: "policies.backLink", label: "Policies – back to library link" },

    // FAQs – headline
    { key: "faqs.eyebrow", label: "FAQs – small label above the headline" },
    { key: "faqs.title", label: "FAQs – headline", multiline: true },
    { key: "faqs.lead", label: "FAQs – intro paragraph", multiline: true },
    { key: "faqs.backLink", label: "FAQs – back to library link" },
  ],
  text: {
    "library.eyebrow": "Library",
    "library.title": "The rules, in plain language.",
    "library.lead":
      "A co-operative only works if everybody can read how it works. So here it is, without the legal fog.",
    "library.inLibraryHeading": "In the Library",
    "library.section1.title": "Our Papers",
    "library.section1.body":
      "The white paper that started it, the 2026 provocations agenda, and the market and cultural impact research.",
    "library.section1.cta": "Read the papers",
    "library.section2.title": "Our Policies",
    "library.section2.body":
      "Anti-monopoly, data sovereignty, ethics, ethical AI, sustainability, cultural preservation and ethical investment.",
    "library.section2.cta": "Read the policies",
    "library.section3.title": "FAQs",
    "library.section3.body":
      "Payouts, geo-fencing, membership costs, licensing, rewards and the co-op model – answered plainly.",
    "library.section3.cta": "Read the FAQs",
    "library.governedHeading": "How we're governed",
    "library.principle1.title": "One member, one vote",
    "library.principle1.body":
      "Every member carries equal weight regardless of streams, catalogue size or how long they've been here.",
    "library.principle2.title": "No outside shareholders",
    "library.principle2.body":
      "The Pack is member-owned. There is no external equity, and no exit anyone is working towards.",
    "library.principle3.title": "Open books",
    "library.principle3.body":
      "Members receive an annual plain-language statement of income, costs and the payout split.",
    "library.principle4.title": "Changes go to a vote",
    "library.principle4.body":
      "The revenue split and other material rules can only change by member resolution at a general meeting.",
    "library.policiesHeading": "Our policies",
    "library.policy1.title": "Revenue and payouts",
    "library.policy1.body":
      "70% of each subscription is allocated by what that member actually played and paid to those artists. The remaining 30% funds operations, curation and reinvestment. Payments are made monthly, with a statement of streams and amounts.",
    "library.policy2.title": "Membership and eligibility",
    "library.policy2.body":
      "Artist membership is open to Australian-based musicians and rights holders who can evidence ownership or licence of the works they upload. Listener membership is open to anyone with a subscription. Membership can be ended by the member at any time.",
    "library.policy3.title": "Privacy and member data",
    "library.policy3.body":
      "We collect the minimum needed to run the service: account details, payment information and listening history used to calculate payouts and local recommendations. We do not sell member data or share it for advertising.",
    "library.policy4.title": "Curation and editorial",
    "library.policy4.body":
      "Curators are paid, credited and drawn from the scenes they cover. Placement is never sold. Curators declare conflicts of interest and step back from decisions involving artists they represent.",
    "library.policy5.title": "Content and conduct",
    "library.policy5.body":
      "Uploads must be works the member owns or is licensed to distribute. Hateful, harassing or infringing content is removed. Members can appeal any removal to the board, which responds in writing.",
    "library.policy6.title": "Complaints and disputes",
    "library.policy6.body":
      "Complaints go to the board in writing and receive a response within 30 days. Unresolved disputes are referred to independent mediation before any further step.",
    "library.askHeading": "Ask us anything",
    "library.askBody":
      "Want the full rules of the co-operative, or a copy of the latest annual statement? Email the board and we'll send it through.",

    "papers.eyebrow": "Library / Our Papers",
    "papers.title": "The receipts, written down.",
    "papers.lead":
      "Everything we argue for, argued in full. Read the papers, quote them, send them to your local member.",
    "papers.readCta": "Read the paper →",
    "papers.backLink": "← Back to the Library",

    "policies.eyebrow": "Library / Our Policies",
    "policies.title": "Policies you can actually read.",
    "policies.lead":
      "Policies are more than documents – they keep us accountable to our co-operative principles and protect the rights that make local music vibrant.",
    "policies.readCta": "Read the policy →",
    "policies.backLink": "← Back to the Library",

    "faqs.eyebrow": "Library / FAQs",
    "faqs.title": "Want to dig into the detail?",
    "faqs.lead":
      "The questions we get asked most, answered without the corporate fog. Still stuck? Email us and a human writes back.",
    "faqs.backLink": "← Back to the Library",
  },
};

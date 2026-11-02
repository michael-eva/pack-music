import { heroFields, type CopyGroup } from "./types";

export const aboutCopy: CopyGroup = {
  id: "about",
  label: "About",
  path: "/about",
  fields: [
    ...heroFields("about.hero"),
    { key: "about.body1", label: "Body paragraph 1", multiline: true },
    { key: "about.body2", label: "Body paragraph 2", multiline: true },
    { key: "about.body3", label: "Body paragraph 3", multiline: true },
    { key: "about.photoCaption", label: "Photo caption" },
    { key: "about.faqHeading", label: "FAQ section heading" },
    { key: "about.faq1.q", label: "FAQ 1 – question" },
    { key: "about.faq1.a", label: "FAQ 1 – answer", multiline: true },
    { key: "about.faq2.q", label: "FAQ 2 – question" },
    { key: "about.faq2.a", label: "FAQ 2 – answer", multiline: true },
    { key: "about.faq3.q", label: "FAQ 3 – question" },
    { key: "about.faq3.a", label: "FAQ 3 – answer", multiline: true },
    { key: "about.faq4.q", label: "FAQ 4 – question" },
    { key: "about.faq4.a", label: "FAQ 4 – answer", multiline: true },
    { key: "about.link1", label: "Link button 1 – our origin story" },
    { key: "about.link2", label: "Link button 2 – the co-op model" },
    { key: "about.link3", label: "Link button 3 – our board" },
  ],
  text: {
    "about.hero.eyebrow": "About",
    "about.hero.title": "A home for local music, built by the people who love it.",
    "about.hero.lead":
      "Stanley's been saying this for years – when a community owns the platform, the platform looks after the community.",
    "about.body1":
      "The Pack is a co-operative community built around one simple idea: the people who make local music and the people who love it should own the thing that connects them. No outside shareholders. No exit strategy that sells out the scene. Just members, voting on what matters.",
    "about.body2":
      "We run a fair streaming model because the existing ones don't. Every subscription dollar is split by what that person actually played – 70 cents goes directly to those artists, and the rest keeps the co-op running and reinvests in the music ecosystem.",
    "about.body3":
      "The Pack has a home wherever people care about the sounds made right around them. Human curation, local discovery, and a business model that puts the community first.",
    "about.photoCaption": "Members, not users",
    "about.faqHeading": "Questions, answered",
    "about.faq1.q": "What is The Pack?",
    "about.faq1.a":
      "A community-owned music co-operative. We run a fair streaming model where 70% of every subscription dollar is paid directly to the artists a member listened to.",
    "about.faq2.q": "Who owns it?",
    "about.faq2.a":
      "Its members. The Pack is a registered co-operative with no outside shareholders – one member, one vote, whether you're an artist or a listener.",
    "about.faq3.q": "What happens to the other 30%?",
    "about.faq3.a":
      "It keeps the community growing and the lights on: curation, operations and reinvestment into local music ecosystems. No shareholder takes a cut.",
    "about.faq4.q": "Who is Stanley?",
    "about.faq4.a": "The dog. He's been very pleased about all of this from the beginning.",
    "about.link1": "Our origin story",
    "about.link2": "The co-op model",
    "about.link3": "Our board",
  },
};

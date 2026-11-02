import { heroFields, type CopyGroup } from "./types";

export const ambassadorCopy: CopyGroup = {
  id: "ambassador",
  label: "Ambassadors",
  path: "/ambassador",
  fields: [
    ...heroFields("ambassador.hero"),
    { key: "ambassador.intro", label: "Intro paragraph", multiline: true },
    { key: "ambassador.doHeading", label: "Section heading – what ambassadors do" },
    { key: "ambassador.do1", label: "Ambassadors do – item 1", multiline: true },
    { key: "ambassador.do2", label: "Ambassadors do – item 2", multiline: true },
    { key: "ambassador.do3", label: "Ambassadors do – item 3", multiline: true },
    { key: "ambassador.do4", label: "Ambassadors do – item 4", multiline: true },
    { key: "ambassador.getHeading", label: "Section heading – what you get back" },
    { key: "ambassador.get1", label: "You get back – item 1", multiline: true },
    { key: "ambassador.get2", label: "You get back – item 2", multiline: true },
    { key: "ambassador.get3", label: "You get back – item 3", multiline: true },
    { key: "ambassador.who.heading", label: "Who we're looking for – heading" },
    { key: "ambassador.who.body", label: "Who we're looking for – text", multiline: true },
    { key: "ambassador.who.cta", label: "Who we're looking for – button text" },
  ],
  text: {
    "ambassador.hero.eyebrow": "Ambassadors",
    "ambassador.hero.title": "Become an ambassador.",
    "ambassador.hero.lead":
      "If you've got a platform, a community, or just a loud voice and a real commitment to independent music, we want to talk to you.",
    "ambassador.intro":
      "Being a Pack Ambassador means putting your name, your face and your platform behind something you actually believe in, and letting that lend real momentum to the project. It's not a passive title. It's you, publicly, saying this matters enough to stand behind.",
    "ambassador.doHeading": "What ambassadors do",
    "ambassador.do1":
      "Lend your name and face to The Pack's story, told in your own voice to your own audience.",
    "ambassador.do2":
      "Take part in advocacy campaigns and policy conversations that carry further because you're carrying them.",
    "ambassador.do3":
      "Show up in guest content, interviews and community projects that put local artists in front of new people.",
    "ambassador.do4":
      "Claim your spot on our Ambassadors page and in our launch materials, properly credited.",
    "ambassador.getHeading": "What you get back",
    "ambassador.get1":
      "Ready-made social content you can share in a click – backing us never means starting from scratch.",
    "ambassador.get2":
      "Pack merch, because looking the part matters and we like a good hoodie as much as the next underdog.",
    "ambassador.get3":
      "A genuine amount of love: ongoing thanks, shout-outs, and your name on something real.",
    "ambassador.who.heading": "Who we're looking for",
    "ambassador.who.body":
      "Musicians. Music educators. Arts advocates. Journalists. Community leaders. People who've been quietly furious about the streaming economy for years, and are ready to put a face to that frustration and help us build something better instead – alongside Stanley and the rest of us.",
    "ambassador.who.cta": "Tell us about yourself",
  },
};

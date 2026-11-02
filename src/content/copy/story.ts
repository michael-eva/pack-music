import { heroFields, type CopyGroup } from "./types";

export const storyCopy: CopyGroup = {
  id: "story",
  label: "Our story",
  path: "/story",
  fields: [
    ...heroFields("story.hero"),
    { key: "story.stanleySays", label: "Stanley says – speech bubble text", multiline: true },
    { key: "story.p1", label: "Paragraph 1", multiline: true },
    { key: "story.p2", label: "Paragraph 2", multiline: true },
    { key: "story.p3", label: "Paragraph 3", multiline: true },
    { key: "story.manifesto.heading", label: "Manifesto – heading" },
    { key: "story.manifesto.body", label: "Manifesto – text", multiline: true },
    { key: "story.manifesto.cta", label: "Manifesto – button text" },
    { key: "story.coop.heading", label: "Why a co-op – heading" },
    { key: "story.coop.body", label: "Why a co-op – text", multiline: true },
    { key: "story.coop.modelCta", label: "Why a co-op – co-op model button text" },
    { key: "story.coop.boardCta", label: "Why a co-op – board button text" },
  ],
  text: {
    "story.hero.eyebrow": "Our Story",
    "story.hero.title": "Our origin story.",
    "story.hero.lead":
      "It started with two independent musicians in Perth who'd had enough of writing good music for platforms that couldn't be bothered to notice.",
    "story.stanleySays":
      "I wasn't around for the early years, but I've heard the whole story enough times to tell it word for word. Tail going the entire time.",
    "story.p1":
      "Building The Pack has been a long, bumpy, occasionally exhausting journey. Instead of waiting for the big corporations to change, two independent musicians decided to build something better themselves.",
    "story.p2":
      "Nine years in the making, born out of frustration, built on stubbornness – and it nearly didn't make it, three times over. Developers who bet everything on crypto gaming and lost. More than thirty grant rejections, the kind that quietly end most projects long before anyone notices they've stopped trying. And one acquisition offer generous enough to make the founders comfortable, in exchange for everything they'd set out to protect. They said no, and meant it.",
    "story.p3":
      "This story matters, because it's the reason the co-operative model isn't a marketing angle bolted on after the fact. It's the only structure that could have survived long enough to get built, tested by every one of those near misses along the way.",
    "story.manifesto.heading": "The Pack's manifesto",
    "story.manifesto.body":
      "Our manifesto sets out what we believe: the founding principles, the vision and the policy positions that guide how we reclaim music as art, put creators first, and build something genuinely ethical from the ground up. It's our touchstone and our marching orders.",
    "story.manifesto.cta": "Read the manifesto",
    "story.coop.heading": "Why a co-op?",
    "story.coop.body":
      "Member-owned, democratically governed, one member one vote – and no shareholder able to quietly override what the community agreed to. Here's exactly how the model works and who's governing it.",
    "story.coop.modelCta": "The co-op model",
    "story.coop.boardCta": "Our board",
  },
};

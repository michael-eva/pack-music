import type { CopyGroup } from "./types";

export const blogCopy: CopyGroup = {
  id: "blog",
  label: "Blog",
  path: "/blog",
  fields: [
    { key: "blog.eyebrow", label: "Blog index – small label above the headline" },
    { key: "blog.title", label: "Blog index – headline", multiline: true },
    { key: "blog.lead", label: "Blog index – intro paragraph", multiline: true },
    { key: "blog.readCta", label: "Blog index – read post button" },
    { key: "blog.errorTitle", label: "Blog index – error state heading" },
    { key: "blog.errorBody", label: "Blog index – error state text" },
    { key: "blog.notFoundTitle", label: "Blog post – not found heading" },
    { key: "blog.notFoundBody", label: "Blog post – not found text" },
    { key: "blog.notFoundCta", label: "Blog post – not found button" },
    { key: "blog.allPostsLink", label: "Blog post – all posts link" },
  ],
  text: {
    "blog.eyebrow": "Blog",
    "blog.title": "Notes from the pack.",
    "blog.lead":
      "Payout maths, co-op arguments and dispatches from the scenes we cover. Stanley proofreads everything.",
    "blog.readCta": "Read it",
    "blog.errorTitle": "The blog is catching its breath",
    "blog.errorBody": "Give it a refresh in a moment.",
    "blog.notFoundTitle": "That post has wandered off",
    "blog.notFoundBody": "Stanley checked under the couch. Nothing.",
    "blog.notFoundCta": "Back to the blog",
    "blog.allPostsLink": "All posts",
  },
};

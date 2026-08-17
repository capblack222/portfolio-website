export type SocialLink = {
  label: string;
  href: string;
  handle: string;
};

export const profile = {
  name: "Nishtha Gupta",
  role: "Cloud Engineer",

  headline: "I design event-driven systems on AWS",
  subline: "Every service choice answers a specific access pattern.",

  location: "College Park, Maryland",

  status: {
    label: "Open to Summer 2027 internships",
    active: true,
  },

  about: [
    "M.Eng. Cloud Engineering at the University of Maryland, College Park, where I also work as a Graduate Assistant. Most of my time goes to Python and AWS — Lambda, ECS, Kinesis, DynamoDB, EventBridge — with Terraform underneath.",
    "Before this I spent two years at TIAA diagnosing distributed data flows across integration, MDM, warehouse, and CRM layers. That work is where I learned that most production failures are silent long before they are loud, which is still how I approach system design.",
  ],

  certification: {
    name: "AWS Solutions Architect – Associate (SAA-C03)",
    status: "In progress, targeting late August 2026",
  },

  email: "nish.gup.446@gmail.com",

  socials: [
    { label: "GitHub", href: "https://github.com/capblack222", handle: "capblack222" },
    { label: "LinkedIn", href: "https://linkedin.com/in/gupnish", handle: "gupnish" },
  ] satisfies SocialLink[],
} as const;

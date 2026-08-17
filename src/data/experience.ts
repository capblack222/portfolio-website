export type Role = {
  company: string;
  title: string;
  start: string;
  end: string;
  current?: boolean;
  bullets: string[];
  note?: string;
  award?: string;
};

export const experience: Role[] = [
  {
    company: "University of Maryland, College Park",
    title: "Graduate Assistant",
    start: "Jan 2026",
    end: "Present",
    current: true,
    bullets: [
      "Supporting cloud engineering coursework while completing the M.Eng. in Cloud Engineering.",
    ],
  },
  {
    company: "TIAA Global Capabilities",
    title: "Software Analyst",
    start: "Jul 2023",
    end: "Nov 2025",
    award: "Best Fresher of the Year, 2024",
    bullets: [
      "Diagnosed and validated distributed data flows across integration, MDM, warehouse, and CRM layers — tracing where records diverged between systems and establishing why.",
      "Built and optimised SQL against production warehouse data, reducing query time on the paths used most often for reconciliation.",
      "Worked across team boundaries to confirm data integrity before downstream consumers were affected.",
    ],
    note: "Validation and diagnosis rather than authoring the pipelines — deep familiarity with how the data moved and where it broke.",
  },
  {
    company: "Shram Insights",
    title: "Backend Team Lead",
    start: "Nov 2021",
    end: "Jan 2023",
    bullets: [
      "Promoted from Backend Developer to lead a small engineering team.",
      "Designed and shipped REST APIs in Node.js and Express against MariaDB and MySQL.",
      "Set up CI/CD and test automation so releases stopped depending on one person's local machine.",
    ],
    note: "Held alongside full-time undergraduate coursework.",
  },
];

export const education = [
  {
    school: "University of Maryland, College Park",
    degree: "M.Eng. Cloud Engineering",
    start: "Jan 2026",
    end: "Dec 2027",
    current: true,
  },
];

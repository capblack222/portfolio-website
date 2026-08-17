/**
 * Two tiers, deliberately.
 *
 * `core` is what Nishtha will defend in depth, unprompted.
 * `building` is recent enough that the honest claim is "ask me about the
 * specific thing I built with it" rather than general depth.
 *
 * Stating that distinction openly reads as calibration, which is a stronger
 * signal than an undifferentiated wall of logos.
 */

export type SkillGroup = {
  label: string;
  items: string[];
};

export const coreSkills: SkillGroup[] = [
  {
    label: "Languages",
    items: ["Python", "SQL", "JavaScript / TypeScript"],
  },
  {
    label: "Backend",
    items: ["REST API design", "Node.js", "Express", "MariaDB / MySQL", "Query optimisation"],
  },
  {
    label: "AWS",
    items: ["Lambda", "ECS", "VPC", "SQS", "S3", "DynamoDB", "CloudWatch"],
  },
  {
    label: "Practice",
    items: [
      "Debugging distributed data flows",
      "CI/CD pipelines",
      "Test automation",
      "Leading a small engineering team",
    ],
  },
];

export const buildingSkills: SkillGroup[] = [
  {
    label: "Infrastructure as code",
    items: ["Terraform"],
  },
  {
    label: "Event-driven and analytics",
    items: ["Kinesis", "EventBridge", "Athena", "ElastiCache"],
  },
];

export const buildingCaveat =
  "Recent enough that I would rather be asked about the specific systems I built with them than claim general depth.";

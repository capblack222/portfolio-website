export type Project = {
  slug: string;
  name: string;
  /** One sentence. What it does, in plain language. */
  pitch: string;
  /**
   * The engineering decisions, not the feature list. Each entry should be
   * defensible in an interview: what was chosen, and why that choice.
   */
  decisions: string[];
  tags: string[];
  role?: string;
  links?: { label: string; href: string }[];
  featured: boolean;
};

export const projects: Project[] = [
  {
    slug: "agrisense-agent",
    name: "AgriSense Agent",
    pitch:
      "A retrieval-augmented agent that answers region-specific agricultural questions with grounded, source-attributed responses.",
    decisions: [
      "Built an evaluation harness alongside the retrieval pipeline, so answer quality is measured against a fixed set rather than eyeballed per change.",
      "Instrumented observability during deployment rather than after it, which meant the first production issue was diagnosable without a redeploy.",
      "Developed the RAG core locally in Python, then deployed to AWS once retrieval behaviour was stable — keeping the iteration loop fast while the hard part was still moving.",
    ],
    tags: ["Python", "RAG", "AWS", "Evaluation"],
    role: "Sole author",
    links: [{ label: "Writeup", href: "https://github.com/capblack222" }],
    featured: true,
  },
  {
    slug: "lottery-verification-platform",
    name: "Lottery Verification Platform",
    pitch:
      "A verification service built with a team, where I owned the network and infrastructure layer — then kept extending it after the project ended.",
    decisions: [
      "Designed the VPC topology, ALB, ECS services, and security group boundaries as Infrastructure and Networking Lead.",
      "Added an SQS dead-letter queue after finding that messages were failing silently under burst traffic — the failure mode was invisible until the queue made it explicit.",
      "Introduced an ElastiCache Redis layer and benchmarked it in CloudWatch, so the latency and database-load improvement is a measured number rather than an assumption.",
    ],
    tags: ["AWS", "VPC", "ECS", "SQS", "ElastiCache"],
    role: "Infrastructure and Networking Lead, then solo maintainer",
    featured: true,
  },
  {
    slug: "climatewatch",
    name: "ClimateWatch",
    pitch:
      "A greenfield event-driven pipeline that ingests climate data and makes it queryable without standing up infrastructure per query.",
    decisions: [
      "Kinesis for streaming ingest, DynamoDB for point lookups, S3 with Athena for ad-hoc analysis, EventBridge for orchestration.",
      "Each service maps to a specific access pattern rather than being included for breadth — the read paths were defined before the architecture was.",
      "Serverless throughout, so query cost scales with use instead of with provisioned capacity sitting idle.",
    ],
    tags: ["Kinesis", "DynamoDB", "Athena", "EventBridge", "S3"],
    role: "Sole author",
    featured: true,
  },
];

export const featuredProjects = projects.filter((p) => p.featured);

export const allTags = Array.from(new Set(projects.flatMap((p) => p.tags))).sort();

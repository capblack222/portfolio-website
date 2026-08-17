import { featuredProjects, type Project } from "@/data/projects";
import { Section, Tag } from "@/components/ui/section";

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="rounded-xl border border-line bg-surface p-6 transition-colors hover:border-line-glow sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <h3 className="text-2xl">{project.name}</h3>
        {project.role ? (
          <p className="font-mono text-[11px] text-mute">{project.role}</p>
        ) : null}
      </div>

      <p className="mt-3 max-w-[68ch] text-body">{project.pitch}</p>

      <ul className="mt-6 space-y-3.5">
        {project.decisions.map((d) => (
          <li key={d.slice(0, 28)} className="flex gap-3.5">
            <span
              aria-hidden="true"
              className="mt-2 size-2 shrink-0 bg-accent"
            />
            <span className="max-w-[72ch] text-[15px]">{d}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-wrap items-center gap-2">
        {project.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
        {project.links?.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noreferrer noopener"
            className="ml-1 font-mono text-xs text-accent-soft underline underline-offset-4 hover:text-accent"
          >
            {l.label} ↗
          </a>
        ))}
      </div>
    </article>
  );
}

export function Projects() {
  return (
    <Section
      id="projects"
      index="03"
      label="projects"
      title="Three systems, and the decisions behind them"
    >
      <div className="space-y-6">
        {featuredProjects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </Section>
  );
}

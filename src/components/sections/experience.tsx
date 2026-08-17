import { experience } from "@/data/experience";
import { Section } from "@/components/ui/section";

export function Experience() {
  return (
    <Section id="experience" index="05" label="experience">
      <ol className="space-y-12 border-l border-line pl-7 sm:pl-9">
        {experience.map((role) => (
          <li key={`${role.company}-${role.title}`} className="relative">
            <span
              aria-hidden="true"
              className={`absolute -left-[33px] top-2 size-2 sm:-left-[41px] ${
                role.current ? "bg-terminal" : "bg-line-glow"
              }`}
            />

            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-xl">{role.title}</h3>
              <p className="font-mono text-xs text-mute">
                {role.start} — {role.end}
              </p>
            </div>

            <p className="mt-1 text-accent-soft">{role.company}</p>

            {role.award ? (
              <p className="mt-3 inline-block rounded-md border border-line bg-raised px-2.5 py-1 font-mono text-[11px] text-spark">
                {role.award}
              </p>
            ) : null}

            <ul className="mt-4 space-y-2.5">
              {role.bullets.map((b) => (
                <li key={b.slice(0, 28)} className="flex gap-3.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-2 shrink-0 bg-line-glow"
                  />
                  <span className="max-w-[72ch] text-[15px]">{b}</span>
                </li>
              ))}
            </ul>

            {role.note ? (
              <p className="mt-4 max-w-[68ch] border-l-2 border-line pl-4 text-sm text-mute">
                {role.note}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </Section>
  );
}

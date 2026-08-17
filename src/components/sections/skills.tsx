import { coreSkills, buildingSkills, buildingCaveat } from "@/data/skills";
import { Section, Tag } from "@/components/ui/section";
import type { SkillGroup } from "@/data/skills";

function Group({ group }: { group: SkillGroup }) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.08em] text-mute">
        {group.label.toLowerCase()}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {group.items.map((item) => (
          <Tag key={item}>{item}</Tag>
        ))}
      </div>
    </div>
  );
}

export function Skills() {
  return (
    <Section id="skills" index="04" label="skills">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          <h3 className="text-xl">Core</h3>
          <p className="mt-1.5 max-w-[54ch] text-sm text-mute">
            What I will defend in depth, unprompted.
          </p>
          <div className="mt-7 space-y-7">
            {coreSkills.map((g) => (
              <Group key={g.label} group={g} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-6">
          <h3 className="text-xl">Actively building with</h3>
          <p className="mt-1.5 max-w-[46ch] text-sm text-mute">{buildingCaveat}</p>
          <div className="mt-7 space-y-7">
            {buildingSkills.map((g) => (
              <Group key={g.label} group={g} />
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

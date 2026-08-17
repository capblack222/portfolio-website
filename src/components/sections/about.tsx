import { profile } from "@/data/profile";
import { Section } from "@/components/ui/section";

export function About() {
  return (
    <Section id="about" index="02" label="about">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-5 text-[17px]">
          {profile.about.map((para) => (
            <p key={para.slice(0, 24)} className="max-w-[62ch]">
              {para}
            </p>
          ))}
        </div>

        <aside className="rounded-xl border border-line bg-surface p-5">
          <p className="font-mono text-[11px] tracking-[0.08em] text-mute">
            certification
          </p>
          <p className="mt-3 text-hi">{profile.certification.name}</p>
          <p className="mt-1.5 font-mono text-xs text-terminal">
            {profile.certification.status}
          </p>
        </aside>
      </div>
    </Section>
  );
}

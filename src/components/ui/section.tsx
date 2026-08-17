import { Reveal } from "@/components/effects/reveal";

type SectionProps = {
  id: string;
  index: string;
  label: string;
  title?: string;
  children: React.ReactNode;
};

export function Section({ id, index, label, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-20 sm:py-28">
      <Reveal>
        <p className="font-mono text-[11px] tracking-[0.08em] text-mute">
          {`// ${index} — ${label}`}
        </p>
        {title ? (
          <h2 className="mt-4 max-w-[24ch] text-3xl sm:text-4xl">{title}</h2>
        ) : null}
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-10">{children}</div>
      </Reveal>
    </section>
  );
}

export function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-[1120px] px-6 sm:px-8">
      {children}
    </div>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-line bg-raised px-2.5 py-1 font-mono text-[11px] text-mute">
      {children}
    </span>
  );
}

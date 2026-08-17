import { Container } from "@/components/ui/section";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Projects } from "@/components/sections/projects";
import { Skills } from "@/components/sections/skills";
import { Experience } from "@/components/sections/experience";
import { Contact } from "@/components/sections/contact";
import { profile } from "@/data/profile";

export default function Home() {
  return (
    <Container>
      <main id="main">
        <Hero />
        {/* Sticky nav watches this rather than listening to scroll events. */}
        <div id="hero-sentinel" aria-hidden="true" className="h-px w-full" />
        <About />
        <Projects />
        <Skills />
        <Experience />
        <Contact />
      </main>

      <footer className="border-t border-line py-10">
        <p className="font-mono text-xs text-mute">
          {profile.name} — built with Next.js, {new Date().getFullYear()}.
        </p>
      </footer>
    </Container>
  );
}

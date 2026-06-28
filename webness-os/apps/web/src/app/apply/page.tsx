import { ApplyForm } from "@/components/landing/apply-form";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

export const metadata = {
  title: "Apply For Signal Scan - Webness",
  description:
    "Apply for a paid Webness Signal Scan to diagnose whether your next move should be website, app, marketing system, automation, or retainer support.",
};

export default function ApplyPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden bg-slate-950 pt-32 pb-24 text-white">
          <div className="container-md relative z-10">
            <ScrollReveal delay={0}>
              <div className="mb-12 max-w-4xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">
                  Apply for diagnosis
                </p>
                <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                  Tell Webness what is stuck before buying a build.
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-300">
                  The Signal Scan is the paid filter before websites, apps,
                  portals, marketing systems, and retainers. Serious applications
                  get reviewed for fit before Webness recommends the next step.
                </p>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={150}>
              <ApplyForm />
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

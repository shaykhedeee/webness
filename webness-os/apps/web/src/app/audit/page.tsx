import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { AuditForm } from "./audit-form";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

export default function AuditPage() {
  return (
    <>
      <Header />
      <main>
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.08),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] pt-32 pb-24 text-white">
          <div className="container-md relative z-10">
            <ScrollReveal delay={0}>
              <div className="mb-12 max-w-4xl">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">
                  Growth Scan
                </p>
                <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                  Business Growth Scan for serious Webness applicants.
                </h1>
                <p className="mt-6 text-lg leading-8 text-slate-300 sm:text-xl">
                  Use this lightweight scan to preview the Signal Room logic. The
                  full diagnosis is a paid Signal Scan for qualified website, app,
                  marketing, or retainer work.
                </p>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={150}>
              <AuditForm />
            </ScrollReveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

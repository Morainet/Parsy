import { ArrowRight, Lock, Zap, ShieldCheck, Gauge, Code2, Sparkles, ClipboardPaste, MousePointerClick, CopyPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { TOOLS } from "@parsy/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { FaqItem } from "@/components/home/faq-item";

export default function HomePage() {
  const t = useTranslations("home");
  const tt = useTranslations("tools");
  const live = TOOLS.filter((tool) => tool.available);
  const soon = TOOLS.filter((tool) => !tool.available);
  // FAQ items are an array in the message file; read them raw.
  const faqItems = t.raw("faq.items") as Array<{ q: string; a: string }>;

  return (
    <div>
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-70" />
        <div className="glow-primary pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 opacity-60" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:pb-28 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="animate-fade-up">
              <Badge
                variant="secondary"
                className="mb-6 gap-1.5 border-border/60 px-3 py-1 text-xs shadow-soft"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                </span>
                {t("badge")}
              </Badge>
            </div>

            <h1 className="animate-fade-up text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl sm:leading-[1.05]">
              {t("heroTitle")}{" "}
              <span className="text-gradient">{t("heroTitleAccent")}</span>
            </h1>

            <p className="animate-fade-up mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
              {t("heroSubtitle")}
            </p>

            <div className="animate-fade-up mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base shadow-soft">
                <Link href="/json-formatter">
                  {t("ctaPrimary")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-6 text-base"
              >
                <Link href="/json-validator">{t("ctaSecondary")}</Link>
              </Button>
            </div>

            <p className="animate-fade-in mt-6 text-xs text-muted-foreground/70">
              {t("trustLine")}
            </p>
          </div>

          {/* feature pillars */}
          <div className="stagger mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
            <Pillar
              icon={<Zap className="h-5 w-5" />}
              title={t("pillars.fast.title")}
              desc={t("pillars.fast.desc")}
            />
            <Pillar
              icon={<ShieldCheck className="h-5 w-5" />}
              title={t("pillars.private.title")}
              desc={t("pillars.private.desc")}
            />
            <Pillar
              icon={<Gauge className="h-5 w-5" />}
              title={t("pillars.precise.title")}
              desc={t("pillars.precise.desc")}
            />
          </div>
        </div>
      </section>

      {/* ─────────────────────── Tools (bento) ─────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("sections.toolsTitle")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t("sections.toolsSubtitle")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((tool, i) => (
            <ToolCard
              key={tool.slug}
              slug={tool.slug}
              href={tool.href}
              icon={tool.icon}
              title={tt(`${tool.slug}.title`)}
              description={tt(`${tool.slug}.description`)}
              openLabel={t("openTool")}
              featured={i === 0}
            />
          ))}

          {soon.map((tool) => (
            <SoonCard
              key={tool.slug}
              icon={tool.icon}
              title={tt(`${tool.slug}.title`)}
              description={tt(`${tool.slug}.description`)}
              comingSoonLabel={t("comingSoon")}
            />
          ))}
        </div>
      </section>

      {/* ───────────────────────── Why ───────────────────────── */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:grid-cols-3 sm:py-20">
          <WhyItem
            icon={<Lock className="h-5 w-5" />}
            title={t("why.privacy.title")}
            body={t("why.privacy.body")}
          />
          <WhyItem
            icon={<Code2 className="h-5 w-5" />}
            title={t("why.developers.title")}
            body={t("why.developers.body")}
          />
          <WhyItem
            icon={<Sparkles className="h-5 w-5" />}
            title={t("why.free.title")}
            body={t("why.free.body")}
          />
        </div>
      </section>

      {/* ─────────────────────── How it works ─────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("sections.howTitle")}
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <HowStep
            num="1"
            icon={<ClipboardPaste className="h-5 w-5" />}
            title={t("how.step1.title")}
            desc={t("how.step1.desc")}
          />
          <HowStep
            num="2"
            icon={<MousePointerClick className="h-5 w-5" />}
            title={t("how.step2.title")}
            desc={t("how.step2.desc")}
          />
          <HowStep
            num="3"
            icon={<CopyPlus className="h-5 w-5" />}
            title={t("how.step3.title")}
            desc={t("how.step3.desc")}
          />
        </div>
      </section>

      {/* ─────────────────────────── FAQ ─────────────────────────── */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("sections.faqTitle")}
          </h2>
          <div className="divide-y divide-border">
            {faqItems.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────── Footer CTA ──────────────────────── */}
      <section className="relative overflow-hidden border-t border-border">
        <div className="glow-primary pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:py-24">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {t("footerCta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            {t("footerCta.subtitle")}
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="h-12 px-6 text-base shadow-soft">
              <Link href="/json-formatter">
                {t("footerCta.button")}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ----------------------------- cards ----------------------------- */

function ToolCard({
  href,
  icon,
  title,
  description,
  openLabel,
  featured,
}: {
  slug: string;
  href: string;
  icon: string;
  title: string;
  description: string;
  openLabel: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg",
        featured && "sm:col-span-2 lg:col-span-1",
      )}
    >
      <div className="glow-primary pointer-events-none absolute -right-16 -top-16 h-48 w-48 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex h-full flex-col">
        <div className="mb-4 flex items-center justify-between">
          <span
            className={cn(
              "grid place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground",
              featured ? "h-12 w-12 text-2xl" : "h-11 w-11 text-xl",
            )}
            aria-hidden
          >
            {icon}
          </span>
          <ArrowRight className="h-4 w-4 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
        </div>

        <h3 className={cn("font-semibold tracking-tight", featured ? "text-xl" : "text-lg")}>
          {title}
        </h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          {openLabel}
        </span>
      </div>
    </Link>
  );
}

function SoonCard({
  icon,
  title,
  description,
  comingSoonLabel,
}: {
  icon: string;
  title: string;
  description: string;
  comingSoonLabel: string;
}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-dashed border-border bg-card/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-xl text-muted-foreground grayscale">
          {icon}
        </span>
        <Badge variant="outline" className="text-muted-foreground">
          {comingSoonLabel}
        </Badge>
      </div>
      <h3 className="font-semibold tracking-tight text-muted-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground/70">
        {description}
      </p>
    </div>
  );
}

/* ----------------------------- bits ----------------------------- */

function Pillar({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 text-left shadow-soft backdrop-blur-sm">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function WhyItem({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-soft">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function HowStep({
  num,
  icon,
  title,
  desc,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          {num}
        </span>
        <span className="text-primary">{icon}</span>
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

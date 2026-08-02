import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonRepair } from "@/components/repair/json-repair";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.repair" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/json-repair` },
    openGraph: { title: t("title"), description: t("description") },
  };
}

export default async function JsonRepairPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTools = await getTranslations({ locale, namespace: "tools.json-repair" });
  return (
    <JsonRepair title={tTools("title")} description={tTools("description")} />
  );
}

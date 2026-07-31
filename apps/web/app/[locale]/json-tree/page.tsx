import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonTree } from "@/components/tree/json-tree";
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
  const t = await getTranslations({ locale, namespace: "metadata.tree" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/json-tree` },
    openGraph: { title: t("title"), description: t("description") },
  };
}

export default async function JsonTreePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTools = await getTranslations({ locale, namespace: "tools.json-tree" });
  return (
    <JsonTree title={tTools("title")} description={tTools("description")} />
  );
}

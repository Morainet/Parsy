import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonTool } from "@/components/formatter/json-tool";
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
  const t = await getTranslations({ locale, namespace: "metadata.formatter" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/json-formatter` },
    openGraph: { title: t("title"), description: t("description") },
  };
}

export default async function JsonFormatterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTools = await getTranslations({ locale, namespace: "tools.json-formatter" });
  return (
    <JsonTool
      initialMode="format"
      title={tTools("title")}
      description={tTools("description")}
    />
  );
}

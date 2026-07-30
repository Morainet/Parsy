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
  const t = await getTranslations({ locale, namespace: "metadata.validator" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: `/${locale}/json-validator` },
    openGraph: { title: t("title"), description: t("description") },
  };
}

export default async function JsonValidatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tTools = await getTranslations({ locale, namespace: "tools.json-validator" });
  return (
    <JsonTool
      initialMode="validate"
      title={tTools("title")}
      description={tTools("description")}
    />
  );
}

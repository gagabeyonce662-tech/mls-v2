import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EstateProjectDetail from "@/components/preconstruction/EstateProjectDetail";
import { fetchEstateProject, getEstateProjectLocation } from "@/lib/api/estate";
import { isApiError } from "@/lib/api/client";

interface EstateProjectPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

const getEstateProject = cache(fetchEstateProject);

async function getPublishedProject(slug: string) {
  try {
    return await getEstateProject(slug);
  } catch (error: unknown) {
    if (isApiError(error) && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: EstateProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  const location = getEstateProjectLocation(project);
  const developer = project.developer?.trim();
  const description = [
    `${project.title} pre-construction project in ${location}.`,
    developer ? `Developed by ${developer}.` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" ");
  const images = project.featured_image_url
    ? [{ url: project.featured_image_url, alt: project.title }]
    : undefined;

  return {
    title: `${project.title} | Pre-Construction | Estate-4u`,
    description,
    openGraph: {
      title: project.title,
      description,
      type: "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      ...(project.featured_image_url
        ? { images: [project.featured_image_url] }
        : {}),
    },
  };
}

export default async function EstateProjectPage({ params }: EstateProjectPageProps) {
  const { slug } = await params;
  const project = await getPublishedProject(slug);

  return <EstateProjectDetail project={project} />;
}

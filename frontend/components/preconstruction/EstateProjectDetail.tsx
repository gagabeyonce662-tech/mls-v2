import Image from "next/image";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import type { EstateProject } from "@/lib/api/estate";
import { getEstateProjectFacts, getEstateProjectLocation } from "@/lib/api/estate";
import EstateStructuredContent from "./EstateStructuredContent";

interface EstateProjectDetailProps {
  project: EstateProject;
}

export default function EstateProjectDetail({ project }: EstateProjectDetailProps) {
  const sections = project.sections.filter(
    (section) => section.heading.trim() || section.html.trim(),
  );
  const facts = getEstateProjectFacts(project);

  return (
    <div className="min-h-screen bg-ds-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-32">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">
          Pre-Construction
        </p>
        <h1 className="mt-2 text-4xl font-extrabold text-ds-heading sm:text-5xl">
          {project.title}
        </h1>
        <p className="mt-3 text-lg text-ds-body">
          {getEstateProjectLocation(project)}
        </p>

        {facts.length > 0 && (
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 rounded-2xl border border-gray-200 bg-white p-5">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-sm font-semibold text-ds-body">{fact.label}</dt>
                <dd className="mt-1 font-bold text-ds-heading">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {project.featured_image_url && (
          <div className="relative my-8 aspect-[16/9] max-h-[32rem] overflow-hidden rounded-2xl bg-gray-100">
            <Image
              src={project.featured_image_url}
              alt={`${project.title} pre-construction project`}
              fill
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
            />
          </div>
        )}

        {sections.length > 0 && (
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.id}>
                {section.heading.trim() && (
                  <h2 className="mb-3 text-2xl font-bold text-ds-heading">
                    {section.heading}
                  </h2>
                )}
                {section.html.trim() && (
                  <div
                    className="prose max-w-none text-ds-body"
                    dangerouslySetInnerHTML={{ __html: section.html }}
                  />
                )}
              </section>
            ))}
          </div>
        )}

        <div className={sections.length > 0 ? "mt-10" : "mt-8"}>
          <EstateStructuredContent project={project} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

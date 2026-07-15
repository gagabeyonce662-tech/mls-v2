import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EstateStructuredContent from "./EstateStructuredContent";
import type { EstateProject } from "@/lib/api/estate";

export default function EstateProjectDetail({project}:{project:EstateProject}) {
  return <div className="min-h-screen bg-ds-background"><Header/><main className="mx-auto max-w-5xl px-4 py-12"><p className="text-sm font-semibold uppercase text-orange-600">Pre-construction</p><h1 className="mt-2 text-4xl font-extrabold">{project.title}</h1><p className="mt-3 text-lg text-ds-body">{[project.address, project.city, project.province].filter(Boolean).join(", ")}</p>{project.featured_image_url && <img src={project.featured_image_url} alt="" className="my-8 max-h-[32rem] w-full rounded-2xl object-cover"/>}<div className="space-y-8">{project.sections?.map(section=><section key={section.id}><h2 className="mb-3 text-2xl font-bold">{section.heading}</h2><div className="prose max-w-none" dangerouslySetInnerHTML={{__html:section.html}}/></section>)}</div><div className="mt-10"><EstateStructuredContent project={project}/></div></main><Footer/></div>;
}

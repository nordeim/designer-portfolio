"use client";

import { useState } from "react";
import type { ProjectView } from "@/lib/data";
import { ProjectFormDialog, type ProjectFormValues } from "./project-form-dialog";
import { ProjectRowActions } from "./project-row-actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

/**
 * Client wrapper for the projects management page: holds the dialog state
 * (create vs edit) and renders the table rows.
 */
export function ProjectsManager({ projects }: { projects: ProjectView[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectFormValues | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(project: ProjectView) {
    setEditing({
      id: project.id,
      slug: project.slug,
      order: project.order,
      title: project.title,
      subtitle: project.subtitle,
      role: project.role,
      year: project.year,
      category: project.category,
      objective: project.objective,
      tagline: project.tagline,
      description: project.description,
      problem: project.problem,
      solution: project.solution,
      process: project.process,
      outcomes: project.outcomes,
      deliverables: project.deliverables,
      gallery: project.gallery,
      heroImage: project.heroImage,
      coverImage: project.coverImage,
      processImage: project.processImage ?? "",
      featured: project.featured,
      published: project.published,
    });
    setDialogOpen(true);
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <p className="label-mono text-muted-foreground mb-2">CONTENT</p>
          <h1 className="font-body text-3xl md:text-4xl font-light tracking-tight text-foreground">Projects</h1>
        </div>
        <Button onClick={openCreate} className="font-body text-sm">
          <Plus className="h-4 w-4" aria-hidden />
          New project
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="border border-dashed border-border p-8 font-body text-sm text-muted-foreground text-center">
          No projects yet — create the first one.
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {projects.map((p) => (
            <li key={p.id} className="py-4 grid grid-cols-12 gap-4 items-center">
              <button
                type="button"
                onClick={() => openEdit(p)}
                className="col-span-12 md:col-span-6 flex items-center gap-4 min-w-0 text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label={`Edit ${p.title}`}
              >
                <span className="label-mono text-muted-foreground shrink-0">
                  {String(p.order).padStart(2, "0")}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="font-body text-sm text-foreground truncate group-hover:text-cobalt transition-colors">
                    {p.title}
                  </span>
                  <span className="font-body text-xs text-muted-foreground truncate">{p.subtitle}</span>
                </span>
              </button>

              <div className="col-span-6 md:col-span-3 flex gap-2 flex-wrap">
                <span
                  className={`label-mono px-2 py-1 border ${
                    p.published
                      ? "border-emerald-600/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {p.published ? "PUBLISHED" : "DRAFT"}
                </span>
                {p.featured && (
                  <span className="label-mono px-2 py-1 border border-cobalt/40 text-cobalt bg-accent">FEATURED</span>
                )}
              </div>

              <div className="col-span-6 md:col-span-3">
                <ProjectRowActions id={p.id} title={p.title} published={p.published} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <ProjectFormDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editing} />
    </div>
  );
}

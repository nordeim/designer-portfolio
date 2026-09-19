"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createProjectAction, updateProjectAction } from "@/actions/dashboard";
import { type ProjectInput, type MediaItem } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export interface ProjectFormValues extends ProjectInput {
  id?: string;
}

/**
 * Create/edit project form used by the dashboard. All fields post through the
 * Zod-validated server actions; list-valued fields (outcomes, deliverables,
 * gallery) are edited as newline-separated text and split on submit.
 */
export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectFormValues | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const editing = Boolean(project?.id);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const values: ProjectInput = {
      slug: String(form.get("slug") ?? ""),
      order: Number(form.get("order") ?? 0),
      title: String(form.get("title") ?? ""),
      subtitle: String(form.get("subtitle") ?? ""),
      role: String(form.get("role") ?? ""),
      year: String(form.get("year") ?? ""),
      category: String(form.get("category") ?? ""),
      objective: String(form.get("objective") ?? ""),
      tagline: String(form.get("tagline") ?? ""),
      description: String(form.get("description") ?? ""),
      problem: String(form.get("problem") ?? ""),
      solution: String(form.get("solution") ?? ""),
      process: String(form.get("process") ?? ""),
      outcomes: String(form.get("outcomes") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      deliverables: String(form.get("deliverables") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      gallery: String(form.get("gallery") ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map<MediaItem>((line) => {
          const [kind, ...rest] = line.split(" ");
          const src = rest.join(" ");
          if ((kind === "image" || kind === "video") && src) return { kind, src, alt: "Gallery item" };
          return { kind: "image", src: line, alt: "Gallery item" };
        }),
      heroImage: String(form.get("heroImage") ?? ""),
      coverImage: String(form.get("coverImage") ?? ""),
      processImage: String(form.get("processImage") ?? ""),
      featured: form.get("featured") === "on",
      published: form.get("published") === "on",
    };

    startTransition(async () => {
      const result = editing && project?.id
        ? await updateProjectAction(project.id, values)
        : await createProjectAction(values);
      if (result.ok) {
        toast.success(editing ? "Project updated." : "Project created.");
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="font-body font-light text-xl">
            {editing ? "Edit project" : "New project"}
          </DialogTitle>
          <DialogDescription className="font-body text-xs">
            Fields marked * are required. Outcomes, deliverables and gallery are one item per line; gallery lines start
            with &quot;image&quot; or &quot;video&quot;.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
          <Field label="Slug *" name="slug" defaultValue={project?.slug} placeholder="kinto-cafe-branding" />
          <Field label="Order" name="order" type="number" defaultValue={project?.order ?? 0} />
          <Field label="Title *" name="title" defaultValue={project?.title} />
          <Field label="Subtitle *" name="subtitle" defaultValue={project?.subtitle} />
          <Field label="Role *" name="role" defaultValue={project?.role} />
          <Field label="Year *" name="year" defaultValue={project?.year} placeholder="2035" />
          <Field label="Category *" name="category" defaultValue={project?.category} />
          <Field label="Tagline *" name="tagline" defaultValue={project?.tagline} />
          <Field label="Hero image path *" name="heroImage" defaultValue={project?.heroImage} placeholder="/projects/<slug>/hero.jpg" />
          <Field label="Cover image path *" name="coverImage" defaultValue={project?.coverImage} placeholder="/projects/<slug>/cover.jpg" />
          <Field label="Process image path" name="processImage" defaultValue={project?.processImage ?? ""} placeholder="/projects/<slug>/process.jpg" />

          <WideField label="Objective *" name="objective" defaultValue={project?.objective} />
          <WideField label="Description *" name="description" defaultValue={project?.description} rows={4} />
          <WideField label="Problem *" name="problem" defaultValue={project?.problem} rows={3} />
          <WideField label="Solution *" name="solution" defaultValue={project?.solution} rows={3} />
          <WideField label="Process *" name="process" defaultValue={project?.process} rows={3} />
          <WideField
            label="Outcomes (one per line)"
            name="outcomes"
            defaultValue={project?.outcomes?.join("\n")}
            rows={3}
          />
          <WideField
            label="Deliverables (one per line)"
            name="deliverables"
            defaultValue={project?.deliverables?.join("\n")}
            rows={3}
          />
          <WideField
            label="Gallery (one per line: image|video + path)"
            name="gallery"
            defaultValue={project?.gallery?.map((g) => `${g.kind} ${g.src}`).join("\n")}
            rows={4}
          />

          <div className="md:col-span-2 flex items-center gap-8 py-2">
            <div className="flex items-center gap-3">
              <Switch id="featured" name="featured" defaultChecked={project?.featured ?? true} />
              <Label htmlFor="featured">Featured on home</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="published" name="published" defaultChecked={project?.published ?? true} />
              <Label htmlFor="published">Published</Label>
            </div>
          </div>

          {error && (
            <p className="md:col-span-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Create project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} />
    </div>
  );
}

function WideField({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <div className="md:col-span-2 flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} rows={rows} defaultValue={defaultValue} />
    </div>
  );
}

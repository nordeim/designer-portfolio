"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { submitInquiryAction, type SubmitInquiryPayload } from "@/actions/contact";
import { inquirySchema, type InquiryInput } from "@/lib/validation";
import { PROJECT_TYPES, BUDGET_RANGES, TIMELINES } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Project inquiry form. Client-side validation mirrors the server's Zod
 * schema; the honeypot field is visually hidden from real users. Submissions
 * resolve to an ActionResult envelope — errors render inline, success
 * switches the panel to a confirmation state.
 */
export function InquiryForm() {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      projectType: "Brand Identity",
      budgetRange: "$10K – $25K",
      timeline: "1 – 2 months",
      details: "",
    },
  });

  function onSubmit(values: InquiryInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await submitInquiryAction(values satisfies SubmitInquiryPayload);
      if (result.ok) {
        setSent(true);
        reset();
        toast.success("Inquiry sent — I'll get back to you within 48 hours.");
      } else {
        setServerError(result.error);
        toast.error(result.error);
      }
    });
  }

  if (sent) {
    return (
      <div className="border border-border bg-card p-8 md:p-10 flex flex-col gap-4" role="status">
        <p className="label-mono text-cobalt">INQUIRY SENT</p>
        <h3 className="font-body text-2xl font-light tracking-tight text-foreground">
          Thank you — your project brief has landed.
        </h3>
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          I read every inquiry personally and respond within 48 hours. If your timeline is urgent, mention it in a
          follow-up email and I&apos;ll prioritize the review.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-2 self-start"
          onClick={() => {
            setSent(false);
            reset();
          }}
        >
          Send another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6" aria-label="Project inquiry form">
      {/* Honeypot — hidden from users, irresistible to bots. */}
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="website">Website</Label>
        <Input id="website" tabIndex={-1} autoComplete="off" {...register("website" as never)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">
            NAME <span className="text-cobalt" aria-hidden>*</span>
          </Label>
          <Input id="name" placeholder="Your full name" autoComplete="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">
            EMAIL <span className="text-cobalt" aria-hidden>*</span>
          </Label>
          <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="company">COMPANY</Label>
        <Input id="company" placeholder="Company name" autoComplete="organization" {...register("company")} />
        {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="projectType">PROJECT TYPE</Label>
          <Select
            onValueChange={(v) => setValue("projectType", v as InquiryInput["projectType"])}
            defaultValue="Brand Identity"
          >
            <SelectTrigger id="projectType" className="w-full">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projectType && <p className="text-xs text-destructive">{errors.projectType.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="budgetRange">BUDGET RANGE</Label>
          <Select
            onValueChange={(v) => setValue("budgetRange", v as InquiryInput["budgetRange"])}
            defaultValue="$10K – $25K"
          >
            <SelectTrigger id="budgetRange" className="w-full">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_RANGES.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.budgetRange && <p className="text-xs text-destructive">{errors.budgetRange.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="timeline">TIMELINE</Label>
          <Select onValueChange={(v) => setValue("timeline", v as InquiryInput["timeline"])} defaultValue="1 – 2 months">
            <SelectTrigger id="timeline" className="w-full">
              <SelectValue placeholder="Select timeline" />
            </SelectTrigger>
            <SelectContent>
              {TIMELINES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.timeline && <p className="text-xs text-destructive">{errors.timeline.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="details">
          PROJECT DETAILS <span className="text-cobalt" aria-hidden>*</span>
        </Label>
        <Textarea
          id="details"
          rows={6}
          placeholder="Tell me about your project, goals, and what success looks like..."
          {...register("details")}
        />
        {errors.details && <p className="text-xs text-destructive">{errors.details.message}</p>}
      </div>

      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start label-mono tracking-[0.25em] py-6 px-8">
        {pending ? "SENDING…" : "SEND INQUIRY"}
      </Button>
    </form>
  );
}

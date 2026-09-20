"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { submitInquiryAction, type SubmitInquiryPayload } from "@/actions/contact";
import { inquirySchema, type InquiryInput } from "@/lib/validation";
import { PROJECT_TYPES, BUDGET_RANGES, TIMELINES } from "@/lib/site-config";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FIELD_LABEL = "font-mono text-xs tracking-widest uppercase text-muted-foreground block mb-2";
const FIELD_INPUT =
  "bg-transparent border-0 border-b border-border rounded-none font-body text-base h-12 px-0 focus-visible:ring-0 focus-visible:rounded-none focus-visible:border-b-2 focus-visible:border-cobalt";

/**
 * Project inquiry form, styled after the reference app's underline-field
 * design (hairline bottom borders, cobalt focus, charcoal submit pill).
 * Client-side validation mirrors the server's Zod schema; the honeypot
 * field stays hidden from real users. Submissions resolve to an
 * ActionResult envelope — errors render inline, success swaps the panel
 * for the reference's centered confirmation state.
 */
export function InquiryForm() {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  // Remount key: after a successful submit (or reset), the Radix Selects are
  // uncontrolled — remounting the form subtree restores their placeholder
  // state alongside the react-hook-form reset.
  const [formKey, setFormKey] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    // The three selects deliberately start EMPTY (source-app parity: the
    // triggers show their "Select a type"-style placeholders); Zod reports
    // a friendly prompt if the form is submitted without a selection.
    defaultValues: {
      name: "",
      email: "",
      company: "",
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
        setFormKey((k) => k + 1);
        toast.success("Inquiry sent successfully.");
      } else {
        setServerError(result.error);
        toast.error(result.error);
      }
    });
  }

  // Parity with the reference app's error path: a destructive toast for
  // missing required fields (inline field errors render as well).
  function onInvalid() {
    toast.error("Please fill in all required fields.");
  }

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-16 text-center"
        role="status"
      >
        <h3 className="font-body text-2xl md:text-3xl font-light text-foreground mb-4">
          Thank you for reaching out.
        </h3>
        <p className="font-body text-base text-muted-foreground">
          I&apos;ll review your inquiry and respond within 48 hours.
        </p>
        <button
          type="button"
          className="mt-8 font-mono text-xs tracking-widest uppercase text-foreground hover:text-cobalt transition-colors border-b border-foreground/20 hover:border-cobalt pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          onClick={() => {
            setSent(false);
            reset();
            setFormKey((k) => k + 1);
          }}
        >
          Send another inquiry →
        </button>
      </motion.div>
    );
  }

  return (
    <form key={formKey} onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-8" aria-label="Project inquiry form">
      {/* Honeypot — hidden from users, irresistible to bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website" className={FIELD_LABEL}>
          Website
        </label>
        <Input id="website" tabIndex={-1} autoComplete="off" {...register("website" as never)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className={FIELD_LABEL}>
            Name *
          </label>
          <Input id="name" placeholder="Your full name" autoComplete="name" className={FIELD_INPUT} {...register("name")} />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className={FIELD_LABEL}>
            Email *
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            className={FIELD_INPUT}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="company" className={FIELD_LABEL}>
            Company
          </label>
          <Input id="company" placeholder="Company name" autoComplete="organization" className={FIELD_INPUT} {...register("company")} />
          {errors.company && <p className="text-xs text-destructive mt-1">{errors.company.message}</p>}
        </div>

        <div>
          <label htmlFor="projectType" className={FIELD_LABEL}>
            Project Type
          </label>
          <Select onValueChange={(v) => setValue("projectType", v as InquiryInput["projectType"])}>
            <SelectTrigger id="projectType" className={`${FIELD_INPUT} w-full`}>
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="focus:bg-charcoal focus:text-gallery">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.projectType && <p className="text-xs text-destructive mt-1">{errors.projectType.message}</p>}
        </div>

        <div>
          <label htmlFor="budgetRange" className={FIELD_LABEL}>
            Budget Range
          </label>
          <Select
            onValueChange={(v) => setValue("budgetRange", v as InquiryInput["budgetRange"])}
          >
            <SelectTrigger id="budgetRange" className={`${FIELD_INPUT} w-full`}>
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {BUDGET_RANGES.map((b) => (
                <SelectItem key={b} value={b} className="focus:bg-charcoal focus:text-gallery">
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.budgetRange && <p className="text-xs text-destructive mt-1">{errors.budgetRange.message}</p>}
        </div>

        <div>
          <label htmlFor="timeline" className={FIELD_LABEL}>
            Timeline
          </label>
          <Select onValueChange={(v) => setValue("timeline", v as InquiryInput["timeline"])}>
            <SelectTrigger id="timeline" className={`${FIELD_INPUT} w-full`}>
              <SelectValue placeholder="Select timeline" />
            </SelectTrigger>
            <SelectContent>
              {TIMELINES.map((t) => (
                <SelectItem key={t} value={t} className="focus:bg-charcoal focus:text-gallery">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.timeline && <p className="text-xs text-destructive mt-1">{errors.timeline.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="details" className={FIELD_LABEL}>
          Project Details *
        </label>
        <Textarea
          id="details"
          rows={6}
          placeholder="Tell me about your project, goals, and what success looks like..."
          className="bg-transparent border-0 border-b border-border rounded-none font-body text-base min-h-[160px] px-0 focus-visible:ring-0 focus-visible:rounded-none focus-visible:border-b-2 focus-visible:border-cobalt resize-none"
          {...register("details")}
        />
        {errors.details && <p className="text-xs text-destructive mt-1">{errors.details.message}</p>}
      </div>

      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center px-10 py-4 bg-charcoal text-gallery font-mono text-xs tracking-widest uppercase hover:bg-cobalt transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-4 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send Inquiry"}
      </button>
    </form>
  );
}

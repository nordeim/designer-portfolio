"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { deleteInquiryAction, updateInquiryStatusAction } from "@/actions/dashboard";
import type { InquirySummary } from "@/lib/data";
import { STATUS_META, statusStyle } from "./status-meta";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/**
 * Inquiries table with status workflow (NEW → READ → REPLIED → ARCHIVED),
 * a detail dialog, and delete with confirm. All mutations run through the
 * authorized server actions.
 */
export function InquiriesManager({ inquiries }: { inquiries: InquirySummary[] }) {
  const router = useRouter();
  const [detail, setDetail] = useState<InquirySummary | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function setStatus(id: string, status: string) {
    startTransition(async () => {
      const result = await updateInquiryStatusAction(id, status);
      if (result.ok) {
        toast.success(`Marked as ${status.toLowerCase()}.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteInquiryAction(id);
      if (result.ok) {
        toast.success("Inquiry deleted.");
        setConfirmDelete(null);
        setDetail(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <div className="mb-10">
        <p className="label-mono text-muted-foreground mb-2">INBOX</p>
        <h1 className="font-body text-3xl md:text-4xl font-light tracking-tight text-foreground">Inquiries</h1>
      </div>

      {inquiries.length === 0 ? (
        <p className="border border-dashed border-border p-8 font-body text-sm text-muted-foreground text-center">
          No inquiries yet — submissions from the contact form will appear here.
        </p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id} className="py-4 grid grid-cols-12 gap-4 items-center">
              <button
                type="button"
                onClick={() => setDetail(inquiry)}
                className="col-span-12 md:col-span-5 flex flex-col gap-1 min-w-0 text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label={`Open inquiry from ${inquiry.name}`}
              >
                <span className="flex items-center gap-3">
                  <span className="font-body text-sm text-foreground truncate group-hover:text-cobalt transition-colors">
                    {inquiry.name}
                  </span>
                  {inquiry.status === "NEW" && <span className="h-1.5 w-1.5 rounded-full bg-cobalt shrink-0" aria-hidden />}
                </span>
                <span className="font-body text-xs text-muted-foreground truncate">{inquiry.email}</span>
              </button>

              <span className="col-span-6 md:col-span-2 label-mono text-muted-foreground truncate">
                {inquiry.projectType.toUpperCase()}
              </span>

              <span className="hidden md:block md:col-span-2 font-body text-xs text-muted-foreground">
                {format(inquiry.createdAt, "MMM d, yyyy")}
              </span>

              <div className="col-span-3 md:col-span-2">
                <Select
                  defaultValue={inquiry.status}
                  onValueChange={(v) => setStatus(inquiry.id, v)}
                  disabled={pending}
                >
                  <SelectTrigger className="h-8 w-full font-body text-xs" aria-label={`Status for ${inquiry.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(STATUS_META).map((meta) => (
                      <SelectItem key={meta.label} value={meta.label}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-3 md:col-span-1 flex justify-end">
                {confirmDelete === inquiry.id ? (
                  <div className="flex gap-1">
                    <Button variant="destructive" size="sm" onClick={() => remove(inquiry.id)} disabled={pending} className="h-8 text-xs">
                      Confirm
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)} className="h-8 text-xs">
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDelete(inquiry.id)}
                    disabled={pending}
                    className="h-8 text-xs text-destructive hover:text-destructive"
                    aria-label={`Delete inquiry from ${inquiry.name}`}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Detail dialog */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto scroll-thin">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-body font-light text-xl">{detail.name}</DialogTitle>
                <DialogDescription className="font-body text-xs">
                  {format(detail.createdAt, "EEEE, MMMM d, yyyy 'at' HH:mm")}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 font-body text-sm">
                <div className="col-span-2">
                  <dt className="label-mono text-muted-foreground mb-1">EMAIL</dt>
                  <dd>
                    <a href={`mailto:${detail.email}`} className="text-cobalt underline underline-offset-4">
                      {detail.email}
                    </a>
                  </dd>
                </div>
                {detail.company && (
                  <div className="col-span-2">
                    <dt className="label-mono text-muted-foreground mb-1">COMPANY</dt>
                    <dd className="text-foreground">{detail.company}</dd>
                  </div>
                )}
                <div>
                  <dt className="label-mono text-muted-foreground mb-1">TYPE</dt>
                  <dd className="text-foreground">{detail.projectType}</dd>
                </div>
                <div>
                  <dt className="label-mono text-muted-foreground mb-1">BUDGET</dt>
                  <dd className="text-foreground">{detail.budgetRange}</dd>
                </div>
                <div>
                  <dt className="label-mono text-muted-foreground mb-1">TIMELINE</dt>
                  <dd className="text-foreground">{detail.timeline}</dd>
                </div>
                <div>
                  <dt className="label-mono text-muted-foreground mb-1">STATUS</dt>
                  <dd>
                    <span className={`label-mono px-2 py-1 border ${statusStyle(detail.status)}`}>
                      {STATUS_META[detail.status as keyof typeof STATUS_META]?.label ?? detail.status}
                    </span>
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="label-mono text-muted-foreground mb-1">DETAILS</dt>
                  <dd className="text-foreground leading-relaxed whitespace-pre-wrap">{detail.details}</dd>
                </div>
              </dl>
              <div className="flex justify-between items-center gap-3 pt-2">
                <Select
                  defaultValue={detail.status}
                  onValueChange={(v) => {
                    setStatus(detail.id, v);
                    setDetail({ ...detail, status: v });
                  }}
                  disabled={pending}
                >
                  <SelectTrigger className="w-36 font-body text-xs h-8" aria-label="Change status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(STATUS_META).map((meta) => (
                      <SelectItem key={meta.label} value={meta.label}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setConfirmDelete(detail.id);
                    setDetail(null);
                  }}
                  disabled={pending}
                  className="text-destructive hover:text-destructive"
                >
                  Delete inquiry
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getDashboardStats, getInquiries } from "@/lib/data";
import { STATUS_META, statusStyle } from "@/components/dashboard/status-meta";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const [stats, recentInquiries] = await Promise.all([getDashboardStats(), getInquiries()]);
  const recent = recentInquiries.slice(0, 5);

  const cards = [
    { label: "PROJECTS", value: stats.totalProjects, hint: `${stats.publishedProjects} published` },
    { label: "INQUIRIES", value: stats.totalInquiries, hint: `${stats.newInquiries} new` },
    {
      label: "LATEST INQUIRY",
      value: stats.latestInquiryAt ? formatDistanceToNow(stats.latestInquiryAt, { addSuffix: true }) : "—",
      hint: stats.latestInquiryAt ? "received" : "none yet",
    },
    { label: "OWNER", value: "1", hint: "account" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <p className="label-mono text-muted-foreground mb-2">OVERVIEW</p>
      <h1 className="font-body text-3xl md:text-4xl font-light tracking-tight text-foreground mb-10">
        Studio dashboard
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {cards.map((c) => (
          <div key={c.label} className="border border-border bg-card p-5 flex flex-col gap-3">
            <p className="label-mono text-muted-foreground">{c.label}</p>
            <p className="font-body text-3xl font-light text-foreground">{c.value}</p>
            <p className="font-body text-xs text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </div>

      <section aria-label="Recent inquiries">
        <div className="flex items-center justify-between mb-4">
          <h2 className="label-mono text-muted-foreground">RECENT INQUIRIES</h2>
          <Link
            href="/dashboard/inquiries"
            className="label-mono text-foreground hover:text-cobalt transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            VIEW ALL →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="border border-dashed border-border p-8 font-body text-sm text-muted-foreground text-center">
            No inquiries yet — submissions from the contact form will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {recent.map((inquiry) => {
              const meta = STATUS_META[inquiry.status as keyof typeof STATUS_META] ?? STATUS_META.NEW;
              return (
                <li key={inquiry.id} className="py-4 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-12 md:col-span-5 flex flex-col gap-1 min-w-0">
                    <p className="font-body text-sm text-foreground truncate">{inquiry.name}</p>
                    <p className="font-body text-xs text-muted-foreground truncate">{inquiry.email}</p>
                  </div>
                  <p className="col-span-6 md:col-span-3 label-mono text-muted-foreground truncate">
                    {inquiry.projectType.toUpperCase()}
                  </p>
                  <p className="hidden md:block md:col-span-2 font-body text-xs text-muted-foreground">
                    {formatDistanceToNow(inquiry.createdAt, { addSuffix: true })}
                  </p>
                  <div className="col-span-6 md:col-span-2 flex justify-end">
                    <span className={`label-mono px-2 py-1 border ${statusStyle(inquiry.status)}`}>{meta.label}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

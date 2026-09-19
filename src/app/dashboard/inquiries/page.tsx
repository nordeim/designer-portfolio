import type { Metadata } from "next";
import { getInquiries } from "@/lib/data";
import { InquiriesManager } from "@/components/dashboard/inquiries-manager";

export const metadata: Metadata = {
  title: "Inquiries",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardInquiriesPage() {
  const inquiries = await getInquiries();
  return <InquiriesManager inquiries={inquiries} />;
}

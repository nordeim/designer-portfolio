"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProjectAction, toggleProjectPublishedAction } from "@/actions/dashboard";
import { Button } from "@/components/ui/button";

/**
 * Row-level actions for the projects table: publish toggle and delete with a
 * confirm step. Both go through the authorized server actions.
 */
export function ProjectRowActions({
  id,
  title,
  published,
}: {
  id: string;
  title: string;
  published: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function toggle() {
    startTransition(async () => {
      const result = await toggleProjectPublishedAction(id);
      if (result.ok) {
        toast.success(result.data.published ? "Project published." : "Project unpublished.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteProjectAction(id);
      if (result.ok) {
        toast.success(`Deleted “${title}”.`);
        setConfirming(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <Button variant="outline" size="sm" onClick={toggle} disabled={pending} className="font-body text-xs h-8">
        {published ? "Unpublish" : "Publish"}
      </Button>
      {confirming ? (
        <>
          <Button variant="destructive" size="sm" onClick={remove} disabled={pending} className="font-body text-xs h-8">
            Confirm delete
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={pending} className="font-body text-xs h-8">
            Cancel
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(true)}
          disabled={pending}
          className="font-body text-xs h-8 text-destructive hover:text-destructive"
        >
          Delete
        </Button>
      )}
    </div>
  );
}

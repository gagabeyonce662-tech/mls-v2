"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createEstateProperty,
  fetchEstatePropertySchema,
  type EstatePropertyRecord,
} from "@/lib/api/admin";
import EstatePropertyForm from "@/components/admin/EstatePropertyForm";
import { useToast } from "@/hooks/use-toast";

type Column = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
};

export default function NewEstatePropertyPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchEstatePropertySchema()
      .then((s) => setColumns(s.columns || []))
      .catch(() =>
        toast({
          title: "Error",
          description: "Failed to load estate schema.",
          variant: "destructive",
        }),
      );
  }, [toast]);

  const onSubmit = async (
    payload: EstatePropertyRecord,
    options?: { stayOnPage?: boolean; isDraft?: boolean },
  ) => {
    try {
      const created = await createEstateProperty(payload);
      if (options?.stayOnPage) {
        toast({ title: "Draft Saved", description: "Draft saved successfully." });
        if (created?.id) {
          router.replace(`/admin/estate-properties/${created.id}`);
        }
        router.refresh();
        return;
      }
      toast({ title: "Created", description: "Estate property created." });
      router.push("/admin/estate-properties");
    } catch (e: any) {
      toast({
        title: "Create failed",
        description: e?.message || "Unable to create estate property.",
        variant: "destructive",
      });
    }
  };

  if (!columns.length) return <div className="text-sm text-gray-500">Loading schema...</div>;

  return (
    <EstatePropertyForm
      columns={columns}
      onSubmit={onSubmit}
      submitLabel="Publish Estate Property"
      initialValues={{
        standard_status: "Active",
        is_featured: false,
        custom_tags: "",
      }}
    />
  );
}

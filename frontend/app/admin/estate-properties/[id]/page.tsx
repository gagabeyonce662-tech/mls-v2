// frontend/app/admin/estate-properties/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchEstatePropertyById,
  fetchEstatePropertySchema,
  updateEstateProperty,
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

export default function EditEstatePropertyPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { toast } = useToast();

  const [columns, setColumns] = useState<Column[]>([]);
  const [initialValues, setInitialValues] = useState<EstatePropertyRecord>({});

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchEstatePropertySchema(), fetchEstatePropertyById(id)])
      .then(([schema, row]) => {
        setColumns(schema.columns || []);
        setInitialValues(row || {});
      })
      .catch(() =>
        toast({
          title: "Error",
          description: "Failed to load estate property.",
          variant: "destructive",
        }),
      );
  }, [id, toast]);

  const onSubmit = async (payload: EstatePropertyRecord) => {
    try {
      await updateEstateProperty(id, payload);
      toast({ title: "Updated", description: "Estate property updated." });
      router.push("/admin/estate-properties");
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message || "Unable to update estate property.",
        variant: "destructive",
      });
    }
  };

  if (!columns.length) return <div className="text-sm text-gray-500">Loading...</div>;

  return (
    <EstatePropertyForm
      columns={columns}
      initialValues={initialValues}
      onSubmit={onSubmit}
      submitLabel="Update Estate Property"
    />
  );
}

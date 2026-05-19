import type { EstatePropertyRecord } from "@/lib/api/admin";
import type {
  ListingActionButton,
  PropertyCustomDetailBlock,
} from "@/lib/propertyUtils";

export type Column = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
};

export interface EstatePropertyFormProps {
  columns: Column[];
  initialValues?: EstatePropertyRecord;
  onSubmit: (
    payload: EstatePropertyRecord,
    options?: { stayOnPage?: boolean; isDraft?: boolean },
  ) => Promise<void>;
  submitLabel: string;
}

export type DescriptionSection = {
  id: string;
  title: string;
  body_html: string;
  order: number;
};

export type EditableDetailBlock = PropertyCustomDetailBlock;
export type EditableListingButton = ListingActionButton;

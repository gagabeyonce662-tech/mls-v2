"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { uploadPreConnProperties } from "@/lib/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Home,
  MapPin,
  DollarSign,
  Info,
} from "lucide-react";
import { colors } from "@/config/design-system";
import { env } from "@/lib/env";

const formSchema = z.object({
  listing_id: z.string().min(1, "Listing ID is required"),
  list_price: z.string().optional(),
  city: z.string().optional(),
  state_or_province: z.string().default("ON"),
  unparsed_address: z.string().optional(),
  bedrooms_total: z.string().optional(),
  bathrooms_total_integer: z.string().optional(),
  category_type: z.enum(["exclusive", "pre_conn"]).default("pre_conn"),
  public_remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ManualPropertyForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const [mediaUrls, setMediaUrls] = useState<string[]>([""]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      listing_id: "",
      list_price: "",
      city: "",
      state_or_province: "ON",
      unparsed_address: "",
      bedrooms_total: "",
      bathrooms_total_integer: "",
      category_type: "pre_conn",
      public_remarks: "",
    },
  });

  const addMediaField = () => setMediaUrls([...mediaUrls, ""]);
  const removeMediaField = (index: number) => {
    const newUrls = [...mediaUrls];
    newUrls.splice(index, 1);
    setMediaUrls(newUrls);
  };

  const handleMediaChange = (index: number, value: string) => {
    const newUrls = [...mediaUrls];
    newUrls[index] = value;
    setMediaUrls(newUrls);
  };

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      // Create a CSV string from the form values
      // Currently the backend only processes 'listing_id', but we send everything
      // to support future backend updates without frontend changes.
      const headers = Object.keys(values).join(",");
      const row = Object.values(values)
        .map((val) => `"${String(val || "").replace(/"/g, '""')}"`)
        .join(",");

      const csvContent = `${headers}\n${row}`;
      const file = new File([csvContent], "manual_entry.csv", {
        type: "text/csv",
      });

      const resp = await uploadPreConnProperties(file, {
        authToken: env.NEXT_PUBLIC_API_TOKEN ?? null,
        useGet: false,
      });

      console.info("Manual upload response:", resp);

      if (resp.updated_count > 0) {
        setStatus({
          type: "success",
          message: `Successfully updated listing ${values.listing_id} to Pre-Construction.`,
        });
        toast.success(`Property updated successfully!`);
        form.reset();
        setMediaUrls([""]);
      } else {
        setStatus({
          type: "warning",
          message: `Request sent, but listing ID "${values.listing_id}" was not found in the database. Use this form only for properties that already exist on REALTOR.ca.`,
        });
        toast.warning("Property ID not found in database.");
      }
    } catch (error: any) {
      console.error(error);
      setStatus({
        type: "error",
        message:
          error.message || "An error occurred while processing your request.",
      });
      toast.error(error.message || "Failed to process manual entry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border overflow-hidden transition-all hover:shadow-2xl">
      <div className="p-6 border-b bg-gray-50/50">
        <h2
          className="text-xl font-bold flex items-center gap-2"
          style={{ color: colors.heading }}
        >
          <Home className="w-5 h-5 text-purple-600" />
          Manual Property Entry
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Create a new property listing manually.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
          {status && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                status.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : status.type === "warning"
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <div className="mt-0.5">
                {status.type === "success" ? (
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.585 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-amber-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <p className="text-sm font-medium">{status.message}</p>
              <button
                type="button"
                onClick={() => setStatus(null)}
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Listing ID */}
            <FormField
              control={form.control}
              name="listing_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                    Listing ID
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. X1234567"
                      {...field}
                      className="transition-all focus:ring-purple-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price */}
            <FormField
              control={form.control}
              name="list_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    List Price ($)
                  </FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="unparsed_address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    Full Address
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, Toronto, ON" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Toronto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pre_conn">Pre-Construction</SelectItem>
                      <SelectItem value="exclusive">Exclusive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Beds & Baths */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bedrooms_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bathrooms_total_integer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Remarks */}
          <FormField
            control={form.control}
            name="public_remarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks / Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter property details..."
                    className="h-32 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Media Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel className="text-base">Photo URLs</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMediaField}
                className="h-8 gap-1 text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                <Plus className="w-4 h-4" />
                Add Photo
              </Button>
            </div>
            <div className="space-y-3">
              {mediaUrls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Image URL ${index + 1}`}
                    value={url}
                    onChange={(e) => handleMediaChange(index, e.target.value)}
                    className="flex-1"
                  />
                  {mediaUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMediaField(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                setMediaUrls([""]);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Property"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

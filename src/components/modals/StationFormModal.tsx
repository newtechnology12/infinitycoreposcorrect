import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import Loader from "../icons/Loader";
import { useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import AppFormSelect from "../forms/AppFormSelect";
import { useAuth } from "@/context/auth.context";
import AppFormField from "../forms/AppFormField";
import { Checkbox } from "../ui/checkbox";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is a required field" }),
  category: z.string().min(1, { message: "Category is a required field" }),
  location: z.string(),
  stock: z.string(),
  type: z.string().min(1, { message: "Type is a required field" }),
  auto_complete_tickets: z.boolean().optional(),
  users: z.array(z.string()).optional(),
});

const getDefaultValues = (data?: any) => {
  return {
    name: data?.name || "",
    category: data?.category || "",
    location: data?.location || "",
    stock: data?.stock || "",
    type: data?.type || "",
    auto_complete_tickets: data?.auto_complete_tickets || false,
    users: data?.users || [],
  };
};

export function StationFormModal({ open, setOpen, record, onComplete }: any) {
  const values = useMemo(() => getDefaultValues(record), [record]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [record]);

  const { user } = useAuth();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
    };

    const q = !record
      ? pocketbase
          .collection("order_stations")
          .create({ ...data, created_by: user.id })
      : pocketbase.collection("order_stations").update(record.id, data);

    return q
      .then(async (e) => {
        onComplete();
        toast.error(
          q ? "Station updated succesfully" : "Station created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function stockLoader({ search }) {
    return pocketbase
      .collection("stocks")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  function usersLoader({ search }) {
    return pocketbase
      .collection("users")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              {record ? "Update" : "Create a new"} station.
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {record ? "Update" : "Create a new"}station.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-2">
                <AppFormField
                  form={form}
                  label={"Enter Name"}
                  name={"name"}
                  placeholder={"Enter name"}
                />
                <AppFormField
                  form={form}
                  label={"Enter category"}
                  name={"category"}
                  placeholder={"Enter category"}
                />
              </div>
              <div>
                <AppFormField
                  form={form}
                  label={"Enter location"}
                  name={"location"}
                  placeholder={"Enter location"}
                />
              </div>
              <div className="grid gap-2 grid-cols-2">
                <AppFormAsyncSelect
                  form={form}
                  label={"Choose stock"}
                  name={"stock"}
                  placeholder={"Choose stock"}
                  loader={stockLoader}
                />
                <AppFormSelect
                  form={form}
                  label={"Choose type"}
                  name={"type"}
                  placeholder={"Choose type"}
                  options={[
                    { label: "Counter", value: "counter" },
                    { label: "Kitchen", value: "kitchen" },
                  ]}
                />
              </div>
              <div>
                <AppFormAsyncSelect
                  form={form}
                  label={"Choose users"}
                  name={"users"}
                  isMulti
                  placeholder={"Choose users"}
                  loader={usersLoader}
                />
              </div>
              <div>
                <div className="flex mt-2 items-center space-x-2">
                  <Checkbox
                    onCheckedChange={(e: boolean) => {
                      form.setValue("auto_complete_tickets", e);
                    }}
                    checked={form.watch("auto_complete_tickets")}
                    id="track_inventory"
                  />

                  <label
                    htmlFor="track_inventory"
                    className="text-sm text-slate-500 font-medium- leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Auto complete tickets for this station.
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <div className="mt-6 flex items-center gap-2 px-2 pb-1">
                <Button
                  type="button"
                  onClick={() => form.reset()}
                  className="w-full text-slate-600"
                  size="sm"
                  variant="outline"
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  onClick={() => form.handleSubmit(onSubmit)}
                  disabled={
                    form.formState.disabled || form.formState.isSubmitting
                  }
                  className="w-full"
                  size="sm"
                >
                  {form.formState.isSubmitting && (
                    <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                  )}
                  {record ? "Update station." : " Create new station"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

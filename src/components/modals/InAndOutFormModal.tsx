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
import AppFormField from "../forms/AppFormField";
import { useForm } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import { useAuth } from "@/context/auth.context";
import AppFormSelect from "../forms/AppFormSelect";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";

const formSchema = z.object({
  item: z.string().min(1, { message: "Item is a required field" }),
  type: z.string().min(1, { message: "Type is a required field" }),
  quantity: z.string().min(1, { message: "Quantity is a required field" }),
  source: z.string().min(1, { message: "Source is a required field" }),
  destination: z
    .string()
    .min(1, { message: "Destination is a required field" }),
  reason: z.string().min(1, { message: "Reason is a required field" }),
  responsible_person: z.string().min(1, {
    message: "Responsible person is a required field",
  }),
  total: z.string().min(1, { message: "Total is a required field" }),
});

const getDefaultValues = (data?: any) => {
  return {
    quantity: data?.quantity || "",
    source: data?.source || "",
    destination: data?.destination || "",
    reason: data?.reason || "",
    responsible_person: data?.responsible_person || "",
    item: data?.item || "",
    type: data?.type || "",
    total: data?.total || "",
  };
};

export function InAndOutFormModal({ open, setOpen, record, onComplete }: any) {
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
      created_by: user?.id,
    };

    const q = !record
      ? pocketbase.collection("in_and_out").create(data)
      : pocketbase.collection("in_and_out").update(record.id, data);

    return q
      .then(() => {
        onComplete();
        toast.error(
          q ? "in out updated succesfully" : "in out created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              {record ? "Update" : "Create a new"} in and out..
            </span>
          </DialogTitle>
          <DialogDescription>
            <span
              onClick={() => {
                console.log(form.formState.errors);
              }}
              className="px-2 py-0 text-sm text-slate-500 leading-7"
            >
              Fill in the fields to {record ? "Update" : "Create a new"}
              in and out.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-2">
                <AppFormField
                  form={form}
                  label={"Item name"}
                  placeholder={"Enter item name"}
                  name={"item"}
                  // loader={async ({ search }) => {
                  //   return pocketbase
                  //     .collection("raw_items")
                  //     .getFullList({
                  //       filter: search ? `name~"${search}"` : "",
                  //     })
                  //     .then((e) =>
                  //       e.map((e) => ({
                  //         label: e.names || e.name,
                  //         value: e.name,
                  //       }))
                  //     );
                  // }}
                />
                <AppFormField
                  form={form}
                  label={"Quantity"}
                  placeholder={"Choose Quantity"}
                  name={"quantity"}
                  type="number"
                />
              </div>
              <div className="grid gap-2 grid-cols-2">
                {" "}
                <AppFormField
                  form={form}
                  label={"Total Amount"}
                  placeholder={"Enter Amount"}
                  name={"total"}
                  type="number"
                />
                <AppFormField
                  form={form}
                  label={"Source"}
                  placeholder={"Enter source"}
                  name={"source"}
                />
              </div>
              <div className="grid gap-2 grid-cols-2">
                <AppFormAsyncSelect
                  form={form}
                  label={"Destination"}
                  placeholder={"Enter destination"}
                  name={"destination"}
                  loader={async ({ search }) => {
                    return pocketbase
                      .collection("departments")
                      .getFullList({
                        filter: search ? `name~"${search}"` : "",
                      })
                      .then((e) =>
                        e.map((e) => ({
                          label: e.names || e.name,
                          value: e.name,
                        }))
                      );
                  }}
                />
                <AppFormField
                  form={form}
                  label={"Responsible person"}
                  placeholder={"Enter Responsible person"}
                  name={"responsible_person"}
                />
              </div>
              <div className="grid grid-cols-2  gap-2">
                <AppFormSelect
                  form={form}
                  label={"Reason"}
                  placeholder={"Reason"}
                  name={"reason"}
                  options={[
                    { label: "Purchase", value: "purchase" },
                    { label: "Sale", value: "Sale" },
                    { label: "Damaged", value: "damaged" },
                  ]}
                />
                <AppFormSelect
                  form={form}
                  label={"Type"}
                  placeholder={"Type"}
                  name={"type"}
                  options={[
                    { label: "in", value: "in" },
                    { label: "out", value: "out" },
                  ]}
                />
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
                  {record ? "Update in and out." : " Create new in and out."}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

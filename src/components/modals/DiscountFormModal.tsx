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
import { useAuth } from "@/context/auth.context";
import AppFormField from "../forms/AppFormField";
import AppFormTextArea from "../forms/AppFormTextArea";
import AppFormSelect from "../forms/AppFormSelect";
import AppFormDatePicker from "../forms/AppFormDatepicker";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is a required field" }),
  status: z.string().min(1, { message: "Status is a required field" }),
  value: z.string().min(1, { message: "Value is a required field" }),
  type: z.string().min(1, { message: "Type is a required field" }),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  notes: z.string().min(1, { message: "Notes is a required field" }),
  target_audience: z
    .string()
    .min(1, { message: "Target audience is a required field" }),
  customers: z.array(z.string()).optional(),
});

const getDefaultValues = (data?: any) => {
  return {
    name: data?.name || "",
    status: data?.status || "",
    value: data?.value?.toLocaleString() || "",
    type: data?.type || "",
    start_date: data?.start_date ? new Date(data?.start_date) : undefined,
    end_date: data?.end_date ? new Date(data?.end_date) : undefined,
    notes: data?.notes || "",
    target_audience: data?.target_audience || "",
    customers: data?.customers || [],
  };
};

export function DiscountFormModal({ open, setOpen, record, onComplete }: any) {
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
          .collection("discounts")
          .create({ ...data, created_by: user.id })
      : pocketbase.collection("discounts").update(record.id, data);

    return q
      .then(async (e) => {
        onComplete();
        toast.error(
          q ? "Discount updated succesfully" : "Discount created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function customersLoader({ search }) {
    return pocketbase
      .collection("customers")
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
            <span
              onClick={() => {
                console.log(form.formState.errors);
              }}
              className="text-base px-2 font-semibold py-2"
            >
              {record ? "Update" : "Create a new"} discount.
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {record ? "Update" : "Create a new"}{" "}
              discount.
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
                <AppFormSelect
                  form={form}
                  label={"Enter status"}
                  name={"status"}
                  placeholder={"Enter status"}
                  options={[
                    { label: "Active", value: "active" },
                    { label: "Inactive", value: "inactive" },
                  ]}
                />
              </div>
              <div className="grid gap-2 grid-cols-2">
                <AppFormField
                  form={form}
                  label={"Enter value"}
                  name={"value"}
                  type="number"
                  placeholder={"Enter value"}
                />
                <AppFormSelect
                  form={form}
                  label={"Enter type"}
                  name={"type"}
                  placeholder={"Enter type"}
                  options={[
                    { label: "Percentage", value: "percentage" },
                    { label: "Fixed", value: "fixed" },
                  ]}
                />
              </div>{" "}
              <div className="grid gap-2 grid-cols-2">
                <AppFormDatePicker
                  form={form}
                  label={"Choose start date"}
                  name={"start_date"}
                  placeholder={"Choose start date"}
                />
                <AppFormDatePicker
                  form={form}
                  label={"Choose end date"}
                  name={"end_date"}
                  placeholder={"Choose end date"}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <AppFormSelect
                  form={form}
                  label={"Choose target audience"}
                  name={"target_audience"}
                  placeholder={"Choose target audience"}
                  options={[
                    { label: "All customers", value: "all customers" },
                    {
                      label: "Selected Customers",
                      value: "selected customers",
                    },
                  ]}
                />
                {form.watch("target_audience") === "selected customers" && (
                  <AppFormAsyncSelect
                    form={form}
                    label={"Choose customers"}
                    name={"customers"}
                    isMulti
                    placeholder={"Choose customers"}
                    loader={customersLoader}
                  />
                )}
              </div>
              <div>
                <AppFormTextArea
                  form={form}
                  label={"Enter notes"}
                  name={"notes"}
                  placeholder={"Enter notes"}
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
                  {record ? "Update discount." : " Create new discount"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

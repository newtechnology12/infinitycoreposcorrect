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
import AppFormSelect from "../forms/AppFormSelect";

const formSchema = z.object({
  names: z.string().min(1, { message: "Names is a required field" }),
  phone: z.string().min(1, { message: "Phone is a required field" }),
  status: z.string().min(1, { message: "status is a required field" }),
  email: z.string(),
  address: z.string().min(1, { message: "Address a required field" }),
  category: z.string().min(1, { message: "Address a required field" }),
});

const getDefaultValues = (data?: any) => {
  return {
    names: data?.names || "",
    phone: data?.phone || "",
    email: data?.email || "",
    address: data?.address || "",
    status: data?.status || "",
    category: data?.category || "",
  };
};

export function SupplierFormModal({ open, setOpen, record, onComplete }: any) {
  const values = useMemo(() => getDefaultValues(record), [record]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [record]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
    };

    const q = !record
      ? pocketbase.collection("suppliers").create(data)
      : pocketbase.collection("suppliers").update(record.id, data);

    return q
      .then(() => {
        onComplete();
        toast.error(
          q ? "supplier updated succesfully" : "supplier created succesfully"
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
              {record ? "Update" : "Create a new"}supplier
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {record ? "Update" : "Create a new"}
              suppliers.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-2">
                <AppFormField
                  form={form}
                  label={"Supplier names"}
                  placeholder={"Enter supplier names"}
                  name={"names"}
                />
                <AppFormField
                  form={form}
                  label={"Supplier email(optional)"}
                  placeholder={"Enter supplier email"}
                  name={"email"}
                />
              </div>
              <div className="grid gap-2 grid-cols-1">
                <AppFormField
                  form={form}
                  label={"Supplier address"}
                  placeholder={"Enter supplier address"}
                  name={"address"}
                />
              </div>
              <div className="grid gap-2 grid-cols-2">
                <AppFormField
                  form={form}
                  label={"Supplier phone"}
                  placeholder={"Enter supplier phone"}
                  name={"phone"}
                />
                <AppFormSelect
                  form={form}
                  label={"Supplier status"}
                  placeholder={"Enter supplier status"}
                  name={"status"}
                  options={[
                    { label: "active", value: "active" },
                    { label: "inactive", value: "inactive" },
                  ]}
                />
              </div>
              <div>
                <AppFormField
                  form={form}
                  label={"Supplier category"}
                  placeholder={"Enter category"}
                  name={"category"}
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
                  {record ? "Update supplier." : " Create new supplier"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

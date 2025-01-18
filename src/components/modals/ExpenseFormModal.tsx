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
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import AppFileUpload from "../forms/AppFileUpload";

const formSchema = z.object({
  name: z.string().min(1, { message: "Name is a required field" }),
  category: z.string().min(1, { message: "Category is a required field" }),
  amount: z.string().min(1, { message: "Amount is a required field" }),
  notes: z.string(),
  attachment: z.any().optional(),
  date: z.string(),
  payment_method: z
    .string()
    .min(1, { message: "Payment method a required field" }),
});

const getDefaultValues = (data?: any) => {
  return {
    name: data?.name || "",
    date: data?.date ? new Date(data?.date)?.toISOString().slice(0, 10) : "",
    category: data?.category || "",
    amount: data?.amount?.toString() || "",
    notes: data?.notes || "",
    attachment: data?.attachment || "",
    payment_method: data?.payment_method || "",
  };
};

export function ExpenseFormModal({ open, setOpen, record, onComplete }: any) {
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
          .collection("expenses")
          .create({ ...data, created_by: user.id })
      : pocketbase.collection("expenses").update(record.id, data);

    return q
      .then(async () => {
        onComplete();
        toast.error(
          q ? "Expense updated succesfully" : "Expense created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function categoriesLoader({ search }) {
    return pocketbase
      .collection("expense_categories")
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
              {record ? "Update" : "Create a new"} expense.
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {record ? "Update" : "Create a new"}{" "}
              expense.
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
                <AppFormAsyncSelect
                  form={form}
                  label={"Choose category"}
                  name={"category"}
                  placeholder={"Choose category"}
                  loader={categoriesLoader}
                />
              </div>
              <div className="grid gap-2 grid-cols-2">
                <AppFormField
                  form={form}
                  label={"Enter amount"}
                  name={"amount"}
                  placeholder={"Enter amount"}
                />
                <AppFormAsyncSelect
                  form={form}
                  name={"payment_method"}
                  label={"Choose payment method"}
                  placeholder={"Choose method"}
                  loader={({ search }) => {
                    return pocketbase
                      .collection("payment_methods")
                      .getFullList({
                        filter: search ? `name~"${search}"` : "",
                      })
                      .then((e) =>
                        e.map((e) => ({
                          label: e.name,
                          value: e.id,
                          original: e,
                        }))
                      );
                  }}
                />
              </div>
              <div className="grid gap-2 grid-cols-1">
                <AppFormField
                  form={form}
                  label={"Choose date"}
                  name={"date"}
                  placeholder={"Choose date"}
                  type="date"
                />
              </div>
              <div>
                <AppFormTextArea
                  form={form}
                  label={"Enter notes"}
                  name={"notes"}
                  placeholder={"Enter notes"}
                />
              </div>
              <AppFileUpload
                form={form}
                label={"Upload an attachment"}
                name={"attachment"}
                preview={pocketbase.files.getUrl(record, record?.attachment)}
              />
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
                  {record ? "Update expense." : " Create new expense"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

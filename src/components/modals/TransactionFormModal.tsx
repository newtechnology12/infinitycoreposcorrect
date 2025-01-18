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
import { useForm, useWatch } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import AppFormSelect from "../forms/AppFormSelect";
import AppFormDatePicker from "../forms/AppFormDatepicker";
import AppFormTextArea from "../forms/AppFormTextArea";
import { useAuth } from "@/context/auth.context";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";

const formSchema = z.object({
  date: z.date(),
  bill_to: z.string().min(1, { message: "Bill to is a required field" }),
  bill_to_record: z.any(),
  type: z.string().min(1, { message: "Type is a required field" }),
  notes: z.string(),
  amount: z.string().min(1, { message: "Amount a required field" }),
  payment_method: z
    .string()
    .min(1, { message: "Payment method a required field" }),
});

const getDefaultValues = (data?: any) => {
  return {
    date: data?.date ? new Date(data?.date) : new Date(),
    bill_to: data?.bill_to || "",
    bill_to_record: data?.customer || data?.supplier || data?.staff || "",
    type: data?.type || "",
    notes: data?.notes || "",
    amount: data?.amount?.toString() || "",
    payment_method: data?.payment_method || "",
  };
};

export function TransactionFormModal({
  open,
  setOpen,
  record,
  onComplete,
}: any) {
  const values = useMemo(() => getDefaultValues(record), [record]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [record]);

  const { user } = useAuth();

  async function onSubmit({
    bill_to_record,
    ...values
  }: z.infer<typeof formSchema>) {
    const data = {
      ...values,
      customer: "",
      supplier: "",
      staff: "",
      [values.bill_to]: bill_to_record,
    };

    const q = !record
      ? pocketbase
          .collection("transactions")
          .create({ ...data, created_by: user?.id })
      : pocketbase.collection("transactions").update(record.id, data);

    return q
      .then((e) => {
        onComplete(e);
        toast.error(
          q
            ? "transactions updated succesfully"
            : "transactions created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  const bill_to = useWatch({
    control: form.control,
    name: "bill_to",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              {record ? "Update" : "Create a new"}transaction
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {record ? "Update" : "Create a new"}
              transaction.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-2">
                <AppFormDatePicker
                  form={form}
                  label={"Transaction date"}
                  placeholder={"Enter date"}
                  name={"date"}
                />
                <AppFormSelect
                  form={form}
                  name={"bill_to"}
                  label={"Choose bill to"}
                  placeholder={"Choose bill to type"}
                  disabled={bill_to === "pos"}
                  options={[
                    { label: "Customer", value: "customer" },
                    { label: "Supplier", value: "supplier" },
                    { label: "Staff", value: "staff" },
                    { label: "pos", value: "pos" },
                  ]}
                />
              </div>

              <div className="grid gap-2 grid-cols-1">
                <AppFormAsyncSelect
                  form={form}
                  isDisabled={!bill_to || bill_to === "pos"}
                  name={"bill_to_record" + bill_to}
                  label={"Choose bill customer,supplier or staff"}
                  placeholder={"Choose bill to"}
                  defaultOptions={[
                    {
                      label: record?.expand[record.bill_to]?.names,
                      value: record?.expand[record.bill_to]?.id,
                    },
                  ]}
                  loader={({ search }) => {
                    return pocketbase
                      .collection(
                        {
                          customer: "customers",
                          supplier: "suppliers",
                          staff: "users",
                        }[bill_to]
                      )
                      .getFullList({
                        filter: search
                          ? `name~"${search}" || names~"${search}"`
                          : "",
                      })
                      .then((e) =>
                        e.map((e) => ({
                          label: e.name || e.names,
                          value: e.id,
                          original: e,
                        }))
                      );
                  }}
                />
              </div>
              <div className="grid gap-2 grid-cols-3">
                <AppFormSelect
                  form={form}
                  name={"type"}
                  label={"Choose type"}
                  disabled={bill_to === "pos"}
                  placeholder={"Choose transaction type"}
                  options={[
                    { label: "Income", value: "income" },
                    { label: "Expense", value: "expense" },
                  ]}
                />
                <AppFormField
                  form={form}
                  label={"Transaction amount"}
                  placeholder={"Enter amount"}
                  name={"amount"}
                  type="number"
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
                <AppFormTextArea
                  form={form}
                  label={"Payment notes"}
                  placeholder={"Enter notes"}
                  name={"notes"}
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
                  onClick={() => {
                    form.handleSubmit(onSubmit);
                    console.log(form.formState.errors);
                  }}
                  disabled={
                    form.formState.disabled || form.formState.isSubmitting
                  }
                  className="w-full"
                  size="sm"
                >
                  {form.formState.isSubmitting && (
                    <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                  )}
                  {record ? "Update transaction." : " Create new transaction"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

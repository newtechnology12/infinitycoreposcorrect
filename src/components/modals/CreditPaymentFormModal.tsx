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
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import AppFormDatePicker from "../forms/AppFormDatepicker";
import AppFormTextArea from "../forms/AppFormTextArea";
import { useAuth } from "@/context/auth.context";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import { Alert, AlertTitle } from "../ui/alert";
import { AlertCircleIcon } from "lucide-react";

const formSchema = z.object({
  date: z.date(),
  notes: z.string(),
  amount: z.string().min(1, { message: "Amount a required field" }),
  payment_method: z
    .string()
    .min(1, { message: "Payment method a required field" }),
});

const getDefaultValues = (data?: any) => {
  return {
    date: data?.date ? new Date(data?.date) : new Date(),
    notes: data?.notes || "",
    amount: data?.amount?.toString() || "",
    payment_method: data?.payment_method || "",
  };
};

export function CreditPaymentFormModal({
  open,
  setOpen,
  record,
  credit,
  onComplete,
}: any) {
  const balance = useMemo(() => {
    // check if the amount is not greater than the balance which will be equal to the total payments minus the total amount
    const totalPayments = (credit?.expand?.transactions || [])?.reduce(
      (acc: any, e: any) => acc + e.amount,
      0
    );

    const totalAmount = credit?.amount;
    const balance = totalAmount - totalPayments;

    return balance;
  }, [credit]);

  const values = useMemo(
    () => getDefaultValues({ ...record, amount: balance }),
    [record, balance]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [record]);

  const { user } = useAuth();

  const [error, setError] = useState(undefined);

  async function onSubmit({ ...values }: z.infer<typeof formSchema>) {
    setError(undefined);
    const data = {
      ...values,
    };

    console.log(credit);

    if (Number(values.amount || 0) && Number(values.amount || 0) > balance) {
      setError(`Amount cannot be greater than the balance of ${balance}`);
      return;
    }

    const isFullyPaid = balance - Number(values.amount || 0) === 0;

    const q = !record
      ? pocketbase.collection("transactions").create({
          ...data,
          created_by: user?.id,
          customer: credit?.customer,
          staff: credit?.employee,
          bill_to: "credit",
          type: "income",
          status: "approved",
          credit: credit.id,
        })
      : pocketbase.collection("transactions").update(record.id, data);

    const transaction = await q;

    // check if transaction was created then update the credit
    if (transaction) {
      const creditData = {
        "transactions+": transaction.id,
        status: isFullyPaid ? "paid" : "partially_paid",
      };

      await pocketbase.collection("credits").update(credit.id, creditData);
    }

    onComplete();
    toast.success(
      q
        ? "transactions updated succesfully"
        : "transactions created succesfully"
    );
  }

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
          {error && (
            <div className="px-1">
              <Alert
                variant="destructive"
                className="py-2 mt-2- rounded-[4px] flex items-center"
              >
                <AlertCircleIcon className="h-4 -mt-[5px] mr-3 w-4" />
                <AlertTitle className="text-[13px] font-medium fon !m-0">
                  {error}
                </AlertTitle>
              </Alert>
            </div>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-2-">
                <AppFormDatePicker
                  form={form}
                  label={"Transaction date"}
                  placeholder={"Enter date"}
                  name={"date"}
                />
              </div>

              <div className="grid gap-2 grid-cols-2">
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

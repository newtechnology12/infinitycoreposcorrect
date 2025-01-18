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
import { useForm, useWatch } from "react-hook-form";
import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import AppFormField from "../forms/AppFormField";
import AppFormTextArea from "../forms/AppFormTextArea";
import { useAuth } from "@/context/auth.context";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import cleanObject from "@/utils/cleanObject";

const formSchema = z.object({
  amount: z.string().min(1, { message: "Amount is a required field" }),
  payment_method: z
    .string()
    .min(1, { message: "Payment method is a required field" }),
  notes: z.string(),
});

const getDefaultValues = (e) => {
  return {
    amount: e?.amount?.toString() || "",
    payment_method: e?.payment_method || "",
    notes: e?.notes || "",
  };
};

export function PurchasePaymentModal({
  open,
  setOpen,
  record,
  purchase,
  onComplete,
}: any) {
  const values: any = useMemo(
    () => getDefaultValues({ ...record, amount: purchase?.due_amount }),
    [record]
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: values,
  });

  useEffect(() => {
    form.reset();
  }, [record]);

  const { user } = useAuth();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
      bill_to: "supplier",
      supplier: record?.supplier,
      type: "expense",
      notes: values.notes || "",
      payment_method: values.payment_method || "",
      purchase: purchase?.id,
      created_by: user?.id,
      date: new Date(),
    };

    const q = pocketbase.collection("transactions").create(data);

    return q
      .then(async (e) => {
        // check if the payment is full or partial , if full then update the purchase status to paid else update to partial. if the purchase was partial and the amount recived plus the previous amount is equal or larger to the total amount then update the purchase status to paid.
        const amount = values.amount;

        const payment_status =
          Number(purchase?.due_amount) <= Number(amount) ? "paid" : "partial";
        const purchaseData = {
          payment_status: payment_status,
          total_paid: amount,
          "payments+": e.id,
        };
        return pocketbase
          .collection("purchases")
          .update(purchase.id, purchaseData)
          .then(() => {
            onComplete();
            toast.error(
              q ? "Stocks updated succesfully" : "Stocks created succesfully"
            );
            form.reset();
          })
          .catch((e) => console.log(e));
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  const amount = useWatch({
    control: form.control,
    name: "amount",
  });

  function paymentsMethodsLoader({ search }) {
    return pocketbase
      .collection("payment_methods")
      .getFullList(
        cleanObject({
          filter: search ? `name~"${search}"` : undefined,
        })
      )
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              {record ? "Update" : "Create a new"} Payment
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {record ? "Update" : "Create a new"}{" "}
              payment.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-2">
                <AppFormField
                  form={form}
                  label={"Receiving amount"}
                  placeholder={"Enter receiving amount"}
                  disabled={record?.payment_status === "paid"}
                  name={"amount"}
                  type="number"
                />
                <AppFormAsyncSelect
                  form={form}
                  label={"Payment method"}
                  placeholder={"Enter payment method"}
                  name={"payment_method"}
                  disabled={record?.payment_status === "paid"}
                  loader={paymentsMethodsLoader}
                />
              </div>
              <div>
                <AppFormTextArea
                  form={form}
                  label={"Notes"}
                  placeholder={"Enter notes"}
                  name={"notes"}
                  disabled={record?.payment_status === "paid"}
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
                    form.formState.disabled ||
                    form.formState.isSubmitting ||
                    !Number(amount)
                  }
                  className="w-full"
                  size="sm"
                >
                  {form.formState.isSubmitting && (
                    <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                  )}
                  {"Create new payment"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

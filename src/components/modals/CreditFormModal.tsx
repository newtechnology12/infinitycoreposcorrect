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
import AppFormTextArea from "../forms/AppFormTextArea";
import { useAuth } from "@/context/auth.context";
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import cleanObject from "@/utils/cleanObject";
import AppFormSelect from "../forms/AppFormSelect";

const formSchema = z.object({
  owner: z.string().min(1, { message: "Field Required" }),
  amount: z.string().min(1, { message: "Amount is required" }),
  description: z.string().optional(),
  reason: z.string().min(1, { message: "Reason is required" }),
  status: z.string(),
  monthly_deduction: z.string().optional(),
});

const getDefaultValues = (data?: any) => {
  return {
    owner: data?.expand?.customer?.id || data?.expand?.employee?.id || "",
    amount: data?.amount.toString() || "",
    description: data?.description || "",
    reason: data?.reason || "",
    status: data?.status || "",
    monthly_deduction: data?.monthly_deduction || "",
  };
};

export function CreditFormModal({
  open,
  setOpen,
  record,
  onComplete,
  type,
}: any) {
  const entity =
    type === "customers" ? "customer" : type === "employees" ? "employee" : "";

  const values = useMemo(() => getDefaultValues(record), [record]);

  const { user } = useAuth();

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
      employee: type === "employees" ? values.owner : undefined,
      customer: type === "customers" ? values.owner : undefined,
    };

    const q = !record
      ? pocketbase
          .collection("credits")
          .create({ ...data, created_by: user?.id, status: "pending" })
      : pocketbase.collection("credits").update(record.id, { ...data });

    return q
      .then(() => {
        onComplete();
        toast.error(
          q ? "credit updated succesfully" : "credit created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function loader({ search }) {
    return pocketbase
      .collection(type === "employees" ? "users" : "customers")
      .getFullList(
        cleanObject({
          filter: search
            ? `${entity === "customer" ? "names" : "name"}~"${search}"`
            : undefined,
        })
      )
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              <span className="text-base px-2 font-semibold py-2">
                {record ? "Update" : "Create"} a new credit
              </span>
            </DialogTitle>
            <DialogDescription>
              <span className="px-2 py-0 text-sm text-slate-500 leading-7">
                Fill in the fields to {record ? "Update" : "Create a new"}
                credit.
              </span>
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid px-2 gap-2">
                <div className="grid gap-2 grid-cols-2">
                  <AppFormAsyncSelect
                    form={form}
                    name={"owner"}
                    label={`Choose ${entity}`}
                    placeholder={`Choose ${entity}`}
                    loader={loader}
                  />
                  <AppFormField
                    form={form}
                    type="number"
                    label={"Amount"}
                    placeholder={"Enter amount"}
                    name={"amount"}
                  />
                </div>

                <div className="grid gap-2 grid-cols-2">
                  <AppFormSelect
                    form={form}
                    label={"Choose Reason"}
                    name={"reason"}
                    placeholder={"Choose reason"}
                    options={[
                      { label: "Salary advance", value: "salary_advance" },
                      { label: "Loan", value: "loan" },
                      { label: "Others", value: "others" },
                    ]}
                  />
                  <div>
                    <AppFormField
                      form={form}
                      label={"Monthly deduction amount"}
                      placeholder={"Enter monthly amount"}
                      name={"monthly_deduction"}
                      type="number"
                      disabled={form.watch("reason") !== "loan"}
                    />
                  </div>
                </div>

                {record && (
                  <div className="grid gap-2 grid-cols-1">
                    <AppFormSelect
                      form={form}
                      label={"Choose Status"}
                      name={"status"}
                      options={[
                        { label: "Suspended", value: "suspended" },
                        { label: "Pending", value: "pending" },
                      ]}
                    />
                  </div>
                )}

                <div>
                  <AppFormTextArea
                    form={form}
                    label={"Description"}
                    placeholder={"Enter description"}
                    name={"description"}
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
                    {record ? "Update credit." : " Create new credit"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

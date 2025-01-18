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
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import cleanObject from "@/utils/cleanObject";
import AppFormTextArea from "../forms/AppFormTextArea";
import AppFormSelect from "../forms/AppFormSelect";

const formSchema = z.object({
  customer: z.string().min(1, { message: "Field Required" }),
  table: z.string().min(1, { message: "Field Required" }),
  assigned_to: z.string().min(1, { message: "Field Required" }),
  guests: z.string().min(1, { message: "Field Required" }),
  status: z.string().min(1, { message: "Field Required" }),
  notes: z.string().optional(),
});

const getDefaultValues = (data?: any) => {
  return {
    customer: data?.expand?.customer?.id || "",
    table: data?.expand?.table?.id || "",
    assigned_to: data?.expand?.assigned_to?.id || "",
    guests: data?.guests.toString() || "",
    status: data?.status || "",
    notes: data?.notes || "",
  };
};

export function ReservationFormModal({
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const data = {
        ...values,
      };

      // check if status is confirmed then update the table status
      if (values.status === "confirmed") {
        const table = await pocketbase.collection("tables").getOne(data.table);
        if (table.status === "reserved" && data.table !== record?.table) {
          throw new Error("Table is already reserved");
        }
        await pocketbase
          .collection("tables")
          .update(data.table, { status: "reserved" });
      }

      const q = !record
        ? pocketbase
            .collection("reservations")
            .create({ ...data, created_by: user.id, reserved_at: new Date() })
        : pocketbase.collection("reservations").update(record.id, data);

      await q;
      onComplete();
      toast.error(
        q
          ? "Reservation updated succesfully"
          : "Reservation created succesfully"
      );
      form.reset();
    } catch (error) {
      toast.error(error.message);
    }
  }

  function customersLoader({ search }) {
    return pocketbase
      .collection("customers")
      .getFullList(
        cleanObject({
          filter: search ? `names~"${search}"` : undefined,
        })
      )
      .then((e) => e.map((e) => ({ label: e.names, value: e.id })));
  }
  function tablesLoader({ search }) {
    return pocketbase
      .collection("tables")
      .getFullList(
        cleanObject({
          filter: search ? `name~"${search}" || code~"${search}"` : undefined,
        })
      )
      .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
  }

  function waitersLoader({ search }) {
    const q = [search ? `name~"${search}"` : ""].filter((e) => e).join(" && ");
    console.log(q);
    return pocketbase
      .collection("users")
      .getFullList(
        cleanObject({
          filter: q,
        })
      )
      .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              Create a reservation.
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {record ? "Update" : "Create a new"}
              reservation.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-2">
                <AppFormAsyncSelect
                  form={form}
                  name={"customer"}
                  label={`Choose customer`}
                  placeholder={`Choose customer`}
                  loader={customersLoader}
                />
                <AppFormAsyncSelect
                  form={form}
                  name={"table"}
                  label={`Choose table`}
                  placeholder={`Choose table`}
                  loader={tablesLoader}
                />
              </div>
              <div className="grid gap-2 grid-cols-1">
                <AppFormAsyncSelect
                  form={form}
                  name={"assigned_to"}
                  label={`Choose Waiter`}
                  placeholder={`Choose Waiter`}
                  loader={waitersLoader}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <AppFormField
                  form={form}
                  type="number"
                  label={"Enter Guests"}
                  placeholder={"Enter Guests Count"}
                  name={"guests"}
                />
                <AppFormSelect
                  form={form}
                  label={"Choose Status"}
                  placeholder={"Choose Status"}
                  name={"status"}
                  options={[
                    { label: "Pending", value: "pending" },
                    { label: "Confirmed", value: "confirmed" },
                    { label: "Cancelled", value: "cancelled" },
                    { label: "Completed", value: "completed" },
                  ]}
                />
              </div>
              <div>
                <AppFormTextArea
                  form={form}
                  label={"Reservation Notes"}
                  placeholder={"Enter Reservation Notes"}
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
                  {record ? "Update reservation." : " Create new reservation"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

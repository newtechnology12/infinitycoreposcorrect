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
import { useParams } from "react-router-dom";

const formSchema = z.object({
  employee: z.string().min(1, "Employee is required"),
  gross_sales: z.string().min(1, "Gross sales is required"),
  closing_notes: z.string(),
  activity: z.string().min(1, "Activity is required"),
});

const getDefaultValues = (data?: any) => {
  return {
    employee: data?.employee || "",
    gross_sales: data?.custom_gross_amount.toString() || "",
    closing_notes: data?.closing_notes || "",
    activity: data?.activity || "",
  };
};

export function NewWorkShiftModal({ open, setOpen, record, onComplete }: any) {
  const values = useMemo(() => getDefaultValues(record), [record]);

  const { user } = useAuth();

  const workPeriodId = useParams().workPeriodId;

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
      ? pocketbase.collection("work_shifts").create({
          ...data,
          created_by: user?.id,
          work_period: workPeriodId,
          status: "open",
          started_at: new Date(),
          ended_at: new Date(),
          ended_by: user?.id,
          started_by: user?.id,
          custom_gross_amount: data.gross_sales,
        })
      : pocketbase.collection("work_shifts").update(record.id, {
          ...data,
          custom_gross_amount: data.gross_sales,
        });

    return q
      .then(() => {
        onComplete();
        toast.error(
          q
            ? "work shift updated succesfully"
            : "work shift created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function loader({ search }) {
    return pocketbase
      .collection("users")
      .getFullList(
        cleanObject({
          filter: search ? `name~"${search}"` : undefined,
        })
      )
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  function activitiesLoader({ search }) {
    return pocketbase
      .collection("activities")
      .getFullList(
        cleanObject({
          filter: search ? `name~"${search}"` : undefined,
        })
      )
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  return (
    <>
      {" "}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              <span className="text-base px-2 font-semibold py-2">
                {record ? "Update" : "Create"} a work shift.
              </span>
            </DialogTitle>
            <DialogDescription>
              <span className="px-2 py-0 text-sm text-slate-500 leading-7">
                Fill in the fields to {record ? "Update" : "Create a new"}work
                shift.
              </span>
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid px-2 gap-2">
                <div className="grid gap-2 grid-cols-2">
                  <AppFormAsyncSelect
                    form={form}
                    name={"employee"}
                    label={`Choose employee`}
                    placeholder={`Choose employee`}
                    loader={loader}
                  />
                  <AppFormField
                    form={form}
                    label={"Gross sales"}
                    placeholder={"Enter gross sales here..."}
                    name={"gross_sales"}
                    type={"number"}
                  />
                </div>
                <AppFormAsyncSelect
                  form={form}
                  name={"activity"}
                  label={`Choose activity`}
                  placeholder={`Choose activity`}
                  loader={activitiesLoader}
                />
                <div>
                  <AppFormTextArea
                    form={form}
                    label={"Closing notes"}
                    placeholder={"Enter closing notes here..."}
                    name={"closing_notes"}
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
                    {record ? "Update work shift." : " Create new work shift"}
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

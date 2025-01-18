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
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import AppFormSelect from "../forms/AppFormSelect";
import AppFormDatePicker from "../forms/AppFormDatepicker";
import { useAuth } from "@/context/auth.context";
import AppFormTextArea from "../forms/AppFormTextArea";

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const formSchema = z.object({
  employee: z.string().min(1, { message: "Please choose an employee" }),
  type: z.string().min(1, { message: "Please choose a leave type" }),
  status: z.string().min(1, { message: "Please choose a leave status" }),
  start: z.date({ required_error: "Please choose a start date" }),
  end: z.date({ required_error: "Please choose a start date" }),
  notes: z.string().optional(),
});

const getDefaultValues = (data?: any) => {
  return {
    employee: data?.employee || "",
    type: data?.type || "",
    status: data?.status || "",
    start: data?.start ? new Date(data?.start) : undefined,
    end: data?.end ? new Date(data?.end) : undefined,
    notes: data?.notes || "",
  };
};

export function LeaveFormModal({ open, setOpen, record, onComplete }: any) {
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

    const days = Math.ceil(
      (new Date(data.end).getTime() - new Date(data.start).getTime()) /
        (1000 * 3600 * 24)
    );

    // check if days is greater than 0
    if (days <= 0) {
      return toast.error("End date must be greater than start date");
    }

    const q = !record
      ? pocketbase
          .collection("leaves")
          .create({ ...data, created_by: user.id, days })
      : pocketbase.collection("leaves").update(record.id, data);

    return q
      .then(async (e) => {
        onComplete();
        toast.error(
          q ? "Leave updated succesfully" : "Leave created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function employeesLoader({ search }) {
    return pocketbase
      .collection("users")
      .getFullList({
        filter: `name~"${search}"`,
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              {record ? "Update" : "Create a new"} leave.
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {record ? "Update" : "Create a new"}leave.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-2">
                <AppFormAsyncSelect
                  form={form}
                  label={"Choose employee"}
                  placeholder={"Choose employee"}
                  name={"employee"}
                  loader={employeesLoader}
                />
                <AppFormSelect
                  form={form}
                  label={"Choose type"}
                  placeholder={"Enter leave type"}
                  name={"type"}
                  options={[
                    "annual",
                    "maternity",
                    "paternity",
                    "sick",
                    "study",
                    "unpaid",
                    "0ther",
                  ].map((e) => ({ label: capitalizeFirstLetter(e), value: e }))}
                />
              </div>
              <div>
                <AppFormSelect
                  form={form}
                  label={"Choose status"}
                  placeholder={"Enter leave status"}
                  name={"status"}
                  options={["pending", "approved", "rejected"].map((e) => ({
                    label: capitalizeFirstLetter(e),
                    value: e,
                  }))}
                />
              </div>
              <div className="grid gap-2 grid-cols-2">
                <AppFormDatePicker
                  form={form}
                  label={"Choose start date"}
                  placeholder={"Choose start date"}
                  name={"start"}
                />
                <AppFormDatePicker
                  form={form}
                  label={"Choose end date"}
                  placeholder={"Choose end date"}
                  name={"end"}
                />
              </div>
              <div>
                <AppFormTextArea
                  form={form}
                  label={"Enter notes"}
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
                  {record ? "Update leave." : " Create new leave"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

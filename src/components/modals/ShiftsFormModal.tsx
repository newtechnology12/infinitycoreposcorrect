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
import AppFormTextArea from "../forms/AppFormTextArea";
import AppFormSelect from "../forms/AppFormSelect";
import { useAuth } from "@/context/auth.context";
import { cn } from "@/utils";
import { PlusCircle, Trash2 } from "react-feather";
import useModalState from "@/hooks/useModalState";
import { EmployeesModal } from "../EmployeesModal";

const formSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100, "Name is too long"),
  status: z
    .string()
    .min(2, "Status is too short")
    .max(100, "Status is too long"),
  start_hour: z
    .string()
    .min(1, "Start hour is required")
    .max(100, "Start hour is too long"),
  end_hour: z
    .string()
    .min(2, "End hour is required")
    .max(100, "End hour is too long"),
  description: z
    .string()
    .min(2, "Description is too short")
    .max(100, "Description is too long"),
  employees: z.any(),
});

const getDefaultValues = (data?: any) => {
  return {
    name: data?.name || "",
    status: data?.status || "",
    start_hour: data?.start_hour.toString() || "",
    end_hour: data?.end_hour.toString() || "",
    description: data?.description || "",
    employees:
      data?.expand?.employees?.map((e) => {
        console.log(e);
        return {
          id: e?.id,
          isDeleted: false,
          employee: {
            id: e?.expand?.employee?.id,
            name: e?.expand?.employee.name,
            role: e?.expand?.employee.role,
          },
        };
      }) || [],
  };
};

export function ShiftsFormModal({ open, setOpen, record, onComplete }: any) {
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
    };

    // const get duration in seconds by subtracting end hour from start hour and put in secs
    const start_hour = values.start_hour;
    const end_hour = values.end_hour;
    const duration = Number(end_hour) - Number(start_hour);
    const duration_in_secs = duration * 3600;

    const q = !record
      ? pocketbase
          .collection("shifts")
          .create({ ...data, created_by: user?.id, duration: duration_in_secs })
      : pocketbase
          .collection("shifts")
          .update(record.id, { ...data, duration: duration_in_secs });

    return q
      .then(async (shift) => {
        const newEmployees = await Promise.all(
          record?.status === "recieved"
            ? []
            : employees.map((e) => {
                const q = e.id
                  ? e.isDeleted
                    ? pocketbase
                        .autoCancellation(false)
                        .collection("shift_employees")
                        .delete(e.id)
                    : pocketbase
                        .autoCancellation(false)
                        .collection("shift_employees")
                        .update(e.id, {
                          ...e,
                          shift: shift.id,
                          employee: e.employee.id,
                        })
                  : pocketbase
                      .autoCancellation(false)
                      .collection("shift_employees")
                      .create({
                        ...e,
                        shift: shift.id,
                        employee: e.employee.id,
                      });

                return q;
              })
        );
        return pocketbase
          .collection("shifts")
          .update(shift.id, {
            employees: newEmployees.map((e: any) => e.id).filter((e) => e),
          })
          .then(() => {
            onComplete();
            toast.error(
              q ? "shift updated succesfully" : "shift created succesfully"
            );
            form.reset();
          });
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }
  const shiftEmployeesModal = useModalState();

  const employees = useWatch({
    control: form.control,
    name: "employees",
  });

  return (
    <>
      {" "}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              <span className="text-base px-2 font-semibold py-2">
                {record ? "Update" : "Create a new"}shift
              </span>
            </DialogTitle>
            <DialogDescription>
              <span className="px-2 py-0 text-sm text-slate-500 leading-7">
                Fill in the fields to {record ? "Update" : "Create a new"}shift.
              </span>
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid px-2 gap-2">
                <div className="grid gap-2 grid-cols-2">
                  <AppFormField
                    form={form}
                    label={"Shift name"}
                    placeholder={"Enter Shift name"}
                    name={"name"}
                  />
                  <AppFormSelect
                    form={form}
                    label={"Choose status"}
                    placeholder={"Choose status"}
                    name={"status"}
                    type="number"
                    options={[
                      { label: "Active", value: "active" },
                      { label: "Inactive", value: "inactive" },
                    ]}
                  />
                </div>
                <div className="grid gap-2 grid-cols-2">
                  <AppFormField
                    form={form}
                    label={"Start hour"}
                    placeholder={"Enter start hour"}
                    name={"start_hour"}
                    type="number"
                  />
                  <AppFormField
                    form={form}
                    label={"End hour"}
                    placeholder={"Enter end hour"}
                    name={"end_hour"}
                    type="number"
                  />
                </div>

                <div>
                  <AppFormTextArea
                    form={form}
                    label={"Description"}
                    placeholder={"Enter description"}
                    name={"description"}
                  />
                </div>
                {employees.filter((e) => !e.isDeleted).length ? (
                  <div
                    className={cn("px-2", {
                      "opacity-60 pointer-events-none":
                        record?.status === "recieved",
                    })}
                  >
                    <div className="border px-3- rounded-[3px] mt-3 border-slate-200">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-[13px] px-3 py-2 border-b text-left font-medium">
                              Id
                            </th>
                            <th className="text-[13px]  px-3 py-2 border-b   text-left font-medium">
                              Names
                            </th>
                            <th className="text-[13px]  px-3 py-2 border-b   text-left font-medium">
                              Role
                            </th>
                            <th className="text-[13px] py-2  px-3 border-b  text-right font-medium">
                              Action
                            </th>
                          </tr>
                        </thead>
                        {employees
                          .filter((e) => !e.isDeleted)
                          .map((e, index) => {
                            return (
                              <tr className="text-[13px] text-slate-600">
                                <td className="py-1 px-3 ">{index + 1}</td>
                                <td className="py-1 px-3 ">
                                  {e.employee.name}
                                </td>
                                <td className="py-1 capitalize px-3 ">
                                  {e.employee.role}
                                </td>
                                <td className="flex px-3 py-1 items-center justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      form.setValue(
                                        "employees",
                                        employees.map((e, i) =>
                                          i === index
                                            ? {
                                                ...e,
                                                isDeleted: true,
                                              }
                                            : e
                                        )
                                      );
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                      </table>
                    </div>
                  </div>
                ) : null}
                <div
                  className={cn("px-0  mt-4", {
                    "opacity-60 pointer-events-none":
                      record?.status === "recieved",
                  })}
                >
                  <a
                    onClick={() => shiftEmployeesModal.open()}
                    className="border gap-3 text-slate-600 font-medium text-[13px] text-center justify-center hover:bg-slate-100 cursor-pointer border-dashed w-full flex items-center border-slate-300 rounded-[3px] py-2 px-3"
                  >
                    <PlusCircle size={16} />
                    <span>Add Employee to the shift</span>
                  </a>
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
                    {record ? "Update shift." : " Create new shift"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <EmployeesModal
        open={shiftEmployeesModal.isOpen}
        setOpen={shiftEmployeesModal.setisOpen}
        stock={form.watch("employees")}
        onSelect={(e) => {
          shiftEmployeesModal.setisOpen(false);
          // check if the employee is already added to the shift
          const isAdded = employees.some(
            (i: any) => i.employee.id === e.id && !i.isDeleted
          );
          if (isAdded) {
            toast.error("Employee already added to the shift");
            return;
          }
          form.setValue("employees", [
            ...employees,
            {
              isDeleted: false,
              employee: {
                id: e.id,
                name: e.name,
                role: e.role,
              },
            },
          ]);
        }}
      />
    </>
  );
}

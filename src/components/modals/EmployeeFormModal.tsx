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
import AppFormAsyncSelect from "../forms/AppFormAsyncSelect";
import AppFormSelect from "../forms/AppFormSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import AppFileUpload from "../forms/AppFileUpload";
import { useRoles } from "@/context/roles.context";

const formSchema = z.object({
  first_name: z.string().min(1, { message: "First name is a required field" }),
  last_name: z.string().min(1, { message: "Last name is a required field" }),
  username: z.string().min(1, { message: "Username is a required field" }),
  phone: z.string().min(10, { message: "Phone is a required field" }),
  role: z.string(),
  gender: z.string().min(1, { message: "Gender is a required field" }),
  birth: z.any().optional(),
  country: z.string(),
  national_id: z.string(),
  department: z.string(),
  salary: z.string(),
  status: z.string(),
  bank_name: z.string(),
  bank_account_number: z.string(),
  joined_at: z.any().optional(),
  national_id_copy: z.any(),
  net_salary: z.string(),
  cv: z.any(),
});

const getDefaultValues = (data?: any) => {
  return {
    first_name: data?.name ? data?.name?.split(" ")[0] : "",
    last_name: data?.name ? data?.name?.split(" ")[1] : "",
    username: data?.username || "",
    phone: data?.phone || "",
    role: data?.role || "",
    gender: data?.gender || "",
    department: data?.department || "",
    birth: data?.birth ? data?.birth : undefined,
    country: data?.country || "",
    national_id: data?.national_id.toString() || "",
    salary: data?.salary?.toString() || "",
    net_salary: data?.net_salary?.toString() || "",
    status: data?.status || "inactive",
    bank_name: data?.bank_name || "",
    bank_account_number: data?.bank_account_number || "",
    joined_at: data?.joined_at
      ? new Date(data?.joined_at).toLocaleDateString()
      : undefined,
    national_id_copy: data?.national_id_copy || "",
    cv: data?.cv || "",
  };
};

export function EmployeFormModal({ open, setOpen, employee, onComplete }: any) {
  const values = useMemo(() => getDefaultValues(employee), [employee]);

  console.log(values);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [employee]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data: any = {
      name: values.first_name.trim() + " " + values.last_name.trim(),
      ...values,
    };

    const updateData = { ...data };

    const q = !employee
      ? pocketbase.collection("users").create({
          ...data,
          emailVisibility: true,
          password: "123456",
          passwordConfirm: "123456",
        })
      : pocketbase.collection("users").update(employee.id, updateData);

    return q
      .then(() => {
        onComplete();
        toast.success(
          employee
            ? "Employee updated succesfully"
            : "Employee created succesfully"
        );
        form.reset();
      })
      .catch((e) => {
        Object.keys(e.data.data).forEach((i: any) => {
          form.setError(i, {
            type: "custom",
            message: e.data.data[i]?.message,
          });
        });
        toast.error(e.message);
      });
  }

  function rolesLoader({ search }) {
    return pocketbase
      .collection("roles")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  function departmentsLoader({ search }) {
    return pocketbase
      .collection("departments")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  const { canPerform } = useRoles();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              {employee ? "Update" : "Create a new"} employee
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to {employee ? "Update" : "Create a new"}
              employee.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Personal infomation</TabsTrigger>
                <TabsTrigger value="work">Work infomation</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="personal">
                <div className="grid px-2 gap-2">
                  <div className="grid gap-2 grid-cols-2">
                    <AppFormField
                      form={form}
                      label={"First Name"}
                      placeholder={"Enter first name"}
                      name={"first_name"}
                    />
                    <AppFormField
                      form={form}
                      label={"Enter last name"}
                      placeholder={"Enter last name"}
                      name={"last_name"}
                    />
                  </div>
                  <div className="grid gap-2 grid-cols-2-">
                    <AppFormField
                      form={form}
                      label={"Username"}
                      placeholder={"Enter username"}
                      name={"username"}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <AppFormSelect
                      form={form}
                      label={"Choose gender"}
                      placeholder={"Enter gender"}
                      name={"gender"}
                      options={[
                        { label: "Male", value: "male" },
                        { label: "Female", value: "female" },
                      ]}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <AppFormField
                      type="date"
                      form={form}
                      label={"Choose birth date"}
                      placeholder={"Enter birth date"}
                      name={"birth"}
                    />
                    <AppFormAsyncSelect
                      form={form}
                      label={"Choose country"}
                      placeholder={"Enter country"}
                      name={"country"}
                      loader={({ search }) => {
                        const countries = fetch("/countries.json")
                          .then((e) => e.json())
                          .then((e) =>
                            e.filter((e) =>
                              e.name.toLowerCase().includes(search)
                            )
                          )
                          .then((e) =>
                            e.map((e) => ({ label: e.name, value: e.name }))
                          );
                        return countries;
                      }}
                    />
                  </div>

                  <div className="grid gap-2 grid-cols-2">
                    <AppFormField
                      form={form}
                      label={"Enter phone number"}
                      placeholder={"Enter phone"}
                      name={"phone"}
                    />
                    <AppFormField
                      form={form}
                      label={"Id number"}
                      placeholder={"Enter id number"}
                      name={"national_id"}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="work">
                <div className="px-2">
                  <div className="mb-2 grid grid-cols-2 gap-3">
                    {canPerform("update_employee_role") && (
                      <AppFormAsyncSelect
                        form={form}
                        label={"Role"}
                        placeholder={"Choose role"}
                        name={"role"}
                        loader={rolesLoader}
                      />
                    )}
                    <AppFormAsyncSelect
                      form={form}
                      label={"Department"}
                      placeholder={"Choose department"}
                      name={"department"}
                      loader={departmentsLoader}
                    />
                  </div>
                  <div className="mb-1 grid grid-cols-2 gap-2">
                    <AppFormField
                      form={form}
                      type={"number"}
                      label={"Enter salary"}
                      placeholder={"Enter salary"}
                      name={"salary"}
                    />
                    <AppFormField
                      form={form}
                      type={"number"}
                      label={"Enter net salary"}
                      placeholder={"Enter net salary"}
                      name={"net_salary"}
                    />
                  </div>{" "}
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <AppFormField
                      form={form}
                      label={"Enter bank name"}
                      placeholder={"Enter bank name"}
                      name={"bank_name"}
                    />
                    <AppFormField
                      form={form}
                      label={"Enter bank account number"}
                      placeholder={"Enter bank account number"}
                      name={"bank_account_number"}
                    />
                  </div>{" "}
                  <div className="grid mt-1 grid-cols-2- gap-3">
                    {canPerform("update_employee_status") && (
                      <AppFormSelect
                        form={form}
                        label={"Employee status"}
                        placeholder={"Choose employee status"}
                        name={"status"}
                        options={[
                          {
                            label: "Active",
                            value: "active",
                          },
                          {
                            label: "Inactive",
                            value: "inactive",
                          },
                          {
                            label: "Suspended",
                            value: "suspended",
                          },
                          {
                            label: "Terminated",
                            value: "terminated",
                          },
                          {
                            label: "Resigned",
                            value: "resigned",
                          },
                        ]}
                      />
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-3">
                    <AppFormField
                      form={form}
                      type={"date"}
                      label={"Choose joined date"}
                      placeholder={"Joined date"}
                      name={"joined_at"}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="documents">
                <div className="px-2 space-y-2">
                  <AppFileUpload
                    form={form}
                    label={"Upload national id copy"}
                    name={"national_id_copy"}
                    preview={pocketbase.files.getUrl(
                      employee,
                      employee?.national_id_copy
                    )}
                  />
                  <AppFileUpload
                    form={form}
                    label={"Upload your cv or resume."}
                    name={"cv"}
                    preview={pocketbase.files.getUrl(employee, employee?.cv)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <div className="mt-6 flex items-center gap-2 px-2 pb-1">
                <Button
                  onClick={() => form.reset()}
                  className="w-full text-slate-600"
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  disabled={
                    form.formState.disabled || form.formState.isSubmitting
                  }
                  className="w-full"
                  size="sm"
                >
                  {form.formState.isSubmitting && (
                    <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                  )}
                  {employee ? "Update employee." : " Create new employee"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

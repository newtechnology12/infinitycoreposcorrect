import AppFormField from "@/components/forms/AppFormField";
import AppFormSelect from "@/components/forms/AppFormSelect";
import Loader from "@/components/icons/Loader";
import ConfirmModal from "@/components/modals/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import basePermissions from "@/constraints/basePermissions.json" assert { type: "json" };
import { useAuth } from "@/context/auth.context";
import useConfirmModal from "@/hooks/useConfirmModal";
import pocketbase from "@/lib/pocketbase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "react-feather";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, { message: "Names is a required field" }),
  status: z.string().min(1, { message: "Status is a required field" }),
  daily_allowance: z
    .string()
    .min(1, { message: "Daily allowance is required" }),
});

const getDefaultValues = (data?: any) => {
  return {
    name: data?.name || "",
    status: data?.status || "active",
    daily_allowance: data?.daily_allowance?.toString() || 0,
  };
};

export default function CreateOrUpdaterRole() {
  const { roleId } = useParams();

  const getRole = async () => {
    const role = await pocketbase.collection("roles").getOne(roleId);
    return role;
  };

  const { data: role, status } = useQuery(["roles", roleId], getRole, {
    enabled: Boolean(roleId),
  });

  const values = useMemo(() => getDefaultValues(role), [role]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  const resetPermitions = (role) => {
    const newP = basePermissions.map((e) => {
      return {
        ...e,
        children: e.children.map((e) => {
          return {
            ...e,
            access:
              role?.permitions?.find((i) => i.name === e.name)?.access || false,
          };
        }),
      };
    });
    setPermissions(newP);
  };
  useEffect(() => {
    if (role) {
      resetPermitions(role);
    }
  }, [role]);

  const [permissions, setPermissions] = useState(basePermissions);

  const { user } = useAuth();

  const navigate = useNavigate();

  function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
    };

    const perms = permissions.map((parent) => parent.children).flat();

    console.log(perms);
    return (
      roleId
        ? pocketbase.collection("roles").update(roleId, {
            ...values,
            permitions: perms,
          })
        : pocketbase
            .collection("roles")
            .create({ ...data, permitions: perms, created_by: user.id })
    )
      .then((e) => {
        toast.success("Role created/updated succesfully");
        resetPermitions(e);
        navigate(
          `/dashboard/settings/general-settings/roles-permissions/${e.id}`
        );
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  useEffect(() => {
    form.reset();
  }, []);

  const deleteMutation = useMutation({
    mutationFn: () => {
      return pocketbase.collection("roles").delete(roleId);
    },
    onSuccess: () => {
      navigate(-1);
      toast.success("You have successfully deleted a role");
      confirmModal.close();
    },
    onError: (error: any) => {
      toast.error(error.message);
      console.log(error);
    },
  });

  const confirmModal = useConfirmModal();

  return (
    <>
      <div>
        <div className="flex- items-center justify-between">
          <div className="px-3 flex items-center justify-between py-3">
            <Button
              onClick={() => {
                navigate(
                  "/dashboard/settings/general-settings/roles-permissions"
                );
              }}
              size="sm"
              className="gap-3 rounded-full text-primary hover:underline"
              variant="secondary"
            >
              <ArrowLeft size={16} />
              <span>Go back to roles</span>
            </Button>
            <div className="flex items-center gap-2">
              {role && (
                <Button
                  type="submit"
                  onClick={() => confirmModal.setisOpen(true)}
                  disabled={deleteMutation.isLoading}
                  size="sm"
                  variant="destructive"
                >
                  Delete Role
                </Button>
              )}
              <Button
                type="submit"
                onClick={form.handleSubmit(onSubmit)}
                disabled={
                  form.formState.disabled || form.formState.isSubmitting
                }
                size="sm"
              >
                {form.formState.isSubmitting && (
                  <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                )}
                Save role & permissions
              </Button>
            </div>
          </div>
          <div>
            {status !== "loading" && (
              <div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="border-b border-dashed">
                      <div className="grid pb-3 px-4 max-w-3xl gap-2">
                        <div className="grid gap-2 grid-cols-3">
                          <AppFormField
                            form={form}
                            label={"Roles name"}
                            placeholder={"Enter roles name"}
                            name={"name"}
                          />
                          <AppFormSelect
                            form={form}
                            label={"Status"}
                            placeholder={"Select status"}
                            name={"status"}
                            options={[
                              { label: "Active", value: "active" },
                              { label: "Inactive", value: "inactive" },
                            ]}
                          />
                          <AppFormField
                            form={form}
                            label={"Daily allowance"}
                            placeholder={"Enter daily allowance"}
                            name={"daily_allowance"}
                            type={"number"}
                          />
                        </div>
                      </div>
                      <div className="flex px-4 pb-4 justify-between- w-full items-center space-x-2">
                        <Checkbox
                          onCheckedChange={(checked) => {
                            const newP: any[] = permissions.map((e) => {
                              return {
                                ...e,
                                children: e.children.map((child) => {
                                  return {
                                    ...child,
                                    access: checked,
                                  };
                                }),
                              };
                            });

                            setPermissions(newP);
                          }}
                          checked={permissions
                            .map((parent) => parent.children)
                            .flat()
                            .every(
                              (item) =>
                                item.hasOwnProperty("access") &&
                                item.access === true
                            )}
                          id={"all"}
                        />
                        <label
                          htmlFor={"all"}
                          className="capitalize font-medium- text-slate-500 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Allow all permissions
                        </label>
                      </div>
                    </div>
                    <div className="px-5 py-3">
                      <div>
                        <h4 className="text-[12px] font-medium text-slate-500 uppercase">
                          Permitions for this role
                        </h4>
                      </div>
                      <div className="py-4">
                        <div>
                          <div className="grid grid-cols-2- gap-y-5 gap-x-7">
                            {permissions.map((permissionP, i) => (
                              <div className="pb-2" key={i}>
                                <div className="flex mb-3 gap-3 items-center justify-between-">
                                  <h4 className="font-semibold text-sm">
                                    {permissionP.parent}
                                  </h4>
                                </div>
                                <div className="space-y-4 pl-3">
                                  {permissionP.children.map((permission) => {
                                    return (
                                      <div key={permission.name}>
                                        <div className="flex justify-between- w-full items-center space-x-2">
                                          <Checkbox
                                            onCheckedChange={(checked) => {
                                              const newP: any[] =
                                                permissions.map((e) => {
                                                  if (
                                                    permissionP.parent ===
                                                    e.parent
                                                  ) {
                                                    return {
                                                      ...e,
                                                      children: e.children.map(
                                                        (child) =>
                                                          child.name ===
                                                          permission.name
                                                            ? {
                                                                ...child,
                                                                access: checked,
                                                              }
                                                            : child
                                                      ),
                                                    };
                                                  } else {
                                                    return e;
                                                  }
                                                });

                                              setPermissions(newP);
                                            }}
                                            checked={permission.access}
                                            id={permission.name}
                                          />
                                          <label
                                            htmlFor={permission.name}
                                            className="capitalize font-medium- text-slate-500 text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                          >
                                            {permission.title}
                                          </label>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              </div>
            )}
            {status === "loading" && (
              <div className="w-full h-[400px] flex items-center justify-center">
                <Loader className="mr-2 h-5 w-5 text-primary animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        title={"Are you sure you want to delete?"}
        description={`Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi, amet
        a! Nihil`}
        meta={confirmModal.meta}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isLoading}
        open={confirmModal.isOpen}
        onClose={() => confirmModal.close()}
      />
    </>
  );
}

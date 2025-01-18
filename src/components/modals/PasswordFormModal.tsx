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

const formSchema = z
  .object({
    password: z.string().min(1, { message: "Password is a required field" }),
    passwordConfirm: z
      .string()
      .min(1, { message: "Password Confirm is a required field" }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"], // This references the path of the field causing the error
  });

const getDefaultValues = (data?: any) => {
  return {
    password: data?.password || "",
    passwordConfirm: data?.passwordConfirm || "",
  };
};

export function PasswordFormModal({
  open,
  setOpen,
  employee,
  onComplete,
}: any) {
  const values = useMemo(() => getDefaultValues(employee), [employee]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [employee]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
    };

    return pocketbase
      .send("/update-user-password", {
        method: "POST",
        body: {
          user: employee?.id,
          password: data.password,
        },
      })
      .then(() => {
        form.reset();
        setOpen(false);
        onComplete();
        toast.success("User password updated successfully");
      });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              Update user password.
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to update user password.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div className="grid gap-2 grid-cols-1">
                <AppFormField
                  form={form}
                  label="Password"
                  name="password"
                  type="password"
                  placeholder={"Enter password"}
                />
                <AppFormField
                  form={form}
                  label="Password Confirm"
                  name="passwordConfirm"
                  type="password"
                  placeholder={"Enter password confirm"}
                />
              </div>
            </div>
            <DialogFooter>
              <div className="mt-6 flex items-center gap-2 px-2 pb-1">
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
                  Update Password
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

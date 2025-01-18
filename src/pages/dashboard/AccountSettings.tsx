import BreadCrumb from "@/components/breadcrumb";
import AppFormField from "@/components/forms/AppFormField";
import Loader from "@/components/icons/Loader";
import Avatar from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/auth.context";
import { cn } from "@/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layout, LogOut, Phone, TypeIcon } from "lucide-react";
import { useState } from "react";
import { Mail } from "react-feather";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import useModalState from "@/hooks/useModalState";
import LogoutModal from "@/components/modals/LogoutModal";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";

export default function AccountSettings() {
  const { user } = useAuth();
  const [activeTab, setactiveTab] = useState("personal details");
  return (
    <div className="px-3">
      <div className="flex flex-col sm:flex-row sm:gap-0 sm:items-center gap-3 items-start justify-between space-y-2 mb-3">
        <div className="flex items-start gap-2 flex-col">
          <h2 className="text-base font-semibold tracking-tight">My Account</h2>
          <BreadCrumb items={[{ title: "My account", link: "/dashboard" }]} />
        </div>
      </div>
      <div className="grid md:grid-cols-10 grid-cols-1 gap-3">
        <div className="md:col-span-3 col-span-7">
          <div className="bg-white rounded-[3px] px-3 border py-4">
            <div className="flex items-center pb-5 text-center flex-col justify-center gap-2">
              <Avatar
                className="h-16 w-16"
                name={user?.names || ""}
                path={user?.photo}
              />
              <div className="flex items-center flex-col justify-center gap-3">
                <h2 className="text-[15px] font-semibold tracking-tight">
                  {user?.names}
                </h2>
                <p className="text-[12.5px] w-fit px-3 py-[2px] rounded-[3px] text-primary bg-primary bg-opacity-20 capitalize font-medium">
                  {user?.role?.name}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <div className="mb-3 border-b pb-2 border-dashed">
                <h4 className="text-sm font-semibold">Details Info</h4>
              </div>
              <div className="mt-2 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center bg-slate-100">
                    <TypeIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-[13px] !leading-0 capitalize font-semibold">
                      {user.names || "N.A"}
                    </h4>
                    <span className="text-[13px] text-slate-500">
                      Full names
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center bg-slate-100">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-[13px] capitalize- font-medium">
                      {user.email || "N.A"}
                    </h4>
                    <span className="text-[13px] text-slate-500">
                      Email Address
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center bg-slate-100">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-[13px] capitalize font-medium">
                      {user.phone || "N.A"}
                    </h4>
                    <span className="text-[13px] text-slate-500">
                      {" "}
                      Phone Number
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center bg-slate-100">
                    <Layout className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-[13px] capitalize font-medium">
                      {user.role.name}
                    </h4>
                    <span className="text-[13px] text-slate-500">
                      User Role
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-7">
          <Card>
            <div className="flex px-3 gap-4 w-full border-b items-center justify-start">
              {["personal details", "logout"].map((e, i) => {
                return (
                  <a
                    key={i}
                    className={cn(
                      "cursor-pointer px-6 capitalize text-center relative w-full- text-slate-700 text-[13px] sm:text-sm py-3  font-medium",
                      {
                        "text-primary ": activeTab === e,
                      }
                    )}
                    onClick={() => {
                      setactiveTab(e);
                    }}
                  >
                    {activeTab === e && (
                      <div className="h-[3px] left-0 rounded-t-md bg-primary absolute bottom-0 w-full"></div>
                    )}
                    <span className=""> {e}</span>
                  </a>
                );
              })}
            </div>
            <div>
              {activeTab === "logout" && <Logout />}
              {activeTab === "personal details" && <Personal />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Logout() {
  const logoutModal = useModalState();

  return (
    <>
      <div className="mt-4- rounded-[3px] py-4 px-4">
        <div className="mb-3 py-3- ">
          <h4 className="font-semibold dark:text-slate-100 text-[14px]">
            Logout Your Account
          </h4>
          <p className="text-[14.5px] leading-8 mt-1 dark:text-slate-400 text-slate-500">
            This action cannot be undone. This will permanently logout your
            account
          </p>
        </div>
        <div className="mt-4 flex items-center justify-start">
          <Button
            onClick={() => logoutModal.open()}
            variant="destructive"
            className="px-4"
            size="sm"
          >
            <LogOut className="mr-2" size={14} />
            Logout Your Account
          </Button>
        </div>
      </div>
      <LogoutModal
        onClose={() => logoutModal.close()}
        open={logoutModal.isOpen}
      />
    </>
  );
}

function Personal() {
  const { user } = useAuth();

  const formSchema = z.object({
    name: z.string().min(3, "Name is too short"),
    email: z.string().min(1, { message: "Email is a required field" }),
    phone: z.string().min(1, { message: "Phone is a required field" }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      name: user.names,
      email: user.email,
      phone: user.phone,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await pocketbase.collection("users").update(user.id, values);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("An error occured");
    }
  }
  return (
    <div>
      <div className="max-w-2xl py-4 px-4">
        <div className="dark:border-slate-700 border-slate-300">
          <div className="border-b- dark:border-b-slate-700 border-slate-300 mb-0 pb-3 ">
            <h4 className="font-semibold dark:text-slate-200 text-sm">
              Update Personal Details
            </h4>
            <p className="text-[13.5px] leading-7 dark:text-slate-400 mt-1 text-slate-500">
              Lorem ipsum, dolor sit amet consectetur adipisicing elit.
            </p>
          </div>
          <div className="mb-0">
            <Form {...form}>
              <form
                className="space-y-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="grid-cols-2 gap-2 grid">
                  <AppFormField
                    type={"name"}
                    form={form}
                    label={"Your full names"}
                    placeholder={"Enter Full names"}
                    name={"name"}
                  />
                  <AppFormField
                    type={"email"}
                    disabled={true}
                    form={form}
                    label={"Your email"}
                    placeholder={"Enter new email"}
                    name={"email"}
                  />
                </div>
                <div>
                  <AppFormField
                    type={"phone"}
                    form={form}
                    label={"Your phone number"}
                    placeholder={"Enter new number"}
                    name={"phone"}
                  />
                </div>
                <div className="mt-5 flex items-center justify-end">
                  <Button
                    size="sm"
                    type="submit"
                    className="mt-1"
                    disabled={
                      form.formState.disabled || form.formState.isSubmitting
                    }
                  >
                    {form.formState.isSubmitting && (
                      <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                    )}
                    Update Profile Details
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

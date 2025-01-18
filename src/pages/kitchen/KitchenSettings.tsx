import AppFormField from "@/components/forms/AppFormField";
import Loader from "@/components/icons/Loader";
import LogoutModal from "@/components/modals/LogoutModal";
import Avatar from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/context/auth.context";
import useModalState from "@/hooks/useModalState";
import useShowSidebar from "@/hooks/useShowSidebar";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftToLine, LogOut } from "lucide-react";
import { Menu } from "react-feather";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useStopwatch } from "react-timer-hook";
import { z } from "zod";
import { Tabs } from "@/components/ui/tabs";
import { useState } from "react";

const formSchema = z.object({
  current_password: z
    .string()
    .min(1, { message: "Current Password is required" }),
  new_password: z.string().min(1, { message: "New Password is required" }),
});

export default function KitchenSettings() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
    },
  });
  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  const logoutModal = useModalState();

  const navigate = useNavigate();

  const { showSideBar } = useShowSidebar();

  const { user } = useAuth();

  const getOffest = (clock_in) => {
    const now = new Date();
    return (now.getTime() - new Date(clock_in).getTime()) / 1000;
  };

  const [activeTab, setactiveTab] = useState("general");

  const closeOfDayModal = useModalState();

  return (
    <>
      <div className="flex flex-col">
        <div>
          <div className="bg-white dark:bg-slate-900 py-2 border-b dark:border-b-slate-700 flex items-center justify-between px-3">
            <div className="font-semibold gap-3 flex items-center text-sm">
              <a
                onClick={() =>
                  navigate({
                    search: showSideBar ? "" : "?show_sidebar=yes",
                  })
                }
                className="h-8 w-8 cursor-pointer dark:bg-slate-800 bg-slate-100 flex dark:text-slate-300 text-slate-600 items-center gap-2 justify-center rounded-[4px]"
              >
                {!showSideBar ? (
                  <Menu
                    size={16}
                    className="text-slate-700 dark:text-slate-300"
                  />
                ) : (
                  <ArrowLeftToLine
                    size={16}
                    className="text-slate-700  dark:text-slate-300"
                  />
                )}
              </a>

              <span className="text-slate-700  dark:text-slate-300">
                Account
              </span>
            </div>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={(e) => setactiveTab(e)}
            className="w-full scroller"
          >
            <div className="max-w-3xl mx-auto mt-3 gap-3  grid grid-cols-1 sm:grid-cols-2 px-3">
              <div className="my-3- mb-1- rounded-sm border dark:border-slate-700 dark:bg-slate-800 bg-white px-3 py-2 pb-2 gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <Avatar className="h-12 w-12" name="Ntwali Edson" path="" />
                  </div>
                  <div className="flex flex-col gap-[3px]">
                    <h4 className="text-[15px] capitalize dark:text-slate-200 font-semibold">
                      {user.names}
                    </h4>
                    <span className="text-sm capitalize font-medium- dark:text-slate-400 text-slate-500">
                      {user.role.name}
                    </span>
                  </div>
                </div>
                <div className="pt-4 pb-1 space-y-3">
                  {[
                    { label: "Email", value: user.email },
                    {
                      label: "Phone",
                      value: user["phone"] || "Not available",
                    },
                    // {
                    //   label: "Joined at",
                    //   value: user.created_at,
                    // },
                    {
                      label: "Status",
                      value: user.status || "Active",
                    },
                    { label: "Role", value: user.role?.name },
                  ].map((e, i) => {
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-[13px] dark:text-slate-200 text-slate-800 font-medium">
                          {e.label}:
                        </span>
                        <span className="text-[13px] capitalize dark:text-slate-400 text-slate-500 font-medium-">
                          {e.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4- flex flex-col justify-between dark:bg-slate-800 dark:border-slate-700 bg-white border border-slate-200 rounded-[3px] py-4 px-4">
                <div className="mb-3 py-3- ">
                  <h4 className="font-semibold dark:text-slate-100 text-[15px]">
                    Logout Your Account
                  </h4>
                  <p className="text-[14.5px] leading-8 mt-1 dark:text-slate-400 text-slate-500">
                    This action cannot be undone. This will permanently logout
                    your account
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
              {/* <div className="max-w-md- sm:col-span-2 px-3-">
                <div className="mt-4- dark:bg-slate-800 dark:border-slate-700 bg-white border border-slate-200 rounded-[3px] py-4 px-4">
                  <div className="dark:border-slate-700 border-slate-300">
                    <div className="border-b- dark:border-b-slate-700 border-slate-300 mb-0 pb-3 ">
                      <h4 className="font-semibold dark:text-slate-200 text-sm">
                        Change Password
                      </h4>
                      <p className="text-[15px] leading-7 dark:text-slate-400 mt-1 text-slate-500">
                        Lorem ipsum, dolor sit amet consectetur adipisicing
                        elit.
                      </p>
                    </div>
                    <div className="mb-0">
                      <Form {...form}>
                        <form
                          className="space-y-2"
                          onSubmit={form.handleSubmit(onSubmit)}
                        >
                          <AppFormField
                            type={"password"}
                            form={form}
                            label={"Password"}
                            placeholder={"Enter current password"}
                            name={"current_password"}
                          />
                          <AppFormField
                            type={"password"}
                            form={form}
                            label={"Password"}
                            placeholder={"Enter new password"}
                            name={"new_password"}
                          />
                          <div className="mt-5 flex items-center justify-end">
                            <Button
                              size="sm"
                              type="submit"
                              className="mt-1"
                              disabled={
                                form.formState.disabled ||
                                form.formState.isSubmitting
                              }
                            >
                              {form.formState.isSubmitting && (
                                <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                              )}
                              Change Password
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </Tabs>
        </div>
      </div>

      <div className="dark">
        <LogoutModal
          onClose={() => logoutModal.close()}
          open={logoutModal.isOpen}
        />
      </div>
    </>
  );
}

function renderNumberWithLeadingZero(number) {
  if (number < 10) {
    return "0" + number;
  } else {
    return String(number);
  }
}

function CountDown({ offset }) {
  const stopwatchOffset = new Date();
  stopwatchOffset.setSeconds(stopwatchOffset.getSeconds() + offset);
  const { seconds, minutes, hours } = useStopwatch({
    autoStart: true,
    offsetTimestamp: stopwatchOffset,
  });
  return (
    <>
      <span>{renderNumberWithLeadingZero(hours)}</span>:
      <span>{renderNumberWithLeadingZero(minutes)}</span>:
      <span>{renderNumberWithLeadingZero(seconds)}</span>
    </>
  );
}

import Loader from "@/components/icons/Loader";
import LogoutModal from "@/components/modals/LogoutModal";
import Avatar from "@/components/shared/Avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth.context";
import { useworkShift } from "@/context/workShift.context";
import useModalState from "@/hooks/useModalState";
import useShowSidebar from "@/hooks/useShowSidebar";
import { ArrowLeftToLine, Clock, LogOut } from "lucide-react";
import { Menu } from "react-feather";
import { useNavigate } from "react-router-dom";
import { useStopwatch } from "react-timer-hook";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/utils/cn";
import { useState } from "react";
import { RunShiftReportModal } from "@/components/modals/RunShiftReportModal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ShiftsHistory } from "@/components/ShiftHistory";

export default function Settings() {
  const { user } = useAuth();

  const logoutModal = useModalState();

  const navigate = useNavigate();

  const { showSideBar } = useShowSidebar();

  const {
    current,
    clockIn,
    isClockingIn,
    isLoading,
    work_period,
    isLoadingWorkPeriod,
    isClockingOut,
    clockOut,
  } = useworkShift();

  const getOffest = (clock_in) => {
    const now = new Date();
    return (now.getTime() - new Date(clock_in).getTime()) / 1000;
  };

  const [activeTab, setactiveTab] = useState("general");

  const closeOfDayModal = useModalState();

  return (
    <>
      <div className="flex h-dvh flex-col">
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
            <div className="flex px-2 bg-white border-b items-center justify-around">
              {["general"].map((e, i) => {
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
          </Tabs>
        </div>
        <ScrollArea className="w-full scroller whitespace-nowrap-">
          {activeTab === "general" && (
            <div className="max-w-3xl pb-3 mx-auto mt-3 gap-3  grid grid-cols-1 sm:grid-cols-2 px-3">
              <div className="my-3- mb-1 rounded-sm border bg-white px-3 py-2 dark:border-b-slate-700 pb-2 gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <Avatar className="h-12 w-12" name="Ntwali Edson" path="" />
                  </div>
                  <div className="flex flex-col gap-[3px]">
                    <h4 className="text-[15px] capitalize dark:text-slate-200 font-semibold">
                      {user.names}
                    </h4>
                    <span className="text-sm capitalize font-medium- dark:text-slate-400 text-slate-500">
                      {user?.role?.name}
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
                    {
                      label: "Status",
                      value: user.status || "Active",
                    },
                    { label: "Role", value: user?.role?.name },
                  ].map((e, i) => {
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between- gap-3"
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
              <div className="row-span-2">
                <div className="mt-4- h-full dark:bg-slate-800 dark:border-slate-700 bg-white border border-slate-200 rounded-[3px] py-4 px-4">
                  {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <Loader className="mr-2 h-6 w-6 text-primary animate-spin" />
                    </div>
                  ) : (
                    <>
                      {" "}
                      {current ? (
                        <div className="bg-white relative h-full px-3- pt-6 pb-2 border- border-slate-200 rounded-md">
                          <div className="flex flex-col justify-center items-center">
                            <div className="h-12 w-12">
                              <img
                                className="w-full mb-3 h-full"
                                src="/images/on-time-.png"
                                alt=""
                              />
                            </div>
                            <p className="capitalize mt-4 text-base font-semibold">
                              Your Are clocked in.
                            </p>
                            <h4 className="text-2xl text-slate-800 my-3 font-semibold">
                              <CountDown
                                offset={getOffest(current?.started_at)}
                              />
                            </h4>
                            <span className="text-[13px] text-slate-500 font-medium-">
                              {new Date().toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                minute: "numeric",
                                hour: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex justify-center my-5 items-center gap-2">
                            <div className="flex items-center gap-3">
                              <div className="border border-slate-200 h-10 w-10 flex items-center justify-center rounded-full">
                                <Clock size={16} className="text-slate-600" />
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-slate-700">
                                  {new Date(
                                    current?.started_at
                                  ).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "numeric",
                                  })}
                                </p>
                                <span className="text-[12.5px] capitalize  font-medium text-slate-500">
                                  Clock in
                                </span>
                              </div>
                            </div>
                            <div className="px-3">
                              <svg
                                viewBox="0 0 24 24"
                                id="right-left-arrow"
                                height={20}
                                width={20}
                                data-name="Flat Line"
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-slate-600 fill-current stroke-current"
                              >
                                <g id="SVGRepo_bgCarrier" strokeWidth={0} />
                                <g
                                  id="SVGRepo_tracerCarrier"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <g id="SVGRepo_iconCarrier">
                                  <polyline
                                    id="primary"
                                    points="7 13 4 16 7 19"
                                    style={{
                                      strokeLinecap: "round",
                                      strokeLinejoin: "round",
                                      strokeWidth: 2,
                                    }}
                                  />
                                  <path
                                    id="primary-2"
                                    data-name="primary"
                                    d="M20,16H4M4,8H20"
                                    style={{
                                      strokeLinecap: "round",
                                      strokeLinejoin: "round",
                                      strokeWidth: 2,
                                    }}
                                  />
                                  <polyline
                                    id="primary-3"
                                    data-name="primary"
                                    points="17 11 20 8 17 5"
                                    style={{
                                      strokeLinecap: "round",
                                      strokeLinejoin: "round",
                                      strokeWidth: 2,
                                    }}
                                  />
                                </g>
                              </svg>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="border border-slate-200 h-10 w-10 flex items-center justify-center rounded-full">
                                <Clock className="text-slate-600" size={16} />
                              </div>
                              <div>
                                <h4 className="text-[13px] font-semibold text-slate-700">
                                  ---
                                </h4>
                                <span className="text-[12.5px] capitalize  font-medium text-slate-500">
                                  clock out
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-col w-full">
                            <div className="flex w-full max-w-[280px] mx-auto items-center justify-center">
                              <Button
                                onClick={() => closeOfDayModal.open()}
                                variant="destructive"
                                className="w-full bg-blue-500 hover:bg-blue-600"
                                size="sm"
                              >
                                View Shift Report.
                              </Button>
                            </div>
                            <span className="text-[13px] text-slate-500 font-medium">
                              {isLoadingWorkPeriod ? (
                                "Loading..."
                              ) : work_period?.started_at ? (
                                <span>
                                  {new Intl.DateTimeFormat("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "numeric",
                                  }).format(new Date(work_period?.started_at))}
                                </span>
                              ) : (
                                "No work Period available"
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3 flex items-center justify-center flex-col text-center gap-3 py-6">
                          <div className="h-12 w-12">
                            <img
                              className="w-full h-full"
                              src="/images/time.png"
                              alt=""
                            />
                          </div>
                          <h4 className="font-semibold dark:text-slate-100 text-[15px]">
                            You are not clocked in.
                          </h4>
                          <p className="text-[14.5px] px-4 leading-8 dark:text-slate-400 text-slate-500">
                            You are not clocked in. You can clock in at any
                            time, or continue to use the POS.
                          </p>
                          <div>
                            <span className="text-[13px] underline text-slate-600 font-medium">
                              {isLoadingWorkPeriod ? (
                                "Loading..."
                              ) : work_period?.started_at ? (
                                <span>
                                  {new Intl.DateTimeFormat("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "numeric",
                                  }).format(new Date(work_period?.started_at))}
                                </span>
                              ) : (
                                "No work Period available"
                              )}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-start">
                            <Button
                              disabled={!work_period || isClockingIn}
                              onClick={() => clockIn()}
                              size="sm"
                            >
                              {isClockingIn ? (
                                <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                              ) : (
                                <Clock className="mr-2" size={14} />
                              )}
                              Clock-in Now
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4- dark:bg-slate-800 dark:border-slate-700 bg-white border border-slate-200 rounded-[3px] py-4 px-4">
                <div className="mb-3 py-3- ">
                  <h4 className="font-semibold dark:text-slate-100 text-[15px]">
                    Logout Your Account
                  </h4>
                  <p className="text-[14.5px] leading-8 mt-1 dark:text-slate-400 text-slate-500">
                    This action cannot be undone. This will <br /> permanently
                    logout your account
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
            </div>
          )}
          {/* {activeTab === "Shifts History" && (
            <div className="max-w-3xl pb-3 pt-3 mx-auto px-2">
              <ShiftsHistory />
            </div>
          )} */}
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <div className="dark">
        <LogoutModal
          onClose={() => logoutModal.close()}
          open={logoutModal.isOpen}
        />
      </div>
      <RunShiftReportModal
        open={closeOfDayModal.isOpen}
        setOpen={closeOfDayModal.setisOpen}
        shift={current}
        isClockingOut={isClockingOut}
        clockOut={clockOut}
        readOnly
      />
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
  const { days, seconds, minutes, hours } = useStopwatch({
    autoStart: true,
    offsetTimestamp: stopwatchOffset,
  });
  return (
    <>
      <span>{renderNumberWithLeadingZero(days)}</span>:
      <span>{renderNumberWithLeadingZero(hours)}</span>:
      <span>{renderNumberWithLeadingZero(minutes)}</span>:
      <span>{renderNumberWithLeadingZero(seconds)}</span>
    </>
  );
}

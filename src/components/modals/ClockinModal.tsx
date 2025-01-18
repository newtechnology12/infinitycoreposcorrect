import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { ArrowRight, Clock } from "lucide-react";
import Loader from "../icons/Loader";
import { useworkShift } from "@/context/workShift.context";

export function ClockinModal({ open, setOpen }: any) {
  const {
    clockIn,
    isClockingIn,
    isLoading: isLoadingworkShift,
    current,
    isLoadingWorkPeriod,
    work_period,
  } = useworkShift();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        // @ts-ignore
        overlayClass={"backdrop-blur-md"}
        className="sm:max-w-[550px]"
      >
        {isLoadingworkShift ? (
          <div className="h-56 w-full flex items-center justify-center">
            <Loader className="mr-2 h-6 w-6 text-primary animate-spin" />
          </div>
        ) : (
          <>
            {!current ? (
              <div className="flex flex-col gap-3 justify-center items-center py-6">
                <img className="h-16 w-16" src="/images/time.png" alt="" />
                <h4 className="text-base font-semibold">
                  You are not clocked in.
                </h4>
                <span className="text-sm text-slate-500 max-w-xs mx-auto leading-7 text-center">
                  Would you like to clock in now? You can also continue without
                  clocking in.
                </span>
                <div className="flex w-full  max-w-xs flex-col items-center gap-3">
                  <Button
                    onClick={() => clockIn()}
                    disabled={!work_period || isClockingIn}
                    className={"w-full"}
                    size="sm"
                  >
                    {isClockingIn ? (
                      <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                    ) : (
                      <Clock className="mr-2" size={14} />
                    )}
                    <span>Clock in Now</span>
                  </Button>
                  <Button
                    variant="secondary"
                    className={"text-primary w-full"}
                    onClick={() => {
                      setOpen(false);
                    }}
                    size="sm"
                  >
                    Continue without clocking in
                  </Button>
                </div>
                <div>
                  <span className="text-[13px] text-slate-500 font-medium">
                    <span className="text-slate-800">Current Period</span>:{" "}
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
              <div className="flex flex-col gap-3 justify-center items-center py-10">
                <img className="h-16 w-16" src="/images/on-time-.png" alt="" />
                <h4 className="text-base font-semibold">You are clocked in.</h4>
                <span className="text-sm text-slate-500 max-w-xs mx-auto leading-7 text-center">
                  You are currently clocked in. You can clock out at any time,
                  or continue to POS.
                </span>
                <div className="flex w-full-  max-w-xs flex-col items-center gap-3">
                  <Button
                    onClick={() => setOpen(false)}
                    disabled={!work_period}
                    className={"w-full- px-5"}
                    size="sm"
                  >
                    <span>Continue to POS</span>
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

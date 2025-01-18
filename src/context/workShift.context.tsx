import pocketbase from "@/lib/pocketbase";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useMutation, useQuery } from "react-query";
import { useAuth } from "./auth.context";
import { toast } from "sonner";

const WorkShiftContext = createContext(null);

function formatDate(date) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC", // Adjust time zone as needed
  }).format(date);

  // @ts-ignore
  return formattedDate.replace(",", "").replaceAll("/", "-"); // Remove comma
}

const getCurrentworkShift = async ({ queryKey }) => {
  const userId = queryKey[1];
  const work_shifts = await pocketbase.collection("work_shifts").getFullList({
    filter: `employee="${userId}" && started_at>="${formatDate(
      new Date()
    )}" && ended_at=""`,
    expand: "work_period",
  });
  return work_shifts[0];
};

export function WorkShiftProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const getCurrentWorkPeriod = async () => {
    const work_period = await pocketbase
      .collection("work_periods")
      .getFullList({
        filter: `started_at>="${formatDate(new Date())}" && ended_at=""`,
      });
    return work_period[0];
  };

  const {
    isLoading: isLoadingWorkPeriod,
    data: work_period,
    refetch: refetchW,
    remove,
  } = useQuery("work_periods", getCurrentWorkPeriod);

  const {
    data: currentworkShift,
    isLoading,
    refetch,
  } = useQuery(
    [
      "current_work_shift",
      user?.id,
      {
        work_period: work_period?.id,
      },
    ],
    getCurrentworkShift,
    {
      enabled: Boolean(user?.id) && Boolean(work_period?.id),
    }
  );

  const [showClockinModal, setShowClockinModal] = useState(false);

  const clockinMutation = useMutation({
    mutationFn: async () => {
      // check if user has already clocked in for the current work period
      // const existingShift = await pocketbase
      //   .collection("work_shifts")
      //   .getFullList({
      //     filter: `employee="${user.id}" && work_period="${work_period.id}"`,
      //   });

      // if (existingShift.length > 0) {
      //   throw new Error(
      //     "You have already clocked in for this work period, contact your manager to you in again."
      //   );
      // }

      const current_work_periods = await pocketbase
        .collection("work_periods")
        .getFullList({
          filter: `started_at>="${formatDate(new Date())}" && ended_at=""`,
        });

      const current_work_period = current_work_periods[0];

      const current_work_shift_db = await pocketbase
        .collection("work_shifts")
        .getFullList({
          filter: `employee="${user.id}" && work_period="${current_work_period.id}" && ended_at=""`,
        });

      if (!current_work_period)
        throw Error("There is no current work periods open.");

      if (current_work_shift_db?.[0]?.id)
        throw Error("You are already, clocked in refresh.");

      const shift = await pocketbase.collection("work_shifts").create({
        started_by: user.id,
        employee: user.id,
        work_period: current_work_period.id,
        started_at: new Date().toISOString(),
      });
      return pocketbase.collection("work_periods").update(work_period.id, {
        "work_shifts+": shift.id,
      });
    },
    onSuccess: () => {
      refetch();
      refetchW();
    },
    onError: (error: any) => {
      toast.error(error.message || "An error occurred while clocking in", {
        duration: 5000,
      });
      console.log(error);
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => {
      return pocketbase.collection("work_shifts").update(currentworkShift.id, {
        ended_by: user.id,
        ended_at: new Date(),
      });
    },
    onSuccess: () => {
      toast.success("You have successfully clocked out");
      refetch();
      refetchW();
    },
    onError: (error) => {
      toast.error("An error occurred while clocking in");
      console.log(error);
    },
  });

  useEffect(() => {
    let unsubscribe;

    pocketbase
      .collection("work_shifts")
      .subscribe(currentworkShift?.id, function () {
        refetch();
        refetchW();
        // console.log("work shift updated");
      })
      .then((unsub) => {
        unsubscribe = unsub;
      });

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentworkShift?.id]);

  const contextValue = useMemo(
    () => ({
      clockIn: clockinMutation.mutate,
      isClockingIn: clockinMutation.isLoading,
      current: currentworkShift,
      isLoading,
      showClockinModal,
      setShowClockinModal,
      isLoadingWorkPeriod,
      work_period,
      status: "open",
      remove,
      clockOut: clockOutMutation.mutateAsync,
      isClockingOut: clockOutMutation.isLoading,
    }),
    [
      clockinMutation.mutate,
      clockinMutation.isLoading,
      isLoading,
      currentworkShift,
      showClockinModal,
      setShowClockinModal,
      isLoadingWorkPeriod,
      work_period,
      remove,
      clockOutMutation.isLoading,
      clockOutMutation.mutateAsync,
    ]
  );

  return (
    <WorkShiftContext.Provider value={contextValue}>
      {children}
    </WorkShiftContext.Provider>
  );
}

export function useworkShift() {
  const context = useContext(WorkShiftContext);
  if (!context) {
    throw new Error("useworkShift must be used within an WorkshiftProvider");
  }
  return context;
}

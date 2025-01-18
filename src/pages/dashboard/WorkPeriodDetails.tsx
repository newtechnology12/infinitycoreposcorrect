import BreadCrumb from "@/components/breadcrumb";
import ConfirmModal from "@/components/modals/ConfirmModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth.context";
import useConfirmModal from "@/hooks/useConfirmModal";
import pocketbase from "@/lib/pocketbase";
import { XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { Link, Outlet, useLocation, useParams } from "react-router-dom";
import { cn } from "@/utils";
import formatBill from "@/utils/formatBill";
import formatSeconds from "@/utils/formatSeconds";
import { differenceInSeconds } from "date-fns";
import { Card } from "@/components/ui/card";
import { useRoles } from "@/context/roles.context";

export default function WorkPeriodDetails() {
  const params = useParams();

  const workPeriodId = params.workPeriodId;

  const { user } = useAuth();

  const endWorkPeriod = async () => {
    console.log("ending work period");
    setendShiftError(null);
    // end work period
    const open_shift = await pocketbase.collection("work_shifts").getFullList({
      filter: `work_period="${workPeriodId}" && ended_at=""`,
    });

    if (open_shift.length) throw new Error("Please close all shifts first");

    const shifts_without_reports = await pocketbase
      .collection("work_shifts")
      .getFullList({
        filter: `work_period="${workPeriodId}" && report=""`,
      });

    if (shifts_without_reports.length)
      throw new Error("Please report all shifts first");

    return pocketbase.collection("work_periods").update(workPeriodId, {
      ended_at: new Date().toISOString(),
      ended_by: user.id,
    });
  };

  const getCurrentWorkPeriod = async () => {
    const work_period = await pocketbase
      .collection("work_periods")
      .getOne(workPeriodId);
    return work_period;
  };

  const { data: work_period, refetch } = useQuery(
    ["work_periods", workPeriodId],
    getCurrentWorkPeriod
  );

  const endWorkPeriodMutation = useMutation({
    mutationFn: () => {
      return endWorkPeriod();
    },
    onError: (error: any) => {
      setendShiftError(error.message);
    },
    onSuccess: async () => {
      confirmModal.close();
      await pocketbase.collection("work_periods").create({
        started_by: user.id,
        started_at: new Date(),
      });
      refetch();
    },
  });

  const confirmModal = useConfirmModal();

  const [endShiftError, setendShiftError] = useState(null);

  const pathname = useLocation().pathname;

  const base = `/dashboard/reports/work-periods`;

  const workPeriod = work_period;

  const getWorkPeriodReport = async () => {
    const orders = await pocketbase.collection("orders").getFullList({
      filter: `work_period="${workPeriod.id}"`,
      expand:
        "bills,bills.items,bills.transactions,bills.transactions.payment_method,items,items.menu,items.menu.category,waiter",
    });

    const work_shifts = await pocketbase.collection("work_shifts").getFullList({
      filter: `work_period="${workPeriod.id}"`,
    });

    const items_res = await pocketbase.collection("order_items").getFullList({
      filter: `order.work_period="${workPeriod.id}"`,
      expand: "menu,menu.category,order",
    });

    const items: any = items_res
      .filter((e) => e.status !== "draft")
      .filter((e) => e.status !== "cancelled")
      .map((e) => {
        return {
          ...e,
          menu: e?.expand?.menu,
        };
      });

    const grouped_items_by_menu = items
      .filter((e) => e?.menu?.id)
      .reduce((acc, item) => {
        if (!acc[item?.menu?.id]) {
          acc[item?.menu?.id] = [];
        }
        acc[item?.menu?.id].push(item);
        return acc;
      }, {});

    // console.log(grouped_items_by_menu)

    const array_of_single_items = Object.keys(grouped_items_by_menu).map(
      (key) => {
        return {
          menu: grouped_items_by_menu[key][0].menu,
          total_quantity: grouped_items_by_menu[key].reduce(
            (a, b) => a + b.quantity,
            0
          ),
          total_amount: grouped_items_by_menu[key].reduce(
            (a, b) => a + b.amount,
            0
          ),
          percentage: (
            (grouped_items_by_menu[key].reduce(
              (a, b) => a + (b.amount || 0),
              0
            ) /
              items.reduce((a, b) => a + (b.amount || 0), 0)) *
            100
          ).toFixed(2),
        };
      }
    );

    const categories = orders
      .map((order) =>
        order?.expand?.items
          ?.filter((e) => e?.status !== "cancelled")
          .filter((e) => e?.status !== "draft")
      )
      .flat()
      .filter((e) => e)
      .filter((e) => e?.status !== "cancelled")
      .filter((e) => e?.status !== "draft")
      .filter((e) => e)
      .map((e) => {
        return {
          ...e,
          category: e?.expand?.menu?.category,
        };
      });

    const grouped_items_by_category = categories.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    const array_of_single_items_by_category = Object.keys(
      grouped_items_by_category
    ).map((key) => {
      return {
        category:
          grouped_items_by_category[key][0].expand?.menu?.expand?.category
            ?.name,
        total_quantity: grouped_items_by_category[key].reduce(
          (a, b) => a + b.quantity,
          0
        ),
        total_amount: grouped_items_by_category[key].reduce(
          (a, b) => a + b.amount,
          0
        ),
        percentage: (
          (grouped_items_by_category[key].reduce(
            (a, b) => a + (b.amount || 0),
            0
          ) /
            items.reduce((a, b) => a + (b.amount || 0), 0)) *
          100
        ).toFixed(2),
      };
    });

    const waiters_items_sales = orders
      .filter((e) => e?.items?.length)
      .map((order) => {
        return order?.expand?.items
          ?.filter((e) => e?.status !== "cancelled")
          ?.filter((e) => e?.status !== "draft")
          .map((e) => ({
            ...e,
            waiter: order?.expand?.waiter,
          }));
      })
      .flat()
      .filter((e) => e)
      .filter((e) => e?.status !== "cancelled")
      .filter((e) => e?.status !== "draft")
      .map((e) => {
        return {
          ...e,
          waiter: e?.waiter,
        };
      });

    const grouped_items_by_waiter = waiters_items_sales.reduce((acc, item) => {
      if (!acc[item.waiter.id]) {
        acc[item.waiter.id] = [];
      }
      acc[item.waiter.id].push(item);
      return acc;
    }, {});

    const array_of_single_items_by_waiter = Object.keys(
      grouped_items_by_waiter
    ).map((key) => {
      const grouped_items_by_menu = grouped_items_by_waiter[key].reduce(
        (acc, item) => {
          if (!acc[item.menu]) {
            acc[item.menu] = [];
          }
          acc[item.menu].push(item);
          return acc;
        },
        {}
      );

      const array_of_single_items_by_waiter = Object.keys(
        grouped_items_by_menu
      ).map((key) => {
        return {
          menu: grouped_items_by_menu[key][0]?.expand?.menu,
          total_quantity: grouped_items_by_menu[key].reduce(
            (a, b) => a + b.quantity,
            0
          ),
          total_amount: grouped_items_by_menu[key].reduce(
            (a, b) => a + b.amount,
            0
          ),
          orders_count: 3,
          percentage: (
            (grouped_items_by_menu[key].reduce(
              (a, b) => a + (b.amount || 0),
              0
            ) /
              items.reduce((a, b) => a + (b.amount || 0), 0)) *
            100
          ).toFixed(2),
        };
      });

      return {
        waiter: grouped_items_by_waiter[key][0].waiter,
        total_quantity: grouped_items_by_waiter[key].reduce(
          (a, b) => a + b.quantity,
          0
        ),
        total_amount: grouped_items_by_waiter[key].reduce(
          (a, b) => a + b.amount,
          0
        ),
        items: array_of_single_items_by_waiter,
        orders: orders.filter((e) => e?.expand?.waiter?.id === key),
        ordersCount: orders.filter((e) => e?.expand?.waiter?.id === key).length,
        percentage: (
          (grouped_items_by_waiter[key].reduce(
            (a, b) => a + (b.amount || 0),
            0
          ) /
            items.reduce((a, b) => a + (b.amount || 0), 0)) *
          100
        ).toFixed(2),
      };
    });

    const payment_methods = await pocketbase
      .collection("payment_methods")
      .getFullList();

    const bills = orders
      .map((order) => order?.expand?.bills)
      .flat()
      .map(formatBill);

    const transactions = bills
      .map((bill) => bill?.expand?.transactions)
      .flat()
      .filter((e) => e);

    const total_sales = items.reduce((a, b) => a + (b.amount || 0), 0);

    const total_transactions = transactions.reduce((a, b) => a + b.amount, 0);

    const cash_amount = transactions
      .filter((e) => e?.expand?.payment_method?.type === "cash")
      .reduce((a, b) => a + b.amount, 0);

    const amount_owed = total_sales - total_transactions;

    const payment_methods_used = payment_methods.map((e) => {
      return {
        payment_method: { name: e.name },
        amount: transactions
          .filter((i) => i.payment_method === e.id)
          .reduce((a, b) => a + b.amount, 0),
      };
    });

    const ongoing_orders = orders.filter((e) => e?.status === "on going");

    const completed_orders = orders.filter((e) => e?.status === "completed");

    const cancelled_orders = orders.filter((e) => e?.status === "canceled");

    return {
      payment_methods: payment_methods_used,
      amount_owed,
      cash_amount,
      gross_sales: total_sales,
      closed_bills: bills.filter((e) => e.payment_status === "paid").length,
      pending_bills: bills.filter((e) => e.payment_status === "pending").length,
      completed_orders: completed_orders.length,
      cancelled_orders: cancelled_orders?.length,
      all_bills: bills.length,
      orders_count: orders.length,
      closing_notes: workPeriod?.closing_notes,
      date: workPeriod?.created,
      work_shifts: work_shifts.length,
      sold_items: array_of_single_items,
      sold_items_by_waiter: array_of_single_items_by_waiter,
      sold_categories: array_of_single_items_by_category,
      ongoing_orders: ongoing_orders?.length || 0,
      duration: formatSeconds(
        differenceInSeconds(
          workPeriod.ended_at ? new Date(workPeriod.ended_at) : new Date(),
          new Date(workPeriod.started_at)
        )
      ),
    };
  };

  const { data } = useQuery(
    ["work_period_report", workPeriod?.id],
    getWorkPeriodReport,
    {
      enabled: Boolean(workPeriod?.id),
      retry: false,
    }
  );

  const { canPerform } = useRoles();

  const report_status = useMemo(
    () =>
      [
        {
          name: "period_time",
          title: "Period Time",
          value: data ? data?.duration : "---",
        },
        canPerform?.("view_work_period_total_sales")
          ? {
              name: "gross_sales_amount",
              title: "Total Sales Amount",
              value: data
                ? Number(data?.gross_sales).toLocaleString() + " FRW"
                : "---",
            }
          : undefined,

        {
          name: "total_orders",
          title: "Total Orders",
          value: data ? Number(data?.orders_count) : "---",
        },

        {
          name: "pending_orders",
          title: "Pending Orders",
          value: data ? `${data?.ongoing_orders}` : "---",
        },
        {
          name: "completed_orders",
          title: "Completed Orders",
          value: data ? `${data?.completed_orders}` : "---",
        },
        {
          name: "cancelled_orders",
          title: "cancelled Orders",
          value: data ? `${data?.cancelled_orders}` : "---",
        },
        {
          name: "shifts",
          title: "Work Shifts",
          value: data ? data?.work_shifts : "---",
        },
        {
          name: "date",
          title: "Created At",
          value: data ? new Date(data?.date).toLocaleString("en-US") : "---",
        },
      ].filter((e) => e),
    [data]
  );
  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Work Period Details
            </h2>
            <BreadCrumb
              items={[
                {
                  title: "Work Periods",
                  link: `/dashboard/reports/work-periods`,
                },
                { title: "Details", link: "/dashboard" },
              ]}
            />
          </div>

          <Button
            variant="destructive"
            onClick={() => confirmModal.setisOpen(true)}
            size="sm"
            disabled={work_period?.ended_at || !work_period}
          >
            <XCircle size={16} className="mr-2" />
            <span>Run close of day.</span>
          </Button>
        </div>
        <Card className="rounded-[4px] px-4 pt-2 mb-3 shadow-none">
          <div className="border-b-  border-dashed">
            <h4>
              <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                Work Period Summary
              </span>
            </h4>
            <div className="grid gap-4  pb-3 grid-cols-2 md:grid-cols-5">
              {report_status.map((status, i) => (
                <div key={i}>
                  <h1 className="px-2- py-1 text-base sm:text-[17px] font-semibold">
                    {status.value || "---"}
                  </h1>
                  <div className="px-2- py-1 text-sm text-slate-500">
                    {status.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <div className="border border-slate-200 bg-white rounded-[4px] overflow-hidden">
          <div className="w-full bg-white  border-b ">
            <div className="flex px-2 w-fit bg-white items-center justify-around">
              {[
                {
                  title: "work shifts",
                  link: `${base}/${workPeriodId}/shifts`,
                },
                {
                  title: "Payments & Transactions",
                  link: `${base}/${workPeriodId}/transactions`,
                },
                {
                  title: "Orders",
                  link: `${base}/${workPeriodId}/orders`,
                },
                {
                  title: "general report",
                  link: `${base}/${workPeriodId}/general-report`,
                },
              ].map((e, i) => {
                // get is active where also the nested route is active by splitting the pathname
                const base = pathname.split("/").slice(0, 6).join("/");

                const isActive = base === e.link;
                return (
                  <Link
                    to={e.link}
                    key={i}
                    className={cn(
                      "cursor-pointer px-8 capitalize text-center relative w-full- text-slate-700 text-[12.5px] sm:text-sm py-3  font-medium",
                      {
                        "text-primary ": isActive,
                      }
                    )}
                  >
                    {isActive && (
                      <div className="h-[3px] left-0 rounded-t-md bg-primary absolute bottom-0 w-full"></div>
                    )}
                    <span className=""> {e.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <Outlet context={[work_period, workPeriodId, data]} />
        </div>
      </div>
      <ConfirmModal
        title={"Are you sure you want to end this work period?"}
        description={`This action is irreversible and will end the work period. `}
        // meta={confirmModal.meta}
        onConfirm={() => endWorkPeriodMutation.mutate()}
        error={endShiftError}
        isLoading={endWorkPeriodMutation.isLoading}
        open={confirmModal.isOpen}
        onClose={() => {
          confirmModal.close();
          setendShiftError(null);
        }}
      />
    </>
  );
}

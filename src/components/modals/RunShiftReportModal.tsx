import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { AlertCircleIcon, Printer } from "lucide-react";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import Loader from "../icons/Loader";
import { useQuery } from "react-query";
import pocketbase from "@/lib/pocketbase";
import { differenceInSeconds } from "date-fns";
import formatBill from "@/utils/formatBill";
import { useEffect, useMemo, useRef, useState } from "react";
import formatSeconds from "@/utils/formatSeconds";
import { ScrollArea } from "../ui/scroll-area";

export function RunShiftReportModal({
  open,
  setOpen,
  shift: current,
  readOnly,
  isClockingOut,
  clockOut,
}: any) {
  const getShiftReport = async () => {
    const orders = await pocketbase.collection("orders").getFullList({
      filter: `work_shift="${current?.id}"`,
      expand:
        "bills,bills.items,bills.transactions,bills.credits,bills.credits.customer,bills.transactions.payment_method,items",
    });

    const bills = orders
      .map((order) => order?.expand?.bills)
      .flat()
      .map(formatBill);

    const transactions = bills
      .map((bill) => bill?.expand?.transactions)
      .flat()
      .filter((e) => e);

    // flat order items inside orders not in bills
    const flat_order_items = orders
      .map((order) =>
        (order?.expand?.items || [])
          ?.filter((e) => e)
          .filter((e) => e.status !== "draft")
          .filter((e) => e.status !== "cancelled")
      )
      .flat()
      .filter((e) => e);

    const total_sales = flat_order_items.reduce((a, b) => a + b?.amount, 0);

    const total_transactions = transactions.reduce((a, b) => a + b.amount, 0);

    const cash_amount = transactions
      .filter((e) => e?.expand?.payment_method?.type === "cash")
      .reduce((a, b) => a + b.amount, 0);

    const all_transactions = transactions.reduce(
      (a, b) => a + (b?.amount || 0),
      0
    );

    const amount_owed = total_sales - total_transactions;

    const all_payment_methods = await pocketbase
      .collection("payment_methods")
      .getFullList();

    const all_payment_methods_with_amount = all_payment_methods.map((e) => {
      return {
        type: "payment_method",
        amount: transactions
          .filter((i) => i.payment_method === e?.id)
          .reduce((a, b) => a + b.amount, 0),
        payment_method: e,
      };
    });

    const net_sales_amount = all_transactions;

    const ongoing_orders = orders.filter((e) => e.status === "on going");
    const completed_orders = orders.filter((e) => e.status === "completed");
    const canceled_orders = orders.filter((e) => e.status === "canceled");

    console.log(current);
    return {
      payment_methods: all_payment_methods_with_amount,
      amount_owed,
      cash_amount,
      canceled_orders,
      completed_orders,
      gross_sales: total_sales,
      work_period_date: current?.expand?.work_period?.created,
      all_bills: bills.length,
      orders_count: orders.length,
      closing_notes: current?.closing_notes || "N.A",
      ongoing_orders: ongoing_orders,
      net_sales_amount,
      duration: formatSeconds(
        differenceInSeconds(
          current.ended_at ? new Date(current.ended_at) : new Date(),
          new Date(current.started_at)
        )
      ),
    };
  };

  const { data } = useQuery(["shift_reports", current?.id], getShiftReport, {
    enabled: Boolean(current?.id) && open,
  });

  const report_status = useMemo(
    () => [
      {
        name: "shift_time",
        title: "Shift Time",
        value: data ? data?.duration || "---" : "---",
      },
      {
        name: "gross_sales_amount",
        title: "Gross Sales Amount",
        value: data
          ? Number(data?.gross_sales).toLocaleString() + " FRW"
          : "---",
      },

      {
        name: "total_orders",
        title: "Total Orders",
        value: data ? Number(data?.orders_count) : "---",
      },
      {
        name: "completed_orders",
        title: "Completed Orders",
        value: data
          ? Number(data?.completed_orders?.length).toLocaleString()
          : "---",
      },
      {
        name: "ongoing_orders",
        title: "Ongoing Orders",
        value: data ? data?.ongoing_orders?.length : "---",
      },
      {
        name: "canceled_orders",
        title: "Canceled Orders",
        value: data ? data?.canceled_orders?.length : "---",
      },
      {
        name: "date",
        title: "Date",
        value: data
          ? new Date(data?.work_period_date).toLocaleString("en-US", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            })
          : "---",
      },
    ],
    [data]
  );

  const [closing_notes, setclosing_notes] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!isMobile && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[750px] gap-0 h-dvh md:h-fit !p-0 flex flex-col">
        <DialogHeader className="!py-3 pb-0 !text-left">
          <DialogTitle>
            <span className="text-[14px] px-3 font-semibold py-5">
              Shift Report -{" "}
              {new Date(current?.started_at).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                minute: "numeric",
                hour: "numeric",
              })}{" "}
              -{" "}
              {new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "numeric",
              })}
            </span>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="w-full scroller border-t border-t-slate-200 max-h-[500px]- flex-1 whitespace-nowrap">
          {data?.ongoing_orders?.length ? (
            <div className="px-2 pt-2">
              <Alert
                variant="destructive"
                className="py-2 rounded-[4px] flex items-center"
              >
                <AlertCircleIcon className="h-4 -mt-[5px] mr-3 w-4" />
                <AlertTitle className="text-[13.5px] font-medium fon !m-0">
                  You still have on going orders, please complete them.
                </AlertTitle>
              </Alert>
            </div>
          ) : (
            ""
          )}
          <div className="px-3 pb-3 h-full flex-1">
            <div className="border-b  border-dashed">
              <h4>
                <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                  Shift Summary
                </span>
              </h4>
              <div className="grid gap-4  pb-3 grid-cols-2 sm:grid-cols-4">
                {report_status.map((status, i) => (
                  <div key={i}>
                    <h1 className="px-2- py-1 text-base sm:text-[17px] font-semibold">
                      {status.value}
                    </h1>
                    <div className="px-2- py-1 text-sm text-slate-500">
                      {status.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2 border-b border-dashed  pb-4">
              <h4>
                <span className="py-2 uppercase text-[12px] font-medium text-slate-500">
                  Payment Methods
                </span>
              </h4>
              <div className="grid px-2- pt-3 grid-cols-2 gap-x-6 gap-y-3">
                {data?.payment_methods?.map((method, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className=" text-[13px] text-slate-600">
                      {
                        // @ts-ignore
                        method?.payment_method?.name || method?.customer?.name
                      }
                    </span>
                    <p>
                      <span className="font-semibold text-[13px]">
                        {method.amount.toLocaleString()} FRW
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {!readOnly ? (
              <div>
                <div className="px-2- mt-3">
                  <Label className="text-[13px] mb-2 block text-slate-500">
                    Closing Note (Optional)
                  </Label>
                  <Textarea
                    ref={textareaRef}
                    onChange={(e) => setclosing_notes(e.target?.value)}
                    value={closing_notes}
                    className="w-full"
                    placeholder="Add closing note."
                  />
                </div>
              </div>
            ) : (
              <div>
                <div className="px-2- mt-3">
                  <Label className="text-[13px] mb-2 block text-slate-500">
                    Closing Note (Optional)
                  </Label>
                  {
                    <div className="px-2- py-1 text-sm text-slate-500">
                      {data?.closing_notes}
                    </div>
                  }
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {!readOnly && (
          <DialogFooter className="w-full">
            <div className="mt-3- border-t w-full flex items-center gap-2 px-2 py-2">
              <Button
                onClick={() => window.print()}
                className="w-full text-slate-600"
                size="sm"
                type="button"
                variant="outline"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print report
              </Button>
              <Button
                disabled={
                  isClockingOut || !data || data?.ongoing_orders?.length
                }
                onClick={() =>
                  clockOut({ closing_notes }).then(() => setOpen(false))
                }
                type="submit"
                className="w-full"
                size="sm"
              >
                {isClockingOut && (
                  <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                )}
                Run report & close shift
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

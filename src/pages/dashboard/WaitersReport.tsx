import CalendarDateRangePicker from "@/components/CalendarDateRangePicker";
import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import pocketbase from "@/lib/pocketbase";
import { cn } from "@/utils";
import getDaf from "@/utils/getDaf";
import { addDays } from "date-fns";
import { useState } from "react";
import { ChevronDown } from "react-feather";
import { useQuery } from "react-query";
import { utils, write } from "xlsx";
import { saveAs } from "file-saver";

export default function WaitersReport() {
  const [date, setDate] = useState({
    from: new Date(),
    to: new Date(),
  });

  const analyticsQuery = useQuery({
    queryKey: [
      "waiter-sales-report",
      {
        date,
      },
    ],
    queryFn: async () => {
      const waiters = await pocketbase.collection("users").getFullList();

      const work_periods = await pocketbase
        .collection("work_periods")
        .getFullList({
          filter: getDaf(date),
        });

      const waiter_sales = !work_periods.length
        ? []
        : await pocketbase.collection("order_items").getFullList({
            filter: [
              work_periods
                .map((e) => `order.work_period="${e?.id}"`)
                .join(" || "),
            ].join(" && "),
            expand: "order.waiter",
          });

      const waiter_sales_grouped = waiter_sales
        .filter((e) => e.status !== "cancelled")
        .filter((e) => e.status !== "draft")
        .reduce((acc, item) => {
          const waiter = item?.expand?.order?.expand?.waiter;
          if (!acc[waiter?.id]) {
            acc[waiter?.id] = {
              name: waiter?.name,
              count: 0,
              amount: 0,
              id: waiter?.id,
            };
          }
          acc[waiter?.id].count += 1;
          acc[waiter?.id].amount += Number(item?.amount);
          return acc;
        }, {});

      const all_waiters_with_sales = waiters.map((waiter) => {
        return {
          name: waiter.name,
          id: waiter.id,
          count: waiter_sales_grouped[waiter.id]?.count || 0,
          amount: waiter_sales_grouped[waiter.id]?.amount || 0,
        };
      });

      return all_waiters_with_sales;
    },
    enabled: true,
  });

  const presets = [
    {
      label: "Today",
      value: {
        from: new Date(),
        to: new Date(),
      },
    },
    {
      label: "Yesterday",
      value: {
        from: addDays(new Date(), -1),
        to: addDays(new Date(), -1),
      },
    },
    {
      label: "Last 7 days",
      value: {
        from: addDays(new Date(), -7),
        to: new Date(),
      },
    },
    {
      label: "Last 30 days",
      value: {
        from: addDays(new Date(), -30),
        to: new Date(),
      },
    },
    {
      label: "This month",
      value: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
      },
    },
    {
      label: "Last month",
      value: {
        from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      },
    },
  ];

  const total_sales = analyticsQuery?.data?.reduce((acc: any, item: any) => {
    acc += item.amount;
    return acc;
  }, 0);

  const total_count = analyticsQuery?.data?.reduce((acc: any, item: any) => {
    acc += item.count;
    return acc;
  }, 0);

  console.log(total_sales);

  const activePreset = presets.find((e) => {
    return (
      e.value.from.toDateString() === date.from.toDateString() &&
      e.value.to?.toDateString() === date.to?.toDateString()
    );
  });

  const data_sorted = analyticsQuery?.data?.sort((a: any, b: any) => {
    return b.amount - a.amount;
  });

  const handleExelExport = () => {
    var table = document.getElementById("waiter-sales-report");
    var wb = utils.table_to_book(table, { sheet: "Sheet JS" });
    var wbout = write(wb, {
      bookType: "xlsx",
      bookSST: true,
      type: "binary",
    });

    function s2ab(s) {
      var buf = new ArrayBuffer(s.length);
      var view = new Uint8Array(buf);
      for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    }

    const name = `export-${new Date().toISOString()}.xlsx`;

    saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), name);
  };

  return (
    <div className="sm:px-4 px-2">
      <div className="flex flex-col sm:flex-row sm:gap-0 sm:items-center gap-3 items-start justify-between space-y-2 mb-3">
        <div className="flex items-start gap-2 flex-col">
          <h2 className="text-base font-semibold tracking-tight">
            Waiter sales Reports.
          </h2>
          <BreadCrumb
            items={[{ title: "Waiter sales Reports", link: "/dashboard" }]}
          />
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button className="" variant="outline">
                {activePreset?.label || "Choose date ranges"}
                <ChevronDown size={16} className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {presets.map((preset) => (
                <DropdownMenuItem
                  onClick={() => {
                    setDate(preset.value);
                  }}
                >
                  {preset.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <CalendarDateRangePicker date={date} setDate={setDate} />
        </div>
      </div>
      <div className="mt-3">
        <div>
          <h4 className="text-[15px] mb-3 font-semibold">
            Waiter sales reports.
          </h4>
          <Button
            size="sm"
            className="mr-3 mb-3"
            onClick={() => handleExelExport()}
          >
            Export Exel
          </Button>
        </div>
        <div className="bg-white mt-3">
          <table id="waiter-sales-report" className="w-full border">
            <tr className="text-left text-[11px] bg-slate-50 font-medium uppercase">
              <th className="py-3 border-r border-b px-3">N0</th>
              <th className="py-3 border-r border-b px-3">Name</th>
              <th className="py-3 border-b border-r px-3">Count</th>
              <th className="py-3 border-b border-r  px-3">Total Amount</th>
            </tr>

            {data_sorted
              ?.filter((e) => e.amount)
              ?.map((e: any, i) => (
                <tr key={i}>
                  <td className="py-[12px] px-0 text-center border-r border-b">
                    <span className="text-[13px] font-medium capitalize">
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-[12px] px-3 border-r border-b">
                    <span className="text-[13px] font-medium capitalize">
                      {e.name}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "py-[6px] text-[13px] border-r text-slate-700 px-3 border-b font-medium"
                    )}
                  >
                    {e?.count?.toLocaleString() || "0"}
                  </td>

                  <td
                    className={cn(
                      "py-[6px] text-[13px] border-r text-slate-700 px-3 border-b font-medium"
                    )}
                  >
                    {Number(e?.amount)?.toLocaleString()} FRW
                  </td>
                </tr>
              ))}
            <tr className="bg-green-100">
              <td className="py-[12px] px-3 border-r border-b">
                <span className="text-[13px] font-medium capitalize">
                  Total
                </span>
              </td>
              <td
                className={cn(
                  "py-[6px] text-[13px] font-bold border-r text-primary px-3 border-b"
                )}
              ></td>

              <td
                className={cn(
                  "py-[6px] text-[13px] font-bold border-r text-primary px-3 border-b"
                )}
              >
                {total_count}
              </td>

              <td
                className={cn(
                  "py-[6px] text-[13px] border-r text-primary font-bold px-3 border-b"
                )}
              >
                {total_sales?.toLocaleString()} FRW
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  );
}

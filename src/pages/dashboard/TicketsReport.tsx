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

export default function TicketsReport() {
  const [date, setDate] = useState({
    from: new Date(),
    to: new Date(),
  });

  const analyticsQuery = useQuery({
    queryKey: [
      "tickets-report",
      {
        date,
      },
    ],
    onError: (e) => {
      console.log(e);
    },
    queryFn: async () => {
      const order_stations = await pocketbase
        .collection("order_stations")
        .getFullList();

      const work_periods = await pocketbase
        .collection("work_periods")
        .getFullList({
          filter: getDaf(date),
        });

      const tickets = !work_periods.length
        ? []
        : await pocketbase.collection("order_tickets").getFullList({
            filter: work_periods
              .map((e) => `order.work_period="${e?.id}"`)
              .join(" || "),
            expand: "order_items",
          });

      const order_stations_tickets = order_stations.map((station) => {
        const totalCount = tickets.filter(
          (e) => e?.order_station === station?.id
        ).length;

        const stationTickets = tickets.filter(
          (e) => e?.order_station === station?.id
        );

        const station_tickets_order_items_amount_total = stationTickets
          .filter((e) => e?.expand?.order_items)
          .reduce((acc, ticket) => {
            const ticketAmount = ticket?.expand?.order_items
              ?.filter((e) => e.status !== "cancelled")
              .filter((e) => e.status !== "draft")
              .reduce((acc, item) => {
                return acc + (item?.amount || 0);
              }, 0);
            return acc + ticketAmount;
          }, 0);

        return {
          station: station.name,
          totalCount,
          totalAmount: station_tickets_order_items_amount_total,
        };
      });

      const total_amount = order_stations_tickets.reduce((acc, e) => {
        return acc + e?.totalAmount;
      }, 0);

      const total_count = order_stations_tickets.reduce((acc, e) => {
        return acc + e?.totalCount;
      }, 0);

      return {
        order_stations_tickets,
        total_amount,
        total_count,
      };
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

  const activePreset = presets.find((e) => {
    return (
      e.value.from.toDateString() === date.from.toDateString() &&
      e.value.to?.toDateString() === date.to?.toDateString()
    );
  });
  return (
    <div className="sm:px-4 px-2">
      <div className="flex flex-col sm:flex-row sm:gap-0 sm:items-center gap-3 items-start justify-between space-y-2 mb-3">
        <div className="flex items-start gap-2 flex-col">
          <h2 className="text-base font-semibold tracking-tight">
            Tickets Report
          </h2>
          <BreadCrumb
            items={[{ title: "Tickets Report", link: "/dashboard" }]}
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
          <h4 className="text-[15px] font-semibold">
            Tickets by order station
          </h4>
        </div>
        <div className="bg-white mt-3">
          <table className="w-full border">
            <tr className="text-left text-[11px] bg-slate-50 font-medium uppercase">
              <th className="py-3 border-r border-b px-3">Menu Item</th>
              <th className="py-3 border-b border-r px-3">Total Count</th>
              <th className="py-3 border-b px-3">Total Amount</th>
            </tr>

            {analyticsQuery?.data?.order_stations_tickets?.map((e: any) => (
              <tr>
                <td className="py-[12px] px-3 border-r border-b">
                  <span className="text-[13px] font-medium">{e?.station}</span>
                </td>
                <td
                  className={cn(
                    "py-[6px] text-[13px] border-r text-slate-700 px-3 border-b font-medium"
                  )}
                >
                  {e?.totalCount}
                </td>
                <td
                  className={cn(
                    "py-[6px] text-[13px] text-slate-700 px-3 border-b font-medium"
                  )}
                >
                  {e?.totalAmount?.toLocaleString()} FRW
                </td>
              </tr>
            ))}

            <tr>
              <td className="py-[12px] px-3 border-r border-b">
                <span className="text-[13px] font-medium">Total</span>
              </td>
              <td
                className={cn(
                  "py-[6px] text-[13px] border-r text-green-500 px-3 border-b font-bold"
                )}
              >
                {analyticsQuery?.data?.total_count}
              </td>
              <td
                className={cn(
                  "py-[6px] text-[13px] text-green-500 px-3 border-b font-bold"
                )}
              >
                {analyticsQuery?.data?.total_amount?.toLocaleString()} FRW
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  );
}

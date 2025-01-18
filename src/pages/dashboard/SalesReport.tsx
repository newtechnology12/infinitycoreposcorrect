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

export default function SalesReport() {
  const [date, setDate] = useState({
    from: new Date(),
    to: new Date(),
  });

  const analyticsQuery = useQuery({
    queryKey: [
      "expenses-report",
      {
        date,
      },
    ],
    queryFn: async () => {
      const categories = await pocketbase.collection("categories").getFullList({
        filter: `parent!=""`,
      });

      const work_periods = await pocketbase
        .collection("work_periods")
        .getFullList({
          filter: getDaf(date),
        });

      const orders = !work_periods.length
        ? []
        : await pocketbase.collection("orders").getFullList({
            filter: work_periods
              .map((e) => `work_period="${e?.id}"`)
              .join(" || "),
            expand: "items,items.menu",
          });

      const order_items = orders
        .flatMap((order) => order?.expand?.items)
        .filter((e) => e)
        .filter((e) => e?.status !== "cancelled")
        .filter((e) => e?.status !== "draft");

      const categories_sales_with_items = categories.map((category) => {
        const items = order_items.filter(
          (e) => e?.expand?.menu?.subCategory === category?.id
        );

        const totalAmount = items.reduce((acc, e) => acc + e.amount, 0);

        const newItems = items
          .map((e) => ({
            name:
              e?.expand?.menu?.name +
              (e?.variant?.name ? ` (${e?.variant?.name})` : ""),
            slug: e?.expand?.menu?.name + "_" + (e?.variant?.name || ""),
            id: e?.id,
            count: e.quantity,
            totalAmount: e.amount,
          }))
          .reduce((acc, item) => {
            let existingItem = acc.find((el) => el?.slug === item?.slug);
            if (existingItem) {
              existingItem.count += item.count;
              existingItem.totalAmount += item.totalAmount;
            } else {
              acc.push({ ...item });
            }
            return acc;
          }, []);

        return {
          items: newItems,
          name: category?.name,
          count: items.reduce((acc, e) => acc + e.quantity, 0),
          totalAmount: totalAmount,
        };
      });

      const total_sales = order_items.reduce((acc, e) => acc + e?.amount, 0);

      return {
        categories_sales_with_items: categories_sales_with_items.filter(
          (e) => e?.count
        ),
        total_sales,
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
            Sales Report
          </h2>
          <BreadCrumb items={[{ title: "Sales Report", link: "/dashboard" }]} />
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

      <div className="mt-6 font-bold flex items-center gap-2">
        <span>Total:</span>
        <span className="text-primary">
          {analyticsQuery?.data?.total_sales.toLocaleString()} FRW
        </span>
      </div>

      {analyticsQuery?.data?.categories_sales_with_items?.map((e) => {
        return (
          <div className="mt-6">
            <div>
              <h4 className="text-[15px] capitalize font-semibold">{e.name}</h4>
            </div>
            <div className="bg-white mt-3">
              <table className="w-full border">
                <tr className="text-left text-[11px] bg-slate-50 font-medium uppercase">
                  <th className="py-3 border-r border-b px-3">Name</th>
                  <th className="py-3 border-r border-b px-3">Count</th>
                  <th className="py-3 border-b px-3">Total Amount</th>
                </tr>

                {e?.items?.map((e: any) => (
                  <tr>
                    <td className="py-[12px] px-3 border-r border-b">
                      <span className="text-[13px] capitalize font-medium">
                        {e.name}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "py-[6px] text-[13px] border-r  text-slate-700 px-3 border-b font-medium",
                        {
                          "text-green-500 font-semibold": e.isMain,
                        }
                      )}
                    >
                      {e?.count?.toLocaleString()}
                    </td>
                    <td
                      className={cn(
                        "py-[6px] text-[13px] text-slate-700 px-3 border-b font-medium",
                        {
                          "text-green-500 font-semibold": e.isMain,
                        }
                      )}
                    >
                      {e?.totalAmount?.toLocaleString()} FRW
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-[12px] px-3 border-r border-b">
                    <span className="text-[13px] capitalize font-semibold">
                      Total
                    </span>
                  </td>
                  <td
                    className={cn(
                      "py-[6px] text-[13px] border-r text-green-500 font-semibold px-3 border-b"
                    )}
                  >
                    {e?.count?.toLocaleString()}
                  </td>
                  <td
                    className={cn(
                      "py-[6px] text-[13px] text-green-500 font-semibold px-3 border-b"
                    )}
                  >
                    {e?.totalAmount?.toLocaleString()} FRW
                  </td>
                </tr>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

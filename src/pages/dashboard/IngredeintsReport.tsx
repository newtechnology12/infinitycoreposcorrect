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

export default function IngredeintsReport() {
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
      const ingredeints = await pocketbase.collection("raw_items").getFullList({
        expand: "unit",
      });

      const ingredeint_adjustments = await pocketbase
        .collection("adjustments")
        .getFullList({
          filter: [
            getDaf(date),
            'stock_item.ingredient!=""',
            'type="reduction"',
            'reason="sale"',
          ].join(" && "),
          expand: "stock_item.ingredient,expand",
        });

      const ingredeint_adjustments_grouped = ingredeint_adjustments.reduce(
        (acc, item) => {
          const ingredient = item?.expand?.stock_item?.expand?.ingredient;
          if (!acc[ingredient?.id]) {
            acc[ingredient?.id] = {
              name: ingredient?.name,
              unit: ingredient?.expand?.unit?.name,
              cost: Number(ingredient?.cost),
              count: 0,
              totalAmount: 0,
              id: ingredient?.id,
            };
          }

          acc[ingredient?.id].count += 1;
          acc[ingredient?.id].totalAmount +=
            item?.quantity_adjusted * Number(ingredient?.cost);

          return acc;
        },
        {}
      );

      return {
        ingredeints_usages: ingredeints.map((ingredient) => {
          return {
            ...ingredient,
            ...ingredeint_adjustments_grouped[ingredient?.id],
          };
        }),
      };
    },
    enabled: true,
  });

  console.log(analyticsQuery?.data);

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
            Ingredients Report
          </h2>
          <BreadCrumb
            items={[{ title: "Ingredients Report", link: "/dashboard" }]}
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
            Ingredients Usage Report
          </h4>
        </div>
        <div className="bg-white mt-3">
          <table className="w-full border">
            <tr className="text-left text-[11px] bg-slate-50 font-medium uppercase">
              <th className="py-3 border-r border-b px-3">Name</th>
              <th className="py-3 border-b border-r px-3">Usage Count</th>
              <th className="py-3 border-b border-r  px-3">Unit</th>
              <th className="py-3 border-b border-r px-3">Cost</th>
              <th className="py-3 border-b border-r px-3">Total Cost</th>
            </tr>

            {analyticsQuery?.data?.ingredeints_usages?.map((e: any) => (
              <tr>
                <td className="py-[12px] px-3 border-r border-b">
                  <span className="text-[13px] font-medium">{e.name}</span>
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
                    "py-[6px] text-[13px] uppercase border-r text-slate-700 px-3 border-b font-medium"
                  )}
                >
                  {e?.expand?.unit?.name || "N/A"}
                </td>
                <td
                  className={cn(
                    "py-[6px] text-[13px] border-r text-slate-700 px-3 border-b font-medium"
                  )}
                >
                  {Number(e?.cost)?.toLocaleString()} FRW
                </td>
                <td
                  className={cn(
                    "py-[6px] text-[13px] border-r text-slate-700 px-3 border-b font-medium"
                  )}
                >
                  {e?.totalAmount?.toLocaleString() || 0} FRW
                </td>
              </tr>
            ))}
          </table>
        </div>
      </div>
    </div>
  );
}

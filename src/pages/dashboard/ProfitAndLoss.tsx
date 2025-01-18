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
import { addDays } from "date-fns";
import { useState } from "react";
import { ChevronDown } from "react-feather";
import { useQuery } from "react-query";
import getDaf from "@/utils/getDaf";

export default function ProfitAndLoss() {
  const [date, setDate] = useState({
    from: new Date(),
    to: new Date(),
  });

  const analyticsQuery = useQuery({
    queryKey: [
      "profit-loss",
      {
        date,
      },
    ],
    queryFn: async () => {
      const cashier_reports = await pocketbase
        .collection("work_shift_reports")
        .getFullList({
          filter: getDaf(date),
          expand: "activity",
        });

      const expenses = await pocketbase.collection("expenses").getFullList({
        filter: getDaf(date),
      });

      const purchases = await pocketbase.collection("purchases").getFullList({
        filter: getDaf(date),
      });

      const total_purchases = purchases.reduce((a, b) => a + b?.total, 0);

      const pending_credits = await pocketbase
        .collection("credits")
        .getFullList({
          filter: `status="pending" || status="partially_paid"`,
          expand: "transactions",
        });

      const credit_with_balance = pending_credits.map((credit) => {
        const total_paid =
          credit?.expand?.transactions.reduce(
            (a, b) => a + Number(b?.amount || 0),
            0
          ) || 0;

        return {
          ...credit,
          balance: credit?.amount - total_paid,
        };
      });

      const flatted_allowances = cashier_reports
        .flatMap((e) => e?.allowances)
        .filter((e) => e);

      const total_allowances = flatted_allowances.reduce(
        (a, b) => a + Number(b?.amount || 0),
        0
      );

      const total_credits = credit_with_balance.reduce(
        (a, b) => a + (b?.balance || 0),
        0
      );

      const total_sales = cashier_reports
        .filter((e) =>
          e?.expand?.activity
            ? e?.expand?.activity?.track_as_sale
              ? true
              : false
            : true
        )
        .reduce((a, b) => a + b?.gross_amount, 0);

      const total_expenses = expenses.reduce((a, b) => a + b?.amount, 0);

      const income =
        total_sales -
        (total_purchases + total_expenses + total_allowances + total_credits);

      return {
        expenses: total_expenses,
        total_sales: total_sales,
        total_purchases: total_purchases,
        total_allowances,
        total_credits,
        income,
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
            Profit & Loss
          </h2>
          <BreadCrumb
            items={[{ title: "Profit & Loss", link: "/dashboard" }]}
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
      <div className="mt-2">
        <div>
          <h4 className="text-[15px] font-semibold">
            Profit Reports By Orders
          </h4>
        </div>
        <div className="bg-white mt-3">
          <table className="w-full border">
            <tr className="text-left text-[11px] bg-slate-50 font-medium uppercase">
              <th className="py-3 border-r border-b px-3">Particulars</th>
              <th className="py-3 border-b px-3">Amount</th>
            </tr>

            {[
              {
                particulars: "Sales (+)",
                amount: analyticsQuery?.data
                  ? analyticsQuery?.data.total_sales?.toLocaleString() + "  FRW"
                  : "---",
              },
              {
                particulars: "Purchases (-)",
                amount: analyticsQuery?.data
                  ? analyticsQuery?.data.total_purchases.toLocaleString() +
                    "  FRW"
                  : "---",
              },

              {
                particulars: "Expenses (-)",
                amount: analyticsQuery?.data
                  ? analyticsQuery?.data?.expenses.toLocaleString() + "  FRW"
                  : "---",
              },
              {
                particulars: "Allowances (-)",
                amount: analyticsQuery?.data
                  ? analyticsQuery?.data?.total_allowances.toLocaleString() +
                    "  FRW"
                  : "---",
              },
              {
                particulars: "Credits (-)",
                amount: analyticsQuery?.data
                  ? analyticsQuery?.data?.total_credits.toLocaleString() +
                    "  FRW"
                  : "---",
              },
              {
                particulars: "Net Total Profit",
                amount: analyticsQuery?.data
                  ? analyticsQuery?.data?.income.toLocaleString() + "  FRW"
                  : "---",
                isMain: true,
              },
            ].map((e: any) => (
              <tr>
                <td className="py-[12px] px-3 border-r border-b">
                  <span className="text-[13px] font-medium">
                    {e.particulars}
                  </span>
                </td>
                <td
                  className={cn(
                    "py-[6px] text-[13px] text-slate-700 px-3 border-b font-medium",
                    {
                      "text-green-500 font-semibold": e.isMain,
                    }
                  )}
                >
                  {e?.amount?.toLocaleString()}
                </td>
              </tr>
            ))}
          </table>
        </div>
      </div>
    </div>
  );
}

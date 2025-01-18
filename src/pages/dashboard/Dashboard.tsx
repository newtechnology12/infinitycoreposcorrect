import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import * as React from "react";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import BreadCrumb from "@/components/breadcrumb";
import RecentOrders from "@/components/RecentOrders";
import { useQuery } from "react-query";
import pocketbase from "@/lib/pocketbase";
import Loader from "@/components/icons/Loader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import getFileUrl from "@/utils/getFileUrl";
import CalendarDateRangePicker from "@/components/CalendarDateRangePicker";
import {
  formatDateToEndOfDay,
  formatDateToStartOfDay,
} from "@/utils/timeFormaters";
import getDaf from "@/utils/getDaf";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useworkShift } from "@/context/workShift.context";

export default function Dashboard() {
  const popularMenusQuery = useQuery({
    queryKey: ["popular-menus"],
    queryFn: () => {
      return pocketbase
        .collection("popular_menus")
        .getList(1, 7)
        .then((e) => e.items);
    },
    enabled: true,
  });

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(formatDateToStartOfDay(new Date())),
    to: new Date(formatDateToEndOfDay(new Date())),
  });

  const { work_period } = useworkShift();

  React.useEffect(() => {
    if (work_period?.id) {
      setDate({
        from: new Date(formatDateToStartOfDay(new Date(work_period?.created))),
        to: new Date(formatDateToEndOfDay(new Date(work_period?.created))),
      });
    }
  }, [work_period]);

  const analyticsQuery = useQuery({
    queryKey: [
      "analytics",
      {
        date,
      },
    ],
    queryFn: async () => {
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
            expand: "items",
          });

      const expenses = await pocketbase.collection("expenses").getFullList({
        filter: getDaf(date),
      });

      const users = (
        await pocketbase.collection("users").getList(1, 1, {
          filter: `status="active"`,
        })
      ).totalItems;

      const items = orders
        .map((order) => order?.expand?.items)
        .flat()
        .filter((e) => e)
        .filter((e) => e?.status !== "cancelled")
        .filter((e) => e?.status !== "draft")
        .filter(Boolean);

      const total_sales = items.reduce((a, b) => a + b?.amount, 0);

      const total_expenses = expenses.reduce((a, b) => a + b?.amount, 0);

      return {
        expenses: total_expenses,
        total_revenue: total_sales,
        orders: orders.length,
        total_users: users,
      };
    },
    enabled: true,
  });

  const [cycle, setcycle] = React.useState("year");

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
    <>
      <div className="flex-1 space-y-4 p-2 sm:px-3 pt-0">
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-0 items-start sm:items-center sm:justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Dashboard Overview
            </h2>
            <BreadCrumb
              items={[{ title: "Overview Analytics", link: "/dashboard" }]}
            />
          </div>
          <div className="flex items-center space-x-2">
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

        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-[3px] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
              <CardTitle className="text-[14.5px] font-medium">
                Total Revenue
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent className=" p-3">
              <div className="text-xl font-semibold mb-3">
                {analyticsQuery?.data?.total_revenue?.toLocaleString() ||
                  (analyticsQuery.status === "loading" ? "---" : 0)}{" "}
                {analyticsQuery.status === "success" && "FRW"}
              </div>
              <p className="text-sm text-slate-500 capitalize">
                All the revenue generated
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[3px] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2  p-3">
              <CardTitle className="text-[14.5px] font-medium">
                Total Orders
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent className=" p-3">
              <div className="text-xl font-semibold mb-3">
                {analyticsQuery?.data?.orders?.toLocaleString() ||
                  (analyticsQuery.status === "loading" ? "---" : 0)}
              </div>
              <p className="text-sm text-slate-500 capitalize">
                All orders placed
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[3px] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2  p-3">
              <CardTitle className="text-[14.5px] font-medium">
                Total Expenses
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </CardHeader>
            <CardContent className=" p-3">
              <div className="text-xl font-semibold mb-3">
                {analyticsQuery?.data?.expenses?.toLocaleString() ||
                  (analyticsQuery.status === "loading" ? "---" : 0)}
                {analyticsQuery.status === "success" && " FRW"}
              </div>
              <p className="text-sm text-slate-500 capitalize">
                All total expenses
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-[3px] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2  p-3">
              <CardTitle className="text-[14.5px] font-medium">
                Total Staff
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent className=" p-3">
              <div className="text-xl font-semibold mb-3">
                {analyticsQuery?.data?.total_users?.toLocaleString() ||
                  (analyticsQuery.status === "loading" ? "---" : 0)}
              </div>
              <p className="text-sm text-slate-500 capitalize">Total staff</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-y-4 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 shadow-none rounded-[3px]">
            <CardHeader className="p-3 pt-[10px] px-4">
              <div className="flex mb-5 items-center justify-between ">
                <CardTitle className="mb-5-">
                  <span className="text-[17px]">Revenue History Overview</span>
                </CardTitle>
                <Select value={cycle} onValueChange={(e) => setcycle(e)}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Select a cycle" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectGroup>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 pr-2">
              <Overview cycle={cycle} />
            </CardContent>
          </Card>
          <Card className="col-span-3 shadow-none rounded-[3px]">
            <CardHeader className="p-3 border-b- pt-[8px] px-4">
              <CardTitle className="mb-0">
                <span className="text-[15px]">Top selling Menus</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-0 px-0 pr-0">
              {popularMenusQuery.status === "loading" && (
                <div className="w-full h-[380px] flex items-center justify-center">
                  <Loader className="mr-2 h-5 w-5 text-primary animate-spin" />
                </div>
              )}
              {popularMenusQuery.status === "success" &&
                !popularMenusQuery?.data?.length && (
                  <div className="w-full h-[380px] flex items-center justify-center">
                    <span className="text-[13px] text-slate-500">
                      No Results Found.
                    </span>
                  </div>
                )}
              {popularMenusQuery.status === "success" && (
                <>
                  {popularMenusQuery?.data?.map((e, i) => {
                    return <PopularMenus item={e} key={i} />;
                  })}
                </>
              )}
            </CardContent>
          </Card>
        </div>
        <RecentOrders />
      </div>
    </>
  );
}

export function Overview({ cycle }: { cycle: string }) {
  const data = React.useMemo(
    () =>
      cycle === "year"
        ? [
            {
              name: "Jan",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Feb",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Mar",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Apr",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "May",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Jun",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Jul",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Aug",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Sep",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Oct",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Nov",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Dec",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
          ]
        : cycle === "week"
        ? [
            {
              name: "Sun",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Mon",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Tue",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Wed",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Thu",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Fri",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "Sat",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
          ]
        : [
            {
              name: "1",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "2",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "3",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "4",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "5",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "6",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "7",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "8",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "9",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "10",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "11",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "12",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "13",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "14",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "15",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "16",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "17",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "18",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "19",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "20",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "21",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "22",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "23",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "24",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "25",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "26",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "27",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "28",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "29",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "30",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
            {
              name: "31",
              total: Math.floor(Math.random() * 5000) + 1000,
            },
          ],
    [cycle]
  );
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PopularMenus({ item }: any) {
  return (
    <div className="space-y-8 hover:bg-slate-50 cursor-pointer px-4 py-[10px]">
      <div className="flex items-center">
        <div>
          <img
            className="h-8 rounded-[4px] border border-slate-200- w-8"
            src={
              item.image ||
              getFileUrl({
                file: item?.image_file,
                collection: "menu_items",
                record: item?.id,
              }) ||
              "/images/menu_placeholder.png"
            }
            alt=""
          />
        </div>
        <div className="ml-3 space-y-2">
          <p className="text-[13px] font-medium leading-none">{item.name}</p>
          {/* <p className="text-[13px] capitalize text-slate-500 text-muted-foreground">
            {item?.expand?.subCategory?.name}
          </p> */}
        </div>
        <div className="ml-auto text-primary text-[12px] font-medium">
          {parseInt(item?.price)?.toLocaleString()} FRW
        </div>
      </div>
    </div>
  );
}

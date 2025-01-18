import DataTable from "./DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "./datatable/DataTableColumnHeader";
import { Checkbox } from "./ui/checkbox";
import formatOrder from "@/utils/formatOrder";
import { ArrowRightCircle, CheckIcon, XIcon } from "lucide-react";
import { GitPullRequest } from "react-feather";
import { cn } from "@/utils";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { useQuery } from "react-query";
import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { useRoles } from "@/context/roles.context";
import formatFilter from "@/utils/formatFilter";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { formatDateToStartOfDay } from "@/utils/timeFormaters";
import getDaf from "@/utils/getDaf";

const statuses = [
  {
    value: "draft",
    label: "draft",
    icon: GitPullRequest,
  },
  {
    value: "on going",
    label: "on going",
    icon: ArrowRightCircle,
  },
  {
    value: "completed",
    label: "completed",
    icon: CheckIcon,
  },
  {
    value: "canceled",
    label: "canceled",
    icon: XIcon,
  },
];

export default function Orders({ ...other }) {
  const navigate = useNavigate();
  const { canPerform } = useRoles();
  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          // @ts-ignore
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Code" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]">
          <Link
            to={`/dashboard/sales/orders/${row.original.id}`}
            className="hover:underline hover:text-slate-600"
          >
            {row.getValue("code")}
          </Link>
        </div>
      ),
      enableSorting: false,
      enableHiding: true,
    },

    {
      accessorKey: "total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      cell: ({ row }) => (
        <div className="truncate">
          {row.getValue("total").toLocaleString()} FRW
        </div>
      ),
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "total_paid",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total paid" />
      ),
      cell: ({ row }) => {
        return (
          <div
            className={cn("truncate capitalize", {
              "text-red-500": row?.original?.payment_status === "pending",
              "text-green-500": row?.original?.payment_status === "paid",
              "text-yellow-500":
                row?.original?.payment_status === "partially paid",
            })}
          >
            {row.getValue("total_paid")?.toLocaleString()}
            {" FRW"}
          </div>
        );
      },
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "table",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Table" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px] capitalize">{row.getValue("table")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = statuses.find(
          (status) => status.value === row.getValue("status")
        );

        if (!status) {
          return null;
        }

        return (
          <div
            className={cn(
              "flex w-[110px] text-left justify-center- text-[13px] capitalize rounded-full",
              {
                "text-yellow-500": status.value === "on going",
                "text-green-500": status.value === "completed",
                "text-gray-500": status.value === "draft",
                "text-red-500": status.value === "canceled",
              }
            )}
          >
            {status.icon && (
              <div>
                <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <span>{status.label}</span>
          </div>
        );
      },
      filterFn: (__, _, value) => {
        return value;
      },
    },
    {
      accessorKey: "guests",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Guests" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]">{row.getValue("guests")}</div>
      ),
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "waiter",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Waiter" />
      ),
      cell: ({ row }) => (
        <div>
          <span className="truncate">{row.getValue("waiter") as any}</span>
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "items_count",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Items" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]">{row.getValue("items_count")}</div>
      ),
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "customer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]- truncate">
          {row.getValue("customer") as any}
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    // add completed_at and canceled_at
    {
      accessorKey: "completed_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Completed at" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]">
          <span className="truncate">
            {row.getValue("completed_at") as any}
          </span>
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "canceled_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Canceled at" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]">
          <span className="truncate">{row.getValue("canceled_at") as any}</span>
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "work_period",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Work period" />
      ),
      cell: ({ row }: any) => (
        <div className="w-[80px]">
          {" "}
          <Link
            to={`/dashboard/reports/work-periods/${row?.original?.work_period_id}/shifts`}
            className="hover:underline hover:text-slate-600"
          >
            {row.getValue("work_period") as any}
          </Link>
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "created",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ordered at" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]">
          <span className="truncate">{row.getValue("created") as any}</span>
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Action" />
      ),
      cell: ({ row }) =>
        canPerform("view_order_details") ? (
          <Button
            size={"sm"}
            onClick={() => {
              navigate(`/dashboard/sales/orders/${row.original.id}`);
            }}
            className="text-blue-500 px-5"
            variant="link"
          >
            View Details
          </Button>
        ) : (
          <Button
            className="opacity-0 pointer-events-none"
            size={"sm"}
          ></Button>
        ),
    },
  ];
  const [searchText, setsearchText] = useState("");

  const [columnFilters, setColumnFilters] = useState<any>([
    {
      id: "created",
      value: {
        from: new Date(formatDateToStartOfDay(new Date())),
      },
    },
  ]);

  const [sorting, setSorting] = useState([
    {
      id: "created",
      desc: true,
    },
  ]);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const [activeTab, setActiveTab] = useState("on going");

  const ordersQuery = useQuery({
    queryKey: [
      "recent-orders",
      {
        search: searchText,
        filter: columnFilters,
        sort: sorting,
        pageIndex,
        pageSize,
        initial_filter: other.initial_filter,
        activeTab,
      },
    ],
    keepPreviousData: true,
    queryFn: async () => {
      const searchQ = searchText
        ? `code~"${searchText}" || table.name~"${searchText}" || items.menu.name?="${searchText}" || tickets.code?="${searchText}" || bills.code?="${searchText}" || waiter.name~"${searchText}"`
        : "";

      const filters = formatFilter(
        columnFilters.filter((e) => e.id !== "created")
      );

      const dataFilter = columnFilters.find((e) => e.id === "created")?.value;

      if (!dataFilter) {
        return { items: [], totalPages: 0 };
      }

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${(p.id || "").replace(/__/g, ".")}`)
        .join(" && ");

      const fils = [
        searchQ ? `(${searchQ})` : undefined,
        filters ? `(${filters})` : undefined,
      ].filter((e) => e);

      const work_periods = await pocketbase
        .collection("work_periods")
        .getFullList({
          filter: getDaf(
            cleanObject(columnFilters.find((e) => e.id === "created")?.value)
          ),
        });

      const wp_filters = work_periods
        .map((e) => `work_period="${e?.id}"`)
        .join(" || ");

      fils.push(`(${wp_filters})`);

      if (!wp_filters.length) return { items: [], totalPages: 0 };

      return pocketbase
        .collection("orders")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [
              activeTab ? `status="${activeTab}"` : undefined,
              other?.initial_filter,
              ...fils.filter((e) => e),
            ]
              .filter((e) => e)
              .join(" && "),
            expand:
              "table,items,customer,waiter,bills,bills.transactions,bills.items,bills.discount,work_period",
            sort: sorters,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              const { total, paidAmount: total_paid } = formatOrder(e);

              const total_discount = e?.expand?.bills?.reduce(
                (acc, bill) => acc + (bill?.expand?.discount?.amount || 0),
                0
              );

              // get payment_status and get pending, paid, paid partially
              const payment_status =
                total_paid === total - total_discount
                  ? "paid"
                  : total_paid > 0
                  ? "partially paid"
                  : "pending";

              return {
                id: e.id,
                code: e.code.toString(),
                table: e?.expand?.table?.code || "N.A",
                items_count: e.expand?.items?.length || 0,
                status: e?.status,
                payment_status,
                total_paid: total_paid || 0,
                guests: e.guests,
                work_period:
                  new Date(e?.expand?.work_period?.created).toLocaleDateString(
                    "en-US",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  ) || "N.A",
                work_period_id: e?.expand?.work_period?.id,
                created: new Date(e.created).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  minute: "2-digit",
                  hour: "2-digit",
                }),
                customer: e?.expand?.customer?.names || "N.A",
                completed_at: e.completed_at
                  ? new Date(e.completed_at).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      minute: "2-digit",
                      hour: "2-digit",
                    })
                  : "---",
                canceled_at: e.canceled_at
                  ? new Date(e.canceled_at).toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      minute: "2-digit",
                      hour: "2-digit",
                    })
                  : "---",
                total: total - total_discount,
                waiter: e?.expand?.waiter?.name,
                original: e,
              };
            }),
            totalPages: e.totalPages,
          };
        });
    },
    enabled: true,
  });

  const footer_row = useMemo(() => {
    const total_items_count = ordersQuery.data?.items
      ?.map((e) => e.items_count)
      .reduce((a, b) => a + b, 0);
    const total_sales = ordersQuery.data?.items
      ?.map((e) => e.total)
      .reduce((a, b) => a + b, 0);
    const total_paid = ordersQuery.data?.items
      ?.map((e) => Number(e.total_paid || 0) || 0)
      .reduce((a, b) => a + b, 0);
    const obj = {
      code: "Total",
      table: "---",
      items_count: total_items_count,
      status: "---",
      payment_status: "---",
      total_paid: total_paid,
      guests: "---",
      work_period: "---",
      work_period_id: "---",
      created: "---",
      customer: "---",
      completed_at: "---",
      canceled_at: "---",
      total: total_sales,
      waiter: "---",
      meta: {
        isFooter: true,
      },
    };
    return obj;
  }, [ordersQuery?.data]);

  return (
    <div>
      <div className=" bg-white scroller border-t border-l border-r rounded-t">
        <ScrollArea className="w-full  whitespace-nowrap">
          <div className="flex px-2 items-center  justify-start">
            {[
              { title: "On going Orders", name: "on going" },
              { title: "Completed Orders", name: "completed" },
              { title: "Canceled Orders", name: "canceled" },
            ].map((e, i) => {
              return (
                <a
                  key={i}
                  className={cn(
                    "cursor-pointer px-6 capitalize text-center relative w-full- text-slate-700 text-[13px] sm:text-sm py-3  font-medium",
                    {
                      "text-primary ": activeTab === e.name,
                    }
                  )}
                  onClick={() => {
                    setActiveTab(e.name);
                  }}
                >
                  {activeTab === e.name && (
                    <div className="h-[3px] left-0 rounded-t-md bg-primary absolute bottom-0 w-full"></div>
                  )}
                  <span className=""> {e.title}</span>
                </a>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <DataTable
        className={other?.className}
        isFetching={ordersQuery.isFetching}
        defaultColumnVisibility={{
          customer: false,
          guests: false,
          canceled_at: false,
          completed_at: false,
        }}
        isLoading={ordersQuery.status === "loading"}
        facets={[
          {
            title: "Table",
            loader: ({ search }) => {
              return pocketbase
                .collection("tables")
                .getFullList({
                  filter: `name~"${search}"`,
                })
                .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
            },
            name: "table",
            type: "async-options",
          },
          {
            title: "Waiter",
            loader: ({ search }) => {
              return pocketbase
                .collection("users")
                .getFullList({
                  filter: `name~"${search}"`,
                })
                .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
            },
            name: "waiter",
            type: "async-options",
          },
          {
            title: "Work Period Date",
            type: "date",
            name: "created",
          },
        ]}
        data={
          [
            ...(ordersQuery?.data?.items || []),
            ordersQuery?.data?.totalPages === 1 &&
            canPerform("view_orders_total")
              ? footer_row
              : undefined,
          ].filter((e) => e) || []
        }
        columns={columns}
        onSearch={(e) => {
          setsearchText(e);
        }}
        sorting={sorting}
        setSorting={setSorting}
        pageCount={ordersQuery?.data?.totalPages}
        setPagination={setPagination}
        pageIndex={pageIndex}
        pageSize={pageSize}
        setColumnFilters={setColumnFilters}
        columnFilters={columnFilters}
        {...other}
      />
    </div>
  );
}

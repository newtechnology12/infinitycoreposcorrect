/* eslint-disable @typescript-eslint/no-explicit-any */
import DataTable from "@/components/DataTable";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import DataTableRowActions from "@/components/datatable/DataTableRowActions";
import pocketbase from "@/lib/pocketbase";
import { cn } from "@/utils";
import cleanObject from "@/utils/cleanObject";
import formatOrder from "@/utils/formatOrder";
import { Checkbox } from "@radix-ui/react-checkbox";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { addDays } from "date-fns";
import { CheckIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { GitPullRequest, ArrowRightCircle, Link } from "react-feather";
import { useQuery } from "react-query";
import { Order } from "../dashboard/Employees";
import { HiOutlineQueueList } from "react-icons/hi2";
import { GiCampCookingPot } from "react-icons/gi";
import { PiCallBell } from "react-icons/pi";
import { IoCheckmarkDoneCircleOutline } from "react-icons/io5";
export default function KitchenHistory() {
  const [searchText, setsearchText] = useState("");

  const [columnFilters, setColumnFilters] = useState([]);
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

  const ordersQuery = useQuery({
    queryKey: [
      "recent-orders",
      {
        search: searchText,
        filter: columnFilters,
        sort: sorting,
        pageIndex,
        pageSize,
      },
    ],
    keepPreviousData: true,
    queryFn: () => {
      const searchQ = searchText ? `code~"${searchText}"` : "";
      const filters = columnFilters
        .map((e) => {
          if (e.value["from"]) {
            if (e.value?.to) {
              return `created >= "${new Date(
                e.value?.from
              ).toISOString()}" && created <= "${new Date(
                e.value?.to
              ).toISOString()}"`;
            } else {
              return `created >= "${new Date(
                e.value?.from
              ).toISOString()}" && created <= "${new Date(
                addDays(new Date(e.value?.from), 1)
              ).toISOString()}"`;
            }
          } else {
            return e.value.map((p) => `${e.id}="${p}"`).join(" || ");
          }
        })
        .join(" && ");

      console.log(filters, columnFilters);

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      return pocketbase
        .collection("orders")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters].filter((e) => e).join("&&"),
            expand: "table,items,customer,waiter",
            sort: sorters,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                code: e.code.toString(),
                table: e.expand?.table?.code || "",
                items_count: e.expand?.items?.length || 0,
                status: e.status,
                kitchen_status: e.kitchenStatus.toLowerCase() || "queue",
                guests: e.guests,
                created: new Date(e.created).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
                customer: e?.customer || "N.A",
                total: formatOrder({ items: e.expand?.items || [] }).total,
                waiter: e?.expand?.waiter?.name,
              };
            }),
            totalPages: e.totalPages,
          };
        });
    },
    enabled: true,
  });

  return (
    <div className="h-screen">
      <DataTable
        title={"History Orders"}
        defaultColumnVisibility={{ customer: false, guests: false }}
        isLoading={ordersQuery.status === "loading"}
        facets={[
          { title: "Status", options: statuses, name: "status" },
          {
            title: "Kitchen Status",
            options: kitchen_statuses,
            name: "kitchen_status",
          },
          {
            title: "Table",
            loader: () => {
              return pocketbase
                .collection("tables")
                .getFullList()
                .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
            },
            name: "table",
          },
          {
            title: "Waiter",
            loader: () => {
              return pocketbase
                .collection("users")
                .getFullList()
                .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
            },
            name: "waiter",
          },
          {
            title: "Customer",
            loader: () => {
              return pocketbase
                .collection("customers")
                .getFullList()
                .then((e) => e.map((e) => ({ label: e.names, value: e.id })));
            },
            name: "customer",
          },
          {
            title: "Order Date",
            type: "date",
            name: "created",
          },
        ]}
        data={ordersQuery?.data?.items || []}
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
      />
    </div>
  );
}

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

const kitchen_statuses = [
  {
    value: "pending",
    label: "pending",
    icon: GitPullRequest,
  },
  {
    value: "queue",
    label: "queue",
    icon: HiOutlineQueueList,
  },
  {
    value: "cooking",
    label: "cooking",
    icon: GiCampCookingPot,
  },
  {
    value: "ready",
    label: "Ready",
    icon: PiCallBell,
  },
  {
    value: "completed",
    label: "completed",
    icon: IoCheckmarkDoneCircleOutline,
  },
  {
    value: "Canceled",
    label: "Canceled",
    icon: XIcon,
  },
];

const columns: ColumnDef<Order>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
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
        <Link to={""} className="hover:underline hover:text-slate-600">
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
      <div className="w-[80px]">
        {row.getValue("total").toLocaleString()} FRW
      </div>
    ),
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "kitchen_status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kitchen status" />
    ),
    cell: ({ row }) => {
      const status = kitchen_statuses.find(
        (status) => status.value === row.getValue("kitchen_status")
      );

      if (!status) {
        return null;
      }
      return (
        <div
          className={cn(
            "flex w-[80px] text-left justify-center- text-[13px] capitalize rounded-full",
            {
              "text-yellow-500": status.value === "pending",
              "text-green-500": status.value === "paid",
              "text-red-500": status.value === "failed",
            }
          )}
        >
          {status.icon && (
            <div>
              <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
            </div>
          )}
          {row.getValue("kitchen_status")}
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
    cell: ({ row }) => <div className="w-[80px]">{row.getValue("guests")}</div>,
    enableSorting: true,
    enableHiding: true,
  },

  {
    accessorKey: "waiter",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Waiter" />
    ),
    cell: ({ row }) => (
      <div className="w-[80px]">
        <Link to={""} className="hover:underline hover:text-slate-600">
          {row.getValue("waiter") as any}
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
      <div className="w-[80px]">
        {(row.getValue("customer") as any)?.split(" ")[0]}
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
    cell: ({ row }) => (
      <DataTableRowActions
        actions={[{ title: "view order" }, { title: "delete order" }]}
        row={row}
      />
    ),
  },
];

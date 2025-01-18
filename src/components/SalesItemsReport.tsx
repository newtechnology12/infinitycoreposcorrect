import DataTable from "./DataTable";

import { ColumnDef, PaginationState } from "@tanstack/react-table";

import DataTableColumnHeader from "./datatable/DataTableColumnHeader";
import { Checkbox } from "./ui/checkbox";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BreadCrumb from "./breadcrumb";
import { cn } from "@/utils";
import formatFilter from "@/utils/formatFilter";
import getDaf from "@/utils/getDaf";
import { formatDateToStartOfDay } from "@/utils/timeFormaters";
import { useworkShift } from "@/context/workShift.context";
import { useRoles } from "@/context/roles.context";

export default function SalesItemsReport({ ...other }) {
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
      accessorKey: "created",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]- truncate">{row.getValue("created")}</div>
      ),
      enableSorting: false,
      enableHiding: true,
      filterFn: (__, _, value) => {
        return value;
      },
    },
    {
      accessorKey: "order",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]">
          <Link
            to={`/dashboard/sales/orders/${row.original.order_id}`}
            className="hover:underline hover:text-slate-600"
          >
            {row.getValue("order")}
          </Link>
        </div>
      ),
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "order__table",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Table" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]">{row.getValue("order__table")} </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "ticket",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ticket" />
      ),
      cell: ({ row }) => (
        <div className="truncate py-2 capitalize">{row.getValue("ticket")}</div>
      ),
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "item",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Item" />
      ),
      cell: ({ row }) => (
        <div className="truncate py-2 capitalize">{row.getValue("item")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">
          {(Number(row.getValue("amount")) || 0)?.toLocaleString()} FRW
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Quantity" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]">{row.getValue("quantity")}</div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "station",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Station" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]- truncate">{row.getValue("station")}</div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <div
          className={cn("w-[80px] capitalize", {
            "text-green-500": row.getValue("status") === "completed",
            "text-red-500": row.getValue("status") === "cancelled",
            "text-yellow-500": row.getValue("status") === "pending",
          })}
        >
          {row.getValue("status")}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "order__waiter",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Waiter" />
      ),
      cell: ({ row }) => (
        <div>
          <span className="truncate">
            {row.getValue("order__waiter") as any}
          </span>
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "menu__category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => (
        <div>
          <span className="truncate">
            {row.getValue("menu__category") as any}
          </span>
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "menu__subCategory",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sub Category" />
      ),
      cell: ({ row }) => (
        <div>
          <span className="truncate">
            {row.getValue("menu__subCategory") as any}
          </span>
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
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
      accessorKey: "time",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Time" />
      ),
      cell: ({ row }) => (
        <div className="h-full truncate">{row.getValue("time") as any}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
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

  const { work_period } = useworkShift();

  React.useEffect(() => {
    if (work_period?.id) {
      setColumnFilters([
        {
          id: "created",
          value: {
            from: new Date(formatDateToStartOfDay(work_period?.created)),
          },
        },
      ]);
    }
  }, [work_period]);

  const [sorting, setSorting] = useState([
    {
      id: "created",
      desc: false,
    },
  ]);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const { canPerform } = useRoles();

  const recordsQuery = useQuery({
    queryKey: [
      "order-items",
      {
        search: searchText,
        filter: columnFilters,
        sort: sorting,
        pageIndex,
        pageSize,
        initial_filter: other.initial_filter,
      },
    ],
    keepPreviousData: true,
    onError: (e) => {
      console.log(e);
    },
    queryFn: async () => {
      const searchQ = searchText
        ? `order.code~"${searchText}" || order.waiter.name~"${searchText}" || menu.name~"${searchText}" || menu.category.name~"${searchText}" || menu.subCategory.name~"${searchText}" || order_ticket.code~"${searchText}" || order_ticket.order_station.name~"${searchText}"`
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
        .map((e) => `order.work_period="${e?.id}"`)
        .join(" || ");

      fils.push(`(${wp_filters})`);

      if (!wp_filters.length) return { items: [], totalPages: 0 };

      const ops = {
        ...cleanObject({
          filter: fils.filter((e) => e).join(" && "),
          expand:
            "order.waiter,order,menu,order.table,menu.category,menu.subCategory,order_ticket,order_ticket.order_station",
          sort: sorters,
        }),
      };

      console.log(ops);

      const total_revenue_loaded = await pocketbase
        .collection("order_items")
        .getFullList(ops);

      const total_revenue = total_revenue_loaded
        .filter((e) => e.status !== "draft")
        .filter((e) => e.status !== "cancelled")
        .filter((e) => e.amount)
        .reduce((acc, e) => acc + e.amount, 0);

      return pocketbase
        .collection("order_items")
        .getList(pageIndex + 1, pageSize, ops)
        .then((e) => {
          return {
            items: e?.items
              ?.filter((e) => e.status !== "draft")
              .map((e) => {
                return {
                  id: e.id,
                  order__waiter: e?.expand?.order?.expand?.waiter?.name,
                  order: e?.expand?.order?.code,
                  order__table: e?.expand?.order?.expand?.table?.name || "N.A",
                  item: e?.expand?.menu?.name,
                  amount: e?.amount,
                  quantity: e.quantity,
                  status: e.status,
                  station:
                    e.expand.order_ticket?.expand?.order_station?.name || "N.A",
                  ticket: e?.expand?.order_ticket?.code || "N.A",
                  menu__category:
                    e?.expand?.menu?.expand?.category?.name || "N.A",
                  menu__subCategory:
                    e?.expand?.menu?.expand?.subCategory?.name || "N.A",
                  total: e.amount,
                  date: new Date(
                    e?.expand?.order?.expand?.work_period?.created
                  ).toLocaleString("en-US", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  }),
                  created: new Date(e.created).toLocaleString("en-US", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    minute: "2-digit",
                    hour: "2-digit",
                  }),
                  time: new Date(e.created).toLocaleTimeString(),
                  order_id: e?.order,
                  original: e,
                };
              }),
            totalPages: e.totalPages,
            total_revenue,
          };
        });
    },
    enabled: true,
  });

  const footer_row = useMemo(() => {
    const total_quantity = recordsQuery.data?.items.reduce(
      (acc, e) => acc + e.quantity,
      //@ts-ignore
      0
    );

    const total_amount = recordsQuery.data?.items
      .filter((e) => e?.status !== "draft")
      .filter((e) => e?.status !== "cancelled")
      .reduce((acc, e) => acc + e.total, 0);

    const obj = {
      date: "Total",
      created: "----",
      order: "---",
      order__table: "---",
      item: "---",
      amount: total_amount,
      quantity: total_quantity,
      order__waiter: "---",
      total: total_amount,
      time: "---",
      meta: {
        isFooter: true,
      },
    };
    return obj;
  }, [recordsQuery.data]);

  return (
    <div>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Order Items Sales Report
            </h2>
            <BreadCrumb
              items={[{ title: "All sales items", link: "/dashboard" }]}
            />
          </div>
        </div>
        {canPerform("view_sales_items_report_total") && (
          <div className="grid sm:grid-cols-4 md:grid-cols-3 grid-cols-1 mb-3 mt-3">
            <Card className="rounded-[3px] shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
                <CardTitle className="text-[14.5px] font-medium">
                  Total Sales Items.
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
                  {
                    //@ts-ignore
                    recordsQuery?.data?.total_revenue?.toLocaleString() ||
                      (recordsQuery.status === "loading" ? "---" : 0)
                  }{" "}
                  {recordsQuery.status === "success" && "FRW"}
                </div>
                <p className="text-sm text-slate-500 capitalize">
                  All the sales items.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <DataTable
          className={other?.className}
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{
            customer: false,
            guests: false,
            items_count: false,
            canceled_at: false,
            completed_at: false,
          }}
          isLoading={recordsQuery.status === "loading"}
          facets={[
            {
              title: "Table",
              loader: ({ search }) => {
                return pocketbase
                  .collection("tables")
                  .getFullList({
                    filter: [search ? `name~"${search}"` : undefined]
                      .filter((e) => e)
                      .join(" && "),
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "order__table",
              filter_name: "order.table",
              type: "async-options",
            },
            {
              title: "Category",
              loader: ({ search }) => {
                return pocketbase
                  .collection("categories")
                  .getFullList({
                    filter: [
                      'parent=""',
                      search ? `name~"${search}"` : undefined,
                    ]
                      .filter((e) => e)
                      .join(" && "),
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "menu__category",
              type: "async-options",
            },
            {
              title: "Sub Category",
              loader: ({ search }) => {
                return pocketbase
                  .collection("categories")
                  .getFullList({
                    filter: [
                      'parent!=""',
                      search ? `name~"${search}"` : undefined,
                    ]
                      .filter((e) => e)
                      .join(" && "),
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "menu__subCategory",
              type: "async-options",
            },
            {
              title: "Waiter",
              loader: ({ search }) => {
                return pocketbase
                  .collection("users")
                  .getFullList({
                    filter: [search ? `name~"${search}"` : undefined]
                      .filter((e) => e)
                      .join(" && "),
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "order__waiter",
              filter_name: "order.waiter",
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
              ...(recordsQuery?.data?.items || []),
              recordsQuery?.data?.totalPages === 1 &&
              canPerform("view_sales_items_report_total")
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
          pageCount={recordsQuery?.data?.totalPages}
          setPagination={setPagination}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setColumnFilters={setColumnFilters}
          columnFilters={columnFilters}
          {...other}
        />
      </div>
    </div>
  );
}

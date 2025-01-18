import DataTable from "./DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { z } from "zod";
import pocketbase from "@/lib/pocketbase";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { addDays } from "date-fns";
import cleanObject from "@/utils/cleanObject";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import TicketItem from "./TicketItem";
import useSettings from "@/hooks/useSettings";
import { cn } from "@/utils";
import { useworkShift } from "@/context/workShift.context";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const orderSchema = z.object({
  id: z.string(),
  code: z.string(),
  order__table: z.string(),
  order__waiter: z.string(),
  items_count: z.number(),
  total: z.number(),
  status: z.string(),
  payment_status: z.string(),
  guests: z.number(),
  customer: z.string(),
});

export type Order = z.infer<typeof orderSchema>;

export default function AllTickets({ ...other }) {
  const { settings } = useSettings();

  const { work_period } = useworkShift();

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => {
        return <div className="lowercase truncate">{row.getValue("code")}</div>;
      },
    },
    {
      accessorKey: "order",
      header: "Order",
      cell: ({ row }) => {
        return (
          <div className="lowercase truncate">{row.getValue("order")}</div>
        );
      },
    },
    {
      accessorKey: "order__waiter",
      header: "Order Waiter",
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {row.getValue("order__waiter")}
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
    },
    {
      accessorKey: "time",
      header: "Order time",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("time")}</div>
      ),
    },
    {
      accessorKey: "created",
      header: "Created",
      cell: ({ row }) => (
        <div className="  truncate">{row.getValue("created")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
    },
    {
      accessorKey: "items",
      header: "Items",
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("items").toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "completed_by",
      header: "Completed by",
      cell: ({ row }) => (
        <div className="truncate">{row.getValue("completed_by")}</div>
      ),
    },
    {
      accessorKey: "completed_at",
      header: "Completed at",
      cell: ({ row }) => (
        <div className="truncate">
          {row.getValue("completed_at").toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: ({ row }) => (
        <div className="truncate">
          {row.getValue("total_amount").toLocaleString()} FRW
        </div>
      ),
    },
    {
      accessorKey: "order__table",
      header: "Table",
      cell: ({ row }) => {
        return <div className="truncate">{row.getValue("order__table")}</div>;
      },
      filterFn: (__, _, value) => {
        return value;
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const e = row.original?.original;
        return (
          <div className="flex items-center py-2 gap-3">
            {settings.enable_ticket_recall && (
              <Button
                size={"sm"}
                onClick={() => {
                  recallTicket(row?.original);
                }}
                disabled={
                  row?.original?.original?.expand?.order?.status === "completed"
                }
                className="!text-blue-500 px-5"
                variant="link"
              >
                Recall
              </Button>
            )}

            <Dialog>
              <DialogTrigger className="!text-green-500 truncate hover:underline !text-[12px] px-3">
                View Ticket
              </DialogTrigger>
              <DialogContent className="max-w-[450px] !p-0">
                <TicketItem
                  ticket={{
                    id: e.id,
                    printed: e.printed,
                    code: e.code,
                    name: e.name,
                    count: e.order_items?.length || 0,
                    items: e?.expand?.order_items
                      .filter((e) => e.status !== "cancelled")
                      .filter((e) => e.status !== "draft"),
                    status: e.status,
                    fired_at: e.fired_at,
                    order_station: e.expand?.order_station,
                    order: e.expand?.order,
                    created: e.created,
                  }}
                  setactiveCourse={() => {}}
                  activeCourse={undefined}
                  orderQuery={undefined}
                />
              </DialogContent>
            </Dialog>
          </div>
        );
      },
    },
  ];
  const [searchText, setsearchText] = useState("");

  const [columnFilters, setColumnFilters] = useState<any>([
    // {
    //   id: "created",
    //   value: {
    //     from: new Date().toLocaleDateString(),
    //   },
    // },
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

  const params = useParams();

  const [activeTab, setActiveTab] = useState("all");

  const recordsQuery: any = useQuery({
    queryKey: [
      "all-tickets",
      {
        search: searchText,
        filter: columnFilters,
        sort: sorting,
        pageIndex,
        pageSize,
        kitchen: params?.kitchen,
        activeTab,
      },
    ],
    keepPreviousData: true,
    queryFn: () => {
      const searchQ = searchText
        ? `(order.code~"${searchText}" || order.table.name~"${searchText}" || order.waiter.name~"${searchText}" || items.menu.name?="${searchText}" || code~"${searchText}")`
        : "";

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
            return e.value
              .map((p) => `${e.id.replace("__", ".")}="${p.value || p}"`)
              .join(" || ");
          }
        })
        .join(" && ");

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      const filtersB =
        activeTab === "all" ? undefined : `status="${activeTab}"`;

      return pocketbase
        .autoCancellation(false)
        .collection("order_tickets")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [
              filters,
              filtersB,
              `order_station="${params?.kitchen}"`,
              `order.work_period="${work_period?.id}"`,
              other?.initial_filter,
              searchQ,
            ]
              .filter((e) => e)
              .join(" && "),
            expand:
              "order,order.table,table,order.waiter,order_items,order_items.menu,order_station,completed_by",
            sort: sorters,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                order: e?.expand?.order?.code,
                ["order__table"]:
                  e?.expand?.order?.expand?.table?.name || "N.A",
                time: new Date(e.created).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                items: e?.order_items?.length || 0,
                code: e.code || "N.A",
                total_amount:
                  e?.expand?.order_items?.reduce((a, b) => a + b.amount, 0) ||
                  0,
                completed_by: e?.expand?.completed_by?.name || "N.A",
                completed_at: new Date(e.completed_at).toLocaleDateString(
                  "en-US",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    minute: "2-digit",
                    hour: "2-digit",
                  }
                ),
                created: new Date(e.created).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  weekday: "short",
                }),
                ["order__waiter"]:
                  e?.expand?.order?.expand?.waiter?.name || "N.A",
                original: e,
              };
            }),

            totalPages: e.totalPages,
          };
        });
    },
    enabled: true,
  });

  const recallTicket = async (ticket) => {
    return pocketbase
      .collection("order_tickets")
      .update(ticket.id, {
        status: "open",
      })
      .then(() => {
        toast.success("Ticket recalled successfully");
        recordsQuery.refetch();
      });
  };

  return (
    <>
      <div>
        <div className="flex px-2 items-center bg-black justify-start border-slate-700 border-t border-l border-r rounded-t">
          {[
            { title: "All Tickets", name: "all" },
            { title: "Completed Tickets", name: "completed" },
          ].map((e, i) => {
            return (
              <a
                key={i}
                className={cn(
                  "cursor-pointer px-6 capitalize text-center relative w-full- text-slate-700 text-[13px] sm:text-sm py-3  font-medium",
                  {
                    "!text-primary ": activeTab === e.name,
                  }
                )}
                onClick={() => {
                  setActiveTab(e.name);
                }}
              >
                {activeTab === e.name && (
                  <div className="h-[3px] left-0 rounded-t-md  bg-primary absolute bottom-0 w-full"></div>
                )}
                <span className="text-slate-200"> {e.title}</span>
              </a>
            );
          })}
        </div>
        <DataTable
          className={other?.className}
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{
            customer: false,
            guests: false,
            items_count: false,
            canceled_at: false,
            completed_at: true,
          }}
          isLoading={recordsQuery.status === "loading"}
          facets={[
            { title: "Status", options: [], name: "status" },
            {
              title: "Table",
              loader: ({ search }) => {
                return pocketbase
                  .collection("tables")
                  .getFullList({
                    filter: search ? `name~"${search}"` : "",
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "order__table",
              filter_name: "order.table",
              type: "async-options",
            },
            {
              title: "Waiter",
              loader: ({ search }) => {
                return pocketbase
                  .collection("users")
                  .getFullList({
                    filter: search ? `name~"${search}"` : "",
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "order__waiter",
              filter_name: "order.waiter",
              type: "async-options",
            },
            {
              title: "Ticket Date",
              type: "date",
              name: "created",
            },
          ]}
          data={recordsQuery?.data?.items || []}
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
    </>
  );
}

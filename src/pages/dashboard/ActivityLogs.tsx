import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { useState } from "react";
import { useQuery } from "react-query";
import BreadCrumb from "@/components/breadcrumb";
import { addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils";
import formatFilter from "@/utils/formatFilter";

export default function ActivityLogs() {
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
      accessorKey: "user",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("user")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "event_type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Event Type" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("event_type")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "details",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="details" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate py-1">
          <Badge
            variant="outline"
            className={cn("mr-2", {
              "border-blue-500 text-blue-500":
                row.original.log_level === "INFO",
              "border-yellow-500 text-yellow-500":
                row.original.log_level === "WARNING",
            })}
          >
            {row.original.log_level}
          </Badge>
          {row.getValue("details")}
        </div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },

    {
      accessorKey: "time",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Time" />
      ),
      cell: ({ row }) => (
        <div className="capitalize w-[80px]">{row.getValue("time")}</div>
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
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <div className="capitalize w-[80px]">{row.getValue("created")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
  ];

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

  const activitiesQuery = useQuery({
    queryKey: [
      "activities",
      {
        search: searchText,
        sort: sorting,
        pageIndex,
        columnFilters,
        pageSize,
      },
    ],
    keepPreviousData: true,
    queryFn: () => {
      const searchQ = searchText
        ? `title~"${searchText}" || event_type~"${searchText}" || user.name~"${searchText}"`
        : "";

      const filters = formatFilter(columnFilters);

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      return pocketbase
        .collection("activity_logs")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters].filter((e) => e).join("&&"),
            expand: "user",
            sort: sorters,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                details: e.details,
                action: e.action,
                method: e.method,
                log_level: e.log_level,
                event_type: e.event_type,
                original: e,
                time: new Date(e.created).toLocaleTimeString("en-US", {
                  minute: "2-digit",
                  hour: "2-digit",
                }),
                created: new Date(e.created).toLocaleString("en-US", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
                user: e?.expand?.user?.name,
              };
            }),
            totalPages: e.totalPages,
          };
        });
    },
    enabled: true,
  });

  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Activty Logs
            </h2>
            <BreadCrumb
              items={[{ title: "View Activty Logs", link: "/dashboard" }]}
            />
          </div>
        </div>
        <DataTable
          isFetching={activitiesQuery.isFetching}
          defaultColumnVisibility={{
            itemsCount: false,
          }}
          isLoading={activitiesQuery.status === "loading"}
          data={activitiesQuery?.data?.items || []}
          columns={columns}
          onSearch={(e) => {
            setsearchText(e);
          }}
          sorting={sorting}
          setSorting={setSorting}
          pageCount={activitiesQuery?.data?.totalPages}
          setPagination={setPagination}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setColumnFilters={setColumnFilters}
          columnFilters={columnFilters}
          facets={[
            {
              title: "Employee",
              loader: ({ search }) => {
                return pocketbase
                  .collection("users")
                  .getFullList({
                    filter: `name~"${search}"`,
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "user",
              type: "async-options",
            },
            {
              title: "Created at",
              type: "date",
              name: "created",
            },
          ]}
        />
      </div>
    </>
  );
}

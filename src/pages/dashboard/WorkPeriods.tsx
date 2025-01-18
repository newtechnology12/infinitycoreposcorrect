import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { useState } from "react";
import { useMutation, useQuery } from "react-query";
import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import formatSeconds from "@/utils/formatSeconds";
import { addDays, differenceInSeconds } from "date-fns";
import useConfirmModal from "@/hooks/useConfirmModal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import { toast } from "sonner";
import { useAuth } from "@/context/auth.context";
import { cn } from "@/utils";

export default function WorkPeriods() {
  const navigate = useNavigate();
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
          checked={!row.original.original.ended_at ? true : row.getIsSelected()}
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
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("created")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "duration",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Duration" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("duration")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "started_by",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Started by" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("started_by")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <div
          className={cn("capitalize", {
            "text-green-500": row.getValue("status") === "on going",
          })}
        >
          {row.getValue("status")}
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "work_shifts",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Work Shits" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("work_shifts")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "started_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Started at" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]- flex items-center gap-2">
          <div className="capitalize">{row.getValue("started_at")}</div>
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "ended_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ended at" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("ended_at")}</div>
      ),
      enableSorting: true,
      enableHiding: true,
    },

    {
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
      ),
      cell: ({ row }) => (
        <Button
          size={"sm"}
          onClick={() => {
            navigate(
              `/dashboard/reports/work-periods/${row.original.id}/shifts`
            );
          }}
          className="text-blue-500"
          variant="link"
        >
          View Details
        </Button>
      ),
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

  const recordsQuery = useQuery({
    queryKey: [
      "work_periods",
      {
        columnFilters,
        search: searchText,
        sort: sorting,
        pageIndex,
        pageSize,
      },
    ],
    keepPreviousData: true,
    queryFn: () => {
      const searchQ = searchText
        ? `started_by.name~"${searchText}" || ended_by.name~"${searchText}"`
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
            return e.value.map((p) => `${e.id}="${p.value || p}"`).join(" || ");
          }
        })
        .join(" && ");
      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      return pocketbase
        .collection("work_periods")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters].filter((e) => e).join("&&"),
            sort: sorters,
            expand: `started_by,ended_by`,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                started_by: e.expand?.started_by?.name,
                ended_by: e.expand?.ended_by?.name,
                started_at: new Date(e.started_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  month: "short",
                  day: "numeric",
                }),
                status: !e.ended_at ? "on going" : "closed",
                ended_at: e.ended_at
                  ? new Date(e.ended_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric",
                    })
                  : "---",
                duration:
                  formatSeconds(
                    differenceInSeconds(
                      e.ended_at ? new Date(e.ended_at) : new Date(),
                      new Date(e.started_at)
                    )
                  ) || "N.A",
                work_shifts: e?.work_shifts?.length || 0,
                created: new Date(e.created).toLocaleDateString("en-US"),
                updated: new Date(e.created).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
                original: e,
              };
            }),
            totalPages: e.totalPages,
          };
        });
    },
    enabled: true,
  });

  const startPeriodModal = useConfirmModal();

  const { user } = useAuth();

  const [error, setError] = useState("");
  const startWorkPeriodMutation = useMutation({
    mutationFn: () => {
      const checkIfExist = recordsQuery.data?.items.find(
        (e) => !e.original.ended_at
      );

      if (checkIfExist) throw new Error("You have an ongoing work period");

      return pocketbase.collection("work_periods").create({
        started_by: user.id,
        started_at: new Date(),
      });
    },
    onSuccess: () => {
      toast.success("You have successfully started a new work period");
      recordsQuery.refetch();
      startPeriodModal.close();
    },
    onError: (error: any) => {
      setError(error.message);
      console.log(error);
    },
  });

  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Work Periods & Shifts
            </h2>
            <BreadCrumb
              items={[{ title: "Work Periods", link: "/dashboard" }]}
            />
          </div>
          <Button
            onClick={() => {
              startPeriodModal.setisOpen(true);
            }}
            size="sm"
          >
            <PlusCircle size={16} className="mr-2" />
            <span>Start New Work Period</span>
          </Button>
        </div>
        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{
            created_by: false,
            approved_by: false,
            rejected_by: false,
            updated: false,
          }}
          isLoading={recordsQuery.status === "loading"}
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
          facets={[
            {
              title: "Status",
              name: "status",
              options: [
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
                { label: "Pending", value: "pending" },
              ],
            },
            {
              title: "Work Date",
              type: "date",
              name: "created",
            },
          ]}
        />
      </div>
      <ConfirmModal
        title={"Start New Work Period"}
        description={`Are you sure you want to start a new work period, this starts a new work period and ends the current one if any`}
        onConfirm={() => {
          startWorkPeriodMutation.mutate();
        }}
        error={error}
        isLoading={startWorkPeriodMutation.isLoading}
        open={startPeriodModal.isOpen}
        onClose={() => {
          startPeriodModal.close();
          setTimeout(() => {
            setError(undefined);
          }, 500);
        }}
      />
    </>
  );
}

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
import useModalState from "@/hooks/useModalState";
import useEditRow from "@/hooks/use-edit-row";
import { formatDateToStartOfDay } from "@/utils/timeFormaters";
import { DailyReportFormModal } from "@/components/modals/DailyReportFormModal";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "react-feather";
import { useRoles } from "@/context/roles.context";
import { useAuth } from "@/context/auth.context";

export default function DailyReports() {
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
      accessorKey: "employee",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Employee" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("employee")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "department",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="department" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("department")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("description")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "created",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate"> {row.getValue("created")} </div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
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

  const { canPerform } = useRoles();

  const { user } = useAuth();

  const recordsQuery = useQuery({
    queryKey: [
      "daily_reports",
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
      const searchQ = searchText ? `employee.name~"${searchText}"` : "";
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

      // view_all_requisition_orders
      const permitionQ = !canPerform("view_all_daily_reports")
        ? `employee="${user.id}"`
        : "";

      return pocketbase
        .collection("daily_reports")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters, permitionQ].filter((e) => e).join("&&"),
            expand: "created_by,employee,department",
            sort: sorters,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                employee: e?.expand?.employee?.name,
                description: e.description,
                department: e.expand?.department?.name || "N.A",
                created: new Date(e.created)?.toLocaleString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
              };
            }),
            totalPages: e.totalPages,
          };
        });
    },
    enabled: true,
  });

  const newRecordModal = useModalState();

  const editRow = useEditRow();

  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Daily reports.
            </h2>
            <BreadCrumb
              items={[{ title: "Daily reports.", link: "/dashboard" }]}
            />
          </div>
          <div className="space-x-2">
            <Button
              onClick={() => {
                newRecordModal.open();
              }}
              size="sm"
            >
              <PlusCircle size={16} className="mr-2" />
              <span>Create a new report</span>
            </Button>
          </div>
        </div>
        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{
            itemsCount: false,
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
              title: "Employee",
              loader: ({ search }) => {
                return pocketbase
                  .collection("users")
                  .getFullList({
                    filter: `name~"${search}"`,
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "employee",
              type: "async-options",
            },
            {
              title: "Department",
              loader: ({ search }) => {
                return pocketbase
                  .collection("departments")
                  .getFullList({
                    filter: `name~"${search}"`,
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "department",
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

      <DailyReportFormModal
        onComplete={() => {
          recordsQuery.refetch();
          newRecordModal.close();
          editRow.close();
        }}
        record={editRow.row}
        setOpen={editRow.isOpen ? editRow.setOpen : newRecordModal.setisOpen}
        open={newRecordModal.isOpen || editRow.isOpen}
      />
    </>
  );
}

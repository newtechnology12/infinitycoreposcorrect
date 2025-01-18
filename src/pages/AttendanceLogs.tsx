import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { useState } from "react";
import { useQuery } from "react-query";
import DataTableRowActions from "@/components/datatable/DataTableRowActions";
import { addDays, differenceInSeconds } from "date-fns";
import formatSeconds from "@/utils/formatSeconds";
import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "react-feather";
import { AttendanceFormModal } from "@/components/modals/AttendanceFormModal";
import useModalState from "@/hooks/useModalState";
import useEditRow from "@/hooks/use-edit-row";
import ConfirmModal from "@/components/modals/ConfirmModal";
import useConfirmModal from "@/hooks/useConfirmModal";
import { toast } from "sonner";
import { BulkAttendanceModal } from "@/components/modals/BulkAttendanceModal";
import formatFilter from "@/utils/formatFilter";

export default function AttendaceLogs() {
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
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("date")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "clockin_time",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Clock In" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("clockin_time")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "clockout_time",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Clock Out" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("clockout_time")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "behaviour",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Behaviour" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("behaviour")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "total_hours",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total Hours" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("total_hours")}</div>
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
        <DataTableColumnHeader column={column} title="Created at" />
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
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
      ),
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            {
              title: "Edit Attendance",
              onClick: (e) => {
                editRow.edit(e.original);
              },
            },
            {
              title: "delete Attendance",
              onClick: (e) => {
                confirmModal.open({ meta: e });
              },
            },
          ]}
          row={row}
        />
      ),
    },
  ];

  const [searchText, setsearchText] = useState("");

  const [columnFilters, setColumnFilters] = useState<any>([
    {
      id: "created",
      value: {
        from: new Date(),
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

  const recordsQuery = useQuery({
    queryKey: [
      "attendance",
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
      const searchQ = searchText ? `name~"${searchText}"` : "";
      const filters = formatFilter(columnFilters);

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      return pocketbase
        .collection("attendance")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters].filter((e) => e).join("&&"),
            sort: sorters,
            expand: `employee`,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                date: new Date(e.date).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
                clockin_time: new Date(e.clockin_time).toLocaleTimeString(),
                clockout_time: e.clockout_time
                  ? new Date(e.clockout_time).toLocaleTimeString()
                  : "N.A",
                behaviour: e.behaviour,
                employee: e?.expand?.employee?.name,
                type: e.type,
                total_hours:
                  formatSeconds(
                    differenceInSeconds(
                      new Date(e.clockout_time || new Date()),
                      new Date(e.clockin_time)
                    )
                  ) || "---",
                created: new Date(e.created).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
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

  const newRecordModal = useModalState();

  const bulkImportModal = useModalState();

  const editRow = useEditRow();

  const confirmModal = useConfirmModal();

  const handleDelete = (e) => {
    confirmModal.setIsLoading(true);
    return pocketbase
      .collection("attendance")
      .delete(e.id)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("Attendance deleted succesfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex flex-col sm:flex-row sm:gap-0 sm:items-center gap-3 items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-[17px] font-semibold tracking-tight">
              Employee Attendance Logs
            </h2>
            <BreadCrumb
              items={[{ title: "Attendance logs", link: "/dashboard" }]}
            />
          </div>
          <div className="space-x-2">
            <Button
              onClick={() => {
                bulkImportModal.open();
              }}
              size="sm"
              className="hover:bg-white"
              variant="outline"
            >
              <PlusCircle size={16} className="mr-2" />
              <span>Bulk upload</span>
            </Button>
            <Button
              onClick={() => {
                newRecordModal.open();
              }}
              size="sm"
            >
              <PlusCircle size={16} className="mr-2" />
              <span>Mark Attendance.</span>
            </Button>
          </div>
        </div>
        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{ type: false }}
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
              title: "Behaviour",
              name: "behaviour",
              options: [
                { label: "Late", value: "late" },
                { label: "Early", value: "early" },
              ],
            },
            {
              title: "Type",
              name: "type",
              options: [
                { label: "auto", value: "auto" },
                { label: "manual", value: "manual" },
              ],
            },
            {
              title: "Attendance Date",
              type: "date",
              name: "created",
            },
            {
              title: "Employee",
              loader: ({ search }) => {
                console.log(search);
                return pocketbase
                  .collection("users")
                  .getFullList(
                    cleanObject({
                      filter: search ? `name~"${search}"` : "",
                    })
                  )
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "employee",
              type: "async-options",
            },
          ]}
        />
      </div>
      <AttendanceFormModal
        onComplete={() => {
          recordsQuery.refetch();
          newRecordModal.close();
          editRow.close();
        }}
        record={editRow.row}
        setOpen={editRow.isOpen ? editRow.setOpen : newRecordModal.setisOpen}
        open={newRecordModal.isOpen || editRow.isOpen}
      />{" "}
      <BulkAttendanceModal
        onComplete={() => {
          recordsQuery.refetch();
          bulkImportModal.close();
        }}
        record={editRow.row}
        setOpen={bulkImportModal.setisOpen}
        open={bulkImportModal.isOpen}
      />
      <ConfirmModal
        title={"Are you sure you want to delete?"}
        description={`Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi, amet
        a! Nihil`}
        meta={confirmModal.meta}
        onConfirm={handleDelete}
        isLoading={confirmModal.isLoading}
        open={confirmModal.isOpen}
        onClose={() => confirmModal.close()}
      />
    </>
  );
}

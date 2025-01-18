import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle } from "lucide-react";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { useState } from "react";
import { useQuery } from "react-query";
import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import useModalState from "@/hooks/useModalState";
import useEditRow from "@/hooks/use-edit-row";
import DataTableRowActions from "@/components/datatable/DataTableRowActions";
import ConfirmModal from "@/components/modals/ConfirmModal";
import useConfirmModal from "@/hooks/useConfirmModal";
import { toast } from "sonner";
import { ReservationFormModal } from "@/components/modals/ReservationFormModal";
import { addDays } from "date-fns";
import { useRoles } from "@/context/roles.context";
import formatFilter from "@/utils/formatFilter";

export default function Reservations() {
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
      accessorKey: "customer",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Customer" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("customer")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "assigned_to",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assigned to" />
      ),
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
      cell: ({ row }) => <div>{row.getValue("table")}</div>,
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "reserved_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reserved at" />
      ),
      cell: ({ row }) => <div>{row.getValue("reserved_at")}</div>,
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "guests",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Guests" />
      ),
      cell: ({ row }) => <div>{row.getValue("guests")}</div>,
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
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("status")}</div>
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
              title: "Edit reservation",
              hidden: !canPerform("update_reservation"),
              onClick: (e) => {
                editRow.edit(e.original);
              },
            },
            {
              title: "Delete reservation",
              hidden: !canPerform("delete_reservation"),
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
      "reservations",
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
        .collection("reservations")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters].filter((e) => e).join("&&"),
            sort: sorters,
            expand: `customer,assigned_to,table`,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                customer: e?.expand?.customer?.names,
                assigned_to: e?.expand?.assigned_to?.name,
                table: e.expand?.table?.name,
                reserved_at: new Date(e.reserved_at).toLocaleDateString(
                  "en-US",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ),
                guests: e.guests,
                status: e.status,
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

  const editRow = useEditRow();

  const confirmModal = useConfirmModal();

  const handleDelete = (e) => {
    confirmModal.setIsLoading(true);
    return pocketbase
      .collection("reservations")
      .delete(e.id)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("reservations deleted succesfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              All Reservations
            </h2>
            <BreadCrumb
              items={[{ title: " All Reservations", link: "/dashboard" }]}
            />
          </div>
          {canPerform("create_reservation") && (
            <Button onClick={() => newRecordModal.open()} size="sm">
              <PlusCircle size={16} className="mr-2" />
              <span>Create new Reservation.</span>
            </Button>
          )}
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
                { label: "confirmed", value: "confirmed" },
                { label: "pending", value: "pending" },
                { label: "canceled", value: "canceled" },
              ],
            },
            {
              title: "Reserved at",
              type: "date",
              name: "created",
            },
            {
              title: "Waiter",
              loader: ({ search }) => {
                return pocketbase
                  .collection("users")
                  .getFullList({
                    filter: search ? `name~"${search}"` : null,
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "assigned_to",
              type: "async-options",
            },
            {
              title: "Customer",
              loader: ({ search }) => {
                return pocketbase
                  .collection("customers")
                  .getFullList({
                    filter: search ? `names~"${search}"` : null,
                  })
                  .then((e) => e.map((e) => ({ label: e.names, value: e.id })));
              },
              type: "async-options",
              name: "customer",
            },
            {
              title: "Table",
              loader: ({ search }) => {
                return pocketbase
                  .collection("tables")
                  .getFullList({
                    filter: search ? `name~"${search}"` : null,
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "table",
              type: "async-options",
            },
          ]}
        />
      </div>

      <ReservationFormModal
        onComplete={() => {
          recordsQuery.refetch();
          newRecordModal.close();
          editRow.close();
        }}
        record={editRow.row}
        setOpen={editRow.isOpen ? editRow.setOpen : newRecordModal.setisOpen}
        open={newRecordModal.isOpen || editRow.isOpen}
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

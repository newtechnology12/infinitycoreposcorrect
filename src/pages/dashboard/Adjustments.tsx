import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
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
import { AdjustmentFormModal } from "@/components/modals/AdjustmentFormModal";
import { cn } from "@/utils";
import formatFilter from "@/utils/formatFilter";

export default function Adjustments() {
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
      accessorKey: "stock_item",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stock item" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("stock_item")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stock" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]- truncate flex items-center gap-2">
          <Link
            to={""}
            className="hover:underline flex items-center gap-2 capitalize hover:text-slate-600"
          >
            {row.getValue("stock")}
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
      accessorKey: "quantity_adjusted",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Adjusted" />
      ),
      cell: ({ row }) => {
        return (
          <div
            className={cn("capitalize truncate", {
              "!text-green-500": row.original.original.type === "addition",
              "!text-red-500": row.original.original.type === "reduction",
            })}
          >
            {row.original.original.type === "addition"
              ? "+"
              : row.original.original.type === "reduction"
              ? "-"
              : ""}
            {row.getValue("quantity_adjusted")}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "quantity_before",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Q Before" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {row.getValue("quantity_before")}
        </div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "quantity_after",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Q After" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {row.getValue("quantity_after")}
        </div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },

    {
      accessorKey: "reason",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Reason" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("reason")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },

    {
      accessorKey: "created_by",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created by" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("created_by")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },

    {
      accessorKey: "updated",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Updated at" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("updated")}</div>
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
        <div className="capitalize truncate">{row.getValue("created")}</div>
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
          actions={
            [
              // {
              //   title: "Edit adjustment",
              //   onClick: (e) => {
              //     editRow.edit(e.original);
              //   },
              // },
              // {
              //   title: "delete adjustment",
              //   onClick: (e) => {
              //     confirmModal.open({ meta: e });
              //   },
              // },
            ]
          }
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
      "adjustments",
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
        ? `stock.name~"${searchText}" || reason~"${searchText}" || created_by.name~"${searchText}" || stock_item.menu_item.name~"${searchText}" || stock_item.ingredient.name~"${searchText}"`
        : "";

      const filters = formatFilter(columnFilters);

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      return pocketbase
        .collection("adjustments")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters].filter((e) => e).join("&&"),
            sort: sorters,
            expand:
              "stock,created_by,stock_item,stock_item.item,stock_item.item.menu",
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              const stock_item = e?.expand?.stock_item?.expand;
              return {
                id: e.id,
                stock: e.expand?.stock?.name || "N.A",
                quantity_adjusted: e.quantity_adjusted,
                quantity_after: e.quantity_after,
                quantity_before: e.quantity_before,
                stock_item:
                  stock_item?.item?.name ||
                  stock_item?.item?.expand?.menu?.name,
                reason: e?.reason || "---",
                created_by: e?.expand?.created_by?.name || 0,
                created: new Date(e.created).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  minute: "2-digit",
                  hour: "2-digit",
                }),
                updated: new Date(e.created).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  minute: "2-digit",
                  hour: "2-digit",
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
      .collection("adjustments")
      .delete(e.id)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("adjustmenr deleted succesfully");
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
              All Adjustments
            </h2>
            <BreadCrumb
              items={[{ title: "All Adjustments", link: "/dashboard" }]}
            />
          </div>
          <Button onClick={() => newRecordModal.open()} size="sm">
            <PlusCircle size={16} className="mr-2" />
            <span>Create new Adjustment.</span>
          </Button>
        </div>
        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{ updated: false, created_by: true }}
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
              title: "Stock",
              loader: () => {
                return pocketbase
                  .collection("stocks")
                  .getFullList()
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "stock",
              type: "async-options",
            },
            {
              title: "Reason",
              options: [
                { label: "Count", value: "count" },
                { label: "Transfer", value: "transfer" },
                { label: "Recieved", value: "recieved" },
                { label: "Return stock", value: "return stock" },
                { label: "Damaged", value: "damaged" },
                { label: "Purchase", value: "purchase" },
                { label: "Theft or loss", value: "theft or loss" },
                {
                  label: "Promotion or donation",
                },
              ],
              name: "reason",
            },
            {
              title: "Adjustment Date",
              type: "date",
              name: "created",
            },
            {
              title: "Created by",
              loader: ({ search }) => {
                return pocketbase
                  .collection("users")
                  .getFullList(
                    cleanObject({
                      filter: search ? `name~"${search}"` : "",
                    })
                  )
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "created_by",
              type: "async-options",
            },
            {
              title: "Stock item",
              loader: ({ search }) => {
                return pocketbase
                  .collection("raw_items")
                  .getFullList(
                    cleanObject({
                      filter: search ? `name~"${search}"` : "",
                      expand: "menu",
                    })
                  )
                  .then((e) =>
                    e.map((e) => ({
                      label: e?.name,
                      value: e.id,
                    }))
                  );
              },
              name: "stock_item",
              type: "async-options",
            },
          ]}
        />
      </div>

      <AdjustmentFormModal
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

import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Upload } from "lucide-react";
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
import { IngredientFormModal } from "@/components/modals/IngredientFomrModal";
import { BulkImport } from "@/components/modals/BulkImport";
import formatFilter from "@/utils/formatFilter";

export default function Ingredients() {
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
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]- flex items-center gap-2">
          <Link
            to={""}
            className="hover:underline truncate flex items-center gap-2 capitalize hover:text-slate-600"
          >
            {row.getValue("name")}
          </Link>
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "unit",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Unit" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("unit")}</div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    // {
    //   accessorKey: "cost",
    //   header: ({ column }) => (
    //     <DataTableColumnHeader column={column} title="Cost" />
    //   ),
    //   cell: ({ row }) => (
    //     <div className="capitalize truncate">
    //       {Number(row.getValue("cost")).toLocaleString()} FRW
    //     </div>
    //   ),
    //   enableSorting: true,
    //   filterFn: (__, _, value) => {
    //     return value;
    //   },
    //   enableHiding: true,
    // },
    {
      accessorKey: "supplier",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Supplier" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("supplier")}</div>
      ),
      enableSorting: false,
      filterFn: (__, _, value) => {
        return value;
      },
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
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
      ),
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            {
              title: "Edit ingredient",
              onClick: (e) => {
                editRow.edit(e.original);
              },
            },
            // {
            //   title: "delete ingredient",
            //   onClick: (e) => {
            //     confirmModal.open({ meta: e });
            //   },
            // },
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
      "ingredients",
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
        ? `name~"${searchText}" || unit.name~"${searchText}"`
        : "";
      const filters = formatFilter(columnFilters);

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      return pocketbase
        .collection("raw_items")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters].filter((e) => e).join("&&"),
            sort: sorters,
            expand: "stock,supplier,unit,menu",
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                name: e.name || e.expand?.menu?.name || "N.A",
                unit: e?.expand?.unit?.name || "N.A",
                // cost: e.cost,
                supplier: e?.expand?.supplier?.names || "N.A",
                created: new Date(e.created).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
                updated: new Date(e.updated).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
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
      .collection("raw_items")
      .delete(e.id)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("ingredients deleted succesfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  const bulkImportModal = useModalState();

  const handleValidateBulkImport = async (rows) => {
    const errors = [];
    // Validation for each row
    for (let i = 0; i < rows.length; i++) {
      // handle logic validation here
    }
    return errors;
  };

  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex flex-col sm:flex-row sm:gap-0 sm:items-center gap-3 items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Raw items
            </h2>
            <BreadCrumb
              items={[{ title: "All Raw items", link: "/dashboard" }]}
            />
          </div>
          <div className="space-x-2">
            <Button onClick={() => newRecordModal.open()} size="sm">
              <PlusCircle size={16} className="mr-2" />
              <span>Create new raw item</span>
            </Button>
            {/* <Button
              onClick={() => {
                bulkImportModal.open();
              }}
              size="sm"
              className="hover:bg-white"
              variant="outline"
            >
              <Upload size={16} className="mr-2" />
              <span>Import Ingredients</span>
            </Button> */}
          </div>
        </div>
        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{}}
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
              title: "Unit",
              loader: ({ search }) => {
                return pocketbase
                  .collection("measurements")
                  .getFullList({
                    filter: `name~"${search}"`,
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "unit",
              type: "async-options",
            },
            {
              title: "Supplier",
              name: "supplier",
              type: "async-options",
              loader: ({ search = "" }) => {
                return pocketbase
                  .collection("suppliers")
                  .getList(0, 5, {
                    filter: search ? `names~"${search}"` : "",
                  })
                  .then((e) =>
                    e.items.map((e) => ({ label: e.names, value: e.id }))
                  );
              },
            },
          ]}
        />
      </div>
      <IngredientFormModal
        onComplete={() => {
          recordsQuery.refetch();
          newRecordModal.close();
          editRow.close();
        }}
        ingredient={editRow.row}
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
      <BulkImport
        open={bulkImportModal.isOpen}
        setOpen={bulkImportModal.setisOpen}
        name="ingredients"
        onComplete={() => {
          recordsQuery.refetch();
          bulkImportModal.close();
        }}
        sample={[
          {
            Name: "Rice",
            Unit: "kg",
            // Cost: 1200,
            Supplier: "75678987",
          },
        ]}
        expectedColumns={["Name", "Unit", "Supplier"]}
        parseEntity={(e) => {
          return {
            name: e["Name"],
            unit: e["Unit"],
            // cost: e["Cost"],
            supplier: e["Supplier"],
          };
        }}
        validate={handleValidateBulkImport}
      />
    </>
  );
}

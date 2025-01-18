import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
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
import { CategoryFormModal } from "@/components/modals/CategoryFormModal";
import truncateString from "@/utils/truncateString";
import ConfirmModal from "@/components/modals/ConfirmModal";
import useConfirmModal from "@/hooks/useConfirmModal";
import { toast } from "sonner";
import { addDays } from "date-fns";
import { BulkImport } from "@/components/modals/BulkImport";
import formatFilter from "@/utils/formatFilter";

export const orderSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  parent: z.string(),
  created: z.string(),
  itemsCount: z.string(),
});

export type Order = z.infer<typeof orderSchema>;

export default function Categories() {
  const columns: ColumnDef<Order>[] = [
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
      accessorKey: "parent",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Parent" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("parent")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "itemsCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Menus" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("itemsCount")}</div>
      ),
      enableSorting: false,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "destinations",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Destinations" />
      ),
      cell: ({ row }) => (
        <div className="capitalize flex gap-2">
          {Array.isArray(row?.original["destinations"])
            ? row?.original["destinations"].map((e) => (
                <div className="text-[12px] truncate bg-slate-100 px-3 py-[2px] rounded-[4px]">
                  {e}
                </div>
              ))
            : "N.A"}
        </div>
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
              title: "Edit category",
              onClick: (e) => {
                editRow.edit(e.original);
              },
            },
            {
              title: "delete category",
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

  const categories = useQuery({
    queryKey: [
      "categories",
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
        ? `name~"${searchText}" || parent.name~"${searchText}" `
        : "";

      const filters = formatFilter(columnFilters);

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      return pocketbase
        .collection("categories")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters].filter((e) => e).join("&&"),
            expand: "parent,items,destinations",
            sort: sorters,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                name: e.name,
                description: truncateString(e.description, 50) || "N.A",
                parent: e?.expand?.parent?.name || "N.A",
                created: new Date(e.created).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
                updated: new Date(e.updated).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }),
                itemsCount: e?.expand?.parent?.menus?.length || 0,
                destinations: e?.expand?.destinations?.map((e) => e.name),
                original: e,
              };
            }),
            totalPages: e.totalPages,
          };
        });
    },
    enabled: true,
  });

  const newCategoryModal = useModalState();

  const editRow = useEditRow();

  const confirmModal = useConfirmModal();

  const handleDelete = (e) => {
    confirmModal.setIsLoading(true);
    return pocketbase
      .collection("categories")
      .delete(e.id)
      .then(() => {
        categories.refetch();
        confirmModal.close();
        toast.success("Category deleted succesfully");
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
              Categories
            </h2>
            <BreadCrumb
              items={[{ title: "All Category", link: "/dashboard" }]}
            />
          </div>
          <div className="space-x-2 flex ">
            <Button onClick={() => newCategoryModal.open()} size="sm">
              <PlusCircle size={16} className="mr-2" />
              <span>Create new Category</span>
            </Button>{" "}
            <Button
              onClick={() => {
                bulkImportModal.open();
              }}
              size="sm"
              className="hover:bg-white"
              variant="outline"
            >
              <Upload size={16} className="mr-2" />
              <span>Import Categories</span>
            </Button>
          </div>
        </div>
        <DataTable
          isFetching={categories.isFetching}
          defaultColumnVisibility={{
            itemsCount: false,
          }}
          isLoading={categories.status === "loading"}
          data={categories?.data?.items || []}
          columns={columns}
          onSearch={(e) => {
            setsearchText(e);
          }}
          sorting={sorting}
          setSorting={setSorting}
          pageCount={categories?.data?.totalPages}
          setPagination={setPagination}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setColumnFilters={setColumnFilters}
          columnFilters={columnFilters}
          facets={[
            {
              title: "Parent",
              loader: ({ search = "" }) => {
                return pocketbase
                  .collection("categories")
                  .getFullList({
                    filter: `parent='' && name~"${search}"`,
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "parent",
              type: "async-options",
            },
          ]}
        />
      </div>

      <CategoryFormModal
        onComplete={() => {
          categories.refetch();
          newCategoryModal.close();
          editRow.close();
        }}
        category={editRow.row}
        setOpen={editRow.isOpen ? editRow.setOpen : newCategoryModal.setisOpen}
        open={newCategoryModal.isOpen || editRow.isOpen}
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
        name="categories"
        onComplete={() => {
          categories.refetch();
          bulkImportModal.close();
        }}
        sample={[
          {
            Name: "Drinks",
            Description: "drinks category",
            Id: "1",
            "Parent Id": "",
          },
        ]}
        expectedColumns={["Name", "Description", "Id", "Parent Id"]}
        parseEntity={(e) => {
          return {
            name: e["Name"],
            description: e["Description"],
            id: e["Id"]?.trim(),
            parent: e["Parent Id"]?.trim(),
          };
        }}
        validate={handleValidateBulkImport}
      />
    </>
  );
}

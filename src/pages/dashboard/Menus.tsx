import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Upload } from "lucide-react";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { useState } from "react";
import { useQuery } from "react-query";
import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import useModalState from "@/hooks/useModalState";
import useEditRow from "@/hooks/use-edit-row";
import DataTableRowActions from "@/components/datatable/DataTableRowActions";
import { MenuFormModal } from "@/components/modals/MenuFormModal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import useConfirmModal from "@/hooks/useConfirmModal";
import { toast } from "sonner";
import truncateString from "@/utils/truncateString";
import { BulkImport } from "@/components/modals/BulkImport";
import formatFilter from "@/utils/formatFilter";
import { BulkUpdate } from "@/components/modals/BulkUpdate";

export default function Menus() {
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
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Id" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]- capitalize  truncate flex items-center gap-2">
          {truncateString(row.getValue("id"), 30)}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]- capitalize  truncate flex items-center gap-2">
          {truncateString(row.getValue("name"), 30)}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Category" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("category")}</div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "subCategory",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Sub Category" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("subCategory")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "destination",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Destination" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("destination")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "availability",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Availability" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("availability")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("price")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "cost",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cost" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("cost")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "supplier",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="supplier" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("supplier")}</div>
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
          actions={[
            {
              title: "Edit menu",
              onClick: (e) => {
                editRow.edit(e.original);
              },
            },
            // {
            //   title: "delete menu",
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
      "menus",
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
        ? `name~"${searchText}" || category.name~"${searchText}" || subCategory.name~"${searchText}"`
        : "";

      const filters = formatFilter(columnFilters);

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      return pocketbase
        .collection("menu_items")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters].filter((e) => e).join("&&"),
            expand:
              "category,subCategory,ingredients,ingredients.ingredient,destination,supplier,ingredients.ingredient.unit",
            sort: sorters,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              const varintsPrice = e?.variants
                ?.map((e) => Number(e.price).toLocaleString() + " FRW")
                .join(" - ");
              return {
                id: e.id,
                name: e.name,
                image: e.image,
                category: e?.expand?.category?.name || "N.A",
                subCategory: e?.expand?.subCategory?.name || "N.A",
                destination: e?.expand?.destination?.name || "N.A",
                supplier: e?.expand?.supplier?.names || "N.A",
                price: e?.variants?.length
                  ? varintsPrice
                  : Number(e?.price).toLocaleString() + " FRW",

                cost: e?.cost || "N.A",
                availability: e?.availability,
                image_file: e?.image_file,
                created: new Date(e.created).toLocaleDateString("en-US", {
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
      .collection("menu_items")
      .delete(e.id)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("menu deleted succesfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  const bulkImportModal = useModalState();

  const bulkUpdateModal = useModalState();

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
              Food & Menu Items
            </h2>
            <BreadCrumb
              items={[{ title: "All menu items", link: "/dashboard" }]}
            />
          </div>
          <div className="space-x-2">
            <Button onClick={() => newRecordModal.open()} size="sm">
              <PlusCircle size={16} className="mr-2" />
              <span>Create new Item</span>
            </Button>
            <Button
              onClick={() => {
                bulkUpdateModal.open();
              }}
              size="sm"
              className="hover:bg-white"
              variant="outline"
            >
              <Upload size={16} className="mr-2" />
              <span>Bulk Update Items</span>
            </Button>
            <Button
              onClick={() => {
                bulkImportModal.open();
              }}
              size="sm"
              className="hover:bg-white"
              variant="outline"
            >
              <Upload size={16} className="mr-2" />
              <span>Import Menu items</span>
            </Button>
          </div>
        </div>
        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{
            destination: true,
            supplier: false,
            id: false,
          }}
          isLoading={recordsQuery.status === "loading"}
          data={recordsQuery?.data?.items || []}
          columns={columns}
          onSearch={(e) => {
            setsearchText(e);
          }}
          facets={[
            {
              title: "Category",
              loader: ({ search }) => {
                return pocketbase
                  .collection("categories")
                  .getFullList({
                    filter: [`parent=''`, search ? `name~"${search}"` : ""]
                      .filter((e) => e)
                      .join(" && "),
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "category",
              type: "async-options",
            },
            {
              title: "Stock",
              loader: () => {
                return pocketbase
                  .collection("stocks")
                  .getList(0, 5)
                  .then((e) =>
                    e.items.map((e) => ({ label: e.name, value: e.id }))
                  );
              },
              name: "stock",
              type: "async-options",
            },
            {
              title: "Sub Category",
              loader: ({ search }) =>
                pocketbase
                  .collection("categories")
                  .getFullList({
                    filter: [`parent!=''`, search ? `name~"${search}"` : ""]
                      .filter((e) => e)
                      .join(" && "),
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id }))),
              name: "subCategory",
              type: "async-options",
            },
            {
              title: "Availability",
              name: "availability",
              options: [
                { label: "Available", value: "available" },
                { label: "Unavailable", value: "unavailable" },
              ],
            },
            {
              title: "Destination",
              name: "destination",
              type: "async-options",
              loader: () => {
                return pocketbase
                  .collection("order_stations")
                  .getList(0, 5)
                  .then((e) =>
                    e.items.map((e) => ({ label: e.name, value: e.id }))
                  );
              },
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
          sorting={sorting}
          setSorting={setSorting}
          pageCount={recordsQuery?.data?.totalPages}
          setPagination={setPagination}
          pageIndex={pageIndex}
          pageSize={pageSize}
          setColumnFilters={setColumnFilters}
          columnFilters={columnFilters}
        />
      </div>

      <MenuFormModal
        onComplete={() => {
          recordsQuery.refetch();
          newRecordModal.close();
          editRow.close();
        }}
        menu={editRow.row}
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
        name="menu_items"
        onComplete={() => {
          recordsQuery.refetch();
          bulkImportModal.close();
        }}
        sample={[
          {
            Name: "Primus",
            Description:
              "Primus is a beer brand owned by Heineken and its subsidiaries, and was originally brewed in 1810 by Brasserie Mutzig of Alsace",
            Price: 1200,
            "Sub Category Id": "sub_category_id",
            "Category Id": "category_id",
          },
        ]}
        expectedColumns={[
          "Name",
          "Description",
          "Price",
          "Sub Category Id",
          "Category Id",
        ]}
        parseEntity={(e) => {
          return {
            name: e["Name"],
            description: e["Description"],
            price: e["Price"],
            category: e["Category Id"],
            subCategory: e["Sub Category Id"],
            availability: "available",
          };
        }}
        validate={handleValidateBulkImport}
      />

      <BulkUpdate
        open={bulkUpdateModal.isOpen}
        setOpen={bulkUpdateModal.setisOpen}
        name="menu_items"
        onComplete={() => {
          recordsQuery.refetch();
          bulkUpdateModal.close();
        }}
        sample={recordsQuery?.data?.items?.map((e) => {
          return {
            Id: e?.id,
            Name: e?.name,
            Price: e?.original?.price,
          };
        })}
        expectedColumns={["Id", "Name", "Price"]}
        parseEntity={(e) => {
          return {
            id: e["Id"],
            name: e["Name"],
            price: e["Price"],
          };
        }}
        validate={handleValidateBulkImport}
      />
    </>
  );
}

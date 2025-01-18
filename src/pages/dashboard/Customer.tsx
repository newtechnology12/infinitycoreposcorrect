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
import { CustomerFormModal } from "@/components/modals/CustomerFormModal";
import { BulkImport } from "@/components/modals/BulkImport";
import formatFilter from "@/utils/formatFilter";

export default function Customers() {
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
      accessorKey: "names",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Names" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]- flex items-center gap-2">
          <Link
            to={""}
            className="hover:underline flex items-center gap-2 capitalize hover:text-slate-600"
          >
            {row.getValue("names")}
          </Link>
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("email")}</div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Phone" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("phone")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },

    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("type")}</div>
      ),
      enableSorting: false,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "balance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Balance" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">
          {Number(row.getValue("balance")).toLocaleString()} FRW
        </div>
      ),
      enableHiding: true,
    },
    {
      accessorKey: "address",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Address" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("address")}</div>
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
      id: "actions",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Actions" />
      ),
      cell: ({ row }) => (
        <DataTableRowActions
          actions={[
            {
              title: "Edit customer",
              onClick: (e) => {
                editRow.edit(e.original);
              },
            },
            {
              title: "delete customer",
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
      "customers",
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
      const searchQ = searchText ? `names~"${searchText}"` : "";
      const filters = formatFilter(columnFilters);
      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      return pocketbase
        .collection("customers")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters].filter((e) => e).join("&&"),
            sort: sorters,
          }),
        })
        .then((e) => {
          // Create an array of promises to get the balance for each customer
          const balancePromises = e?.items?.map((customer) =>
            pocketbase.collection("credits").getFullList({
              filter: `customer="${customer.id}" && status="pending"`,
            })
          );

          // Use Promise.all to wait for all the balance promises to resolve
          return Promise.all(balancePromises).then((balances) => {
            return {
              items: e?.items?.map((customer, index) => {
                return {
                  id: customer.id,
                  names: customer.names,
                  phone: customer.phone,
                  email: customer.email || "N.A",
                  type: customer.type || "N.A",
                  address: customer.address || "N.A",
                  balance: balances[index].reduce(
                    (acc, credit) => acc + credit.amount,
                    0
                  ),
                  created: new Date(customer.created).toLocaleDateString(
                    "en-US",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  ),
                  original: customer,
                };
              }),
              totalPages: e.totalPages,
            };
          });
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
      .collection("customers")
      .delete(e.id)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("customer deleted succesfully");
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
              All Customers
            </h2>
            <BreadCrumb
              items={[{ title: "All Customers", link: "/dashboard" }]}
            />
          </div>
          <div className="space-x-2">
            <Button onClick={() => newRecordModal.open()} size="sm">
              <PlusCircle size={16} className="mr-2" />
              <span>Create new Customers</span>
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
              <span>Import Customers</span>
            </Button>
          </div>
        </div>
        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{
            address: true,
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
          facets={[]}
        />
      </div>

      <CustomerFormModal
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

      <BulkImport
        open={bulkImportModal.isOpen}
        setOpen={bulkImportModal.setisOpen}
        name="customers"
        onComplete={() => {
          recordsQuery.refetch();
          bulkImportModal.close();
        }}
        sample={[
          {
            Names: "John",
            Phone: "+250788209629",
            Email: "john@mail.com",
            Address: "Kigali",
          },
        ]}
        expectedColumns={["Names", "Phone", "Email", "Address"]}
        parseEntity={(e) => {
          return {
            names: e["Names"],
            phone: e["Phone"],
            email: e["Email"],
            address: e["Address"],
            type: "client",
          };
        }}
        validate={handleValidateBulkImport}
      />
    </>
  );
}

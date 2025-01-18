import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
import { PurchaseFormModal } from "@/components/modals/PurchaseFormModal";
import { RecievePurchaseModal } from "@/components/modals/RecievePurchaseModal";
import { PurchasePaymentModal } from "@/components/modals/PurchasePaymentModal";
import useViewRow from "@/hooks/use-view-row";
import { PurchasePaymentsModal } from "@/components/modals/PaymentsModal";
import { cn } from "@/utils";
import formatFilter from "@/utils/formatFilter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function Purchases() {
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
      accessorKey: "stock",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Stock" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("stock")}</div>
      ),
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "total",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total cost" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">
          {Number(row.getValue("total")).toLocaleString()} FRW
        </div>
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
        <DataTableColumnHeader column={column} title="Items Count" />
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
      accessorKey: "created_by",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created by" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("created_by")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "requested_by",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Requested by" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("requested_by")}</div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
      enableHiding: true,
    },
    {
      accessorKey: "payment_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Payment status" />
      ),
      cell: ({ row }) => (
        <div className="w-[80px]- flex items-center gap-2">
          <Link
            to={""}
            className="hover:underline flex items-center gap-2 capitalize hover:text-slate-600"
          >
            {row.getValue("payment_status")}
          </Link>
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
      filterFn: (__, _, value) => {
        return value;
      },
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
        <Button
          size={"sm"}
          onClick={() => {
            navigate(`/dashboard/inventory/purchases/${row.original.id}`);
          }}
          className="text-blue-500 px-5"
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
    pageSize: 10,
  });

  const [activeTab, setActiveTab] = useState("pending");

  const recordsQuery = useQuery({
    queryKey: [
      "purchases",
      {
        columnFilters,
        search: searchText,
        sort: sorting,
        pageIndex,
        pageSize,
        activeTab,
      },
    ],
    keepPreviousData: true,
    queryFn: () => {
      const searchQ = searchText
        ? `stock.name~"${searchText}" || created_by.name~"${searchText}"`
        : "";
      const filters = formatFilter(columnFilters);

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      return pocketbase
        .collection("purchases")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters, `status="${activeTab}"`]
              .filter((e) => e)
              .join("&&"),
            sort: sorters,
            expand: "stock,created_by,payments,items,requisition.requested_by",
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                date: new Date(e.created).toLocaleDateString("en-US"),
                stock: e?.expand?.stock?.name,
                total:
                  e?.expand?.items?.reduce(
                    (a, b) => a + b.cost * b.quantity,
                    0
                  ) || 0,
                payment_status: e.payment_status,
                status: e.status,
                itemsCount:
                  e?.expand?.items?.reduce((a, b) => a + b.quantity, 0) || 0,
                created_by: e?.expand?.created_by?.name || 0,
                requested_by:
                  e?.expand?.requisition?.expand?.requested_by?.name,
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
  const recievePurchaseRow = useEditRow();

  const confirmModal = useConfirmModal();

  const paymentRow = useEditRow();
  const viewPaymentsModal = useViewRow();

  const handleDelete = (e) => {
    confirmModal.setIsLoading(true);
    return pocketbase
      .collection("purchases")
      .delete(e.id)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("purchases deleted succesfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  const navigate = useNavigate();

  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              All Purchase orders
            </h2>
            <BreadCrumb
              items={[{ title: "All Purchase orders", link: "/dashboard" }]}
            />
          </div>
          {/* <Button
            onClick={() => {
              navigate("/dashboard/inventory/purchases/new");
            }}
            size="sm"
          >
            <PlusCircle size={16} className="mr-2" />
            <span>Create new Purchase</span>
          </Button> */}
        </div>
        <div className=" bg-white scroller border-t border-l border-r rounded-t">
          <ScrollArea className="w-full  whitespace-nowrap">
            <div className="flex px-2 items-center  justify-start">
              {[
                { title: "Pending Purchases", name: "pending" },
                { title: "Recived Purchases", name: "recieved" },
              ].map((e, i) => {
                return (
                  <a
                    key={i}
                    className={cn(
                      "cursor-pointer px-6 capitalize text-center relative w-full- text-slate-700 text-[13px] sm:text-sm py-3  font-medium",
                      {
                        "text-primary ": activeTab === e.name,
                      }
                    )}
                    onClick={() => {
                      setActiveTab(e.name);
                    }}
                  >
                    {activeTab === e.name && (
                      <div className="h-[3px] left-0 rounded-t-md bg-primary absolute bottom-0 w-full"></div>
                    )}
                    <span className=""> {e.title}</span>
                  </a>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{
            updated: false,
            date: false,
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
              title: "Created by",
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
              name: "created_by",
              type: "async-options",
            },
            {
              title: "Payment status",
              options: [
                { label: "unpaid", value: "unpaid" },
                { label: "paid", value: "paid" },
                { label: "partial", value: "partial" },
              ],
              name: "payment_status",
            },
          ]}
        />
      </div>

      <PurchaseFormModal
        onComplete={() => {
          recordsQuery.refetch();
          newRecordModal.close();
          editRow.close();
        }}
        record={editRow.row}
        setOpen={editRow.isOpen ? editRow.setOpen : newRecordModal.setisOpen}
        open={newRecordModal.isOpen || editRow.isOpen}
      />

      <PurchasePaymentModal
        onComplete={() => {
          recordsQuery.refetch();
          paymentRow.close();
        }}
        record={paymentRow.row}
        setOpen={paymentRow.isOpen ? paymentRow.setOpen : paymentRow.setOpen}
        open={paymentRow.isOpen}
      />

      <PurchasePaymentsModal
        onComplete={() => {
          recordsQuery.refetch();
          viewPaymentsModal.close();
        }}
        payments={viewPaymentsModal.row?.expand?.payments}
        setOpen={
          viewPaymentsModal.isOpen
            ? viewPaymentsModal.setOpen
            : viewPaymentsModal.setOpen
        }
        open={viewPaymentsModal.isOpen}
      />

      <RecievePurchaseModal
        onComplete={() => {
          recordsQuery.refetch();
          recievePurchaseRow.close();
        }}
        purchase={recievePurchaseRow.row}
        setOpen={
          recievePurchaseRow.isOpen
            ? recievePurchaseRow.setOpen
            : recievePurchaseRow.setOpen
        }
        open={recievePurchaseRow.isOpen || recievePurchaseRow.isOpen}
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

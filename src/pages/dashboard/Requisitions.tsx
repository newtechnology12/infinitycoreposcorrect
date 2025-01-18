import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import useModalState from "@/hooks/useModalState";
import useEditRow from "@/hooks/use-edit-row";
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
import { useRoles } from "@/context/roles.context";
import { useAuth } from "@/context/auth.context";

export default function Requisitions() {
  const [activeTab, setActiveTab] = useState("pending");

  const columns: ColumnDef<any>[] = useMemo(() => {
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            // @ts-ignore
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
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
        accessorKey: "requested_by",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Requested by" />
        ),
        cell: ({ row }) => (
          <div className="capitalize truncate">
            {row.getValue("requested_by")}
          </div>
        ),
        filterFn: (__, _, value) => {
          return value;
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: "department",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Department" />
        ),
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("department")}</div>
        ),
        filterFn: (__, _, value) => {
          return value;
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: "stock",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Stock" />
        ),
        cell: ({ row }) => (
          <div className="capitalize truncate">{row.getValue("stock")}</div>
        ),
        filterFn: (__, _, value) => {
          return value;
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: "total",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total" />
        ),
        cell: ({ row }) => (
          <div className="capitalize truncate">
            {row.getValue("total").toLocaleString()} FRW
          </div>
        ),
        filterFn: (__, _, value) => {
          return value;
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: "items_count",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Items count" />
        ),
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("items_count")}</div>
        ),
        filterFn: (__, _, value) => {
          return value;
        },
        enableSorting: true,
        enableHiding: true,
      },
      activeTab === "approved"
        ? {
            accessorKey: "approved_by",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Approved By" />
            ),
            cell: ({ row }) => (
              <div className="capitalize">{row.getValue("approved_by")}</div>
            ),
            filterFn: (__, _, value) => {
              return value;
            },
            enableSorting: true,
            enableHiding: true,
          }
        : undefined,
      activeTab === "rejected"
        ? {
            accessorKey: "rejected_by",
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="Rejected By" />
            ),
            cell: ({ row }) => (
              <div className="capitalize">{row.getValue("rejected_by")}</div>
            ),
            filterFn: (__, _, value) => {
              return value;
            },
            enableSorting: true,
            enableHiding: true,
          }
        : undefined,

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
              navigate(`/dashboard/inventory/requisitions/${row.original.id}`);
            }}
            className="text-blue-500 px-5"
            variant="link"
          >
            View Details
          </Button>
        ),
      },
    ].filter(Boolean);
  }, [activeTab]);

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

  const { canPerform } = useRoles();

  const { user } = useAuth();

  const recordsQuery = useQuery({
    queryKey: [
      "requisitions",
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
        ? `stock.name~"${searchText}" || created_by.name~"${searchText}" || supplier.name~"${searchText}"`
        : "";
      const filters = formatFilter(columnFilters);

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      // view_all_requisition_orders
      const permitionQ = !canPerform("view_all_requisition_orders")
        ? `created_by.id="${user.id}"`
        : "";

      return pocketbase
        .collection("requisitions")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [
              searchQ,
              filters,
              `status="${activeTab}"`,
              permitionQ,
              `purchase.status!="recieved"`,
            ]
              .filter((e) => e)
              .join("&&"),
            sort: sorters,
            expand:
              "requested_by,department,approved_by,rejected_by,items,stock",
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                requested_by: e.expand.requested_by?.name,
                department: e.expand.department?.name,
                items_count:
                  e?.expand?.items?.reduce(
                    (a, b) => a + (b.quantity || 0),
                    0
                  ) || 0,
                status: e?.status,
                total:
                  e?.expand?.items?.reduce(
                    (a, b) => a + b.cost * b.quantity,
                    0
                  ) || 0,
                approved_by: e.expand.approved_by?.name || "N.A",
                rejected_by: e.expand.rejected_by?.name || "N.A",
                stock: e?.expand?.stock?.name,
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
      .collection("requisitions")
      .delete(e.id)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("requisitions deleted succesfully");
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
              All Requisition orders.
            </h2>
            <BreadCrumb
              items={[{ title: "All Requisition orders", link: "/dashboard" }]}
            />
          </div>
          <Button
            onClick={() => {
              navigate("/dashboard/inventory/requisitions/new");
            }}
            size="sm"
          >
            <PlusCircle size={16} className="mr-2" />
            <span>Create new requisition</span>
          </Button>
        </div>
        <div className=" bg-white scroller border-t border-l border-r rounded-t">
          <ScrollArea className="w-full  whitespace-nowrap">
            <div className="flex px-2 items-center  justify-start">
              {[
                { title: "Pending Requisitions", name: "pending" },
                { title: "Approved Requisitions", name: "approved" },
                { title: "Rejected Requisitions", name: "rejected" },
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
            created_by: false,
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
              title: "Department",
              loader: ({ search }) => {
                return pocketbase
                  .collection("departments")
                  .getFullList({
                    filter: search ? `name~"${search}"` : "",
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "department",
              type: "async-options",
            },
            {
              title: "Requested by",
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
              name: "requested_by",
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

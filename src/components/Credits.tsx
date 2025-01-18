import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import useModalState from "@/hooks/useModalState";
import useEditRow from "@/hooks/use-edit-row";
import DataTableRowActions from "@/components/datatable/DataTableRowActions";
import ConfirmModal from "@/components/modals/ConfirmModal";
import useConfirmModal from "@/hooks/useConfirmModal";
import { toast } from "sonner";
import { CreditFormModal } from "@/components/modals/CreditFormModal";
import CreditsPaymentsModal from "./modals/CreditsPaymentsModal";
import { cn } from "@/utils";
import formatFilter from "@/utils/formatFilter";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

function formatDate(inputDate) {
  // Split the input string into year and month parts
  var parts = inputDate.split(".");

  // Create a new Date object with the provided year and month
  var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1);

  // Format the date in a readable format
  var formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  // Return the formatted date
  return formattedDate;
}

export default function Credits({ type }) {
  const entity =
    type === "customers" ? "customer" : type === "employees" ? "employee" : "";
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
      accessorKey: entity,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={entity} />
      ),
      cell: ({ row }) => (
        <span className="capitalize truncate">{row.getValue(entity)}</span>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {Number(row.getValue("amount")).toLocaleString()} FRW
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "paid_amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Paid Amount" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">
          {Number(row.getValue("paid_amount")).toLocaleString()} FRW
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "remaining_amount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Remaining Amount" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">
          {Number(row.getValue("remaining_amount")).toLocaleString()} FRW
        </div>
      ),
      filterFn: (__, _, value) => {
        return value;
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "monthly_deduction",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Monthly deduction" />
      ),
      cell: ({ row }) => (
        <div className="capitalize">
          {Number(row.getValue("monthly_deduction") || 0).toLocaleString()} FRW
        </div>
      ),
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
      accessorKey: "created_by",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created by" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("created_by")}</div>
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
              title: "Edit credit",
              onClick: (e) => {
                editRow.edit(e.original);
              },
            },
            {
              title: "View payments",
              onClick: (e) => {
                setCreditToViewPayment(e.original);
              },
            },
            // {
            //   title: "Delete credit",
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

  const [creditToViewPayment, setCreditToViewPayment] = useState(undefined);

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

  const [activeTab, setActiveTab] = useState("pending");

  const recordsQuery = useQuery({
    queryKey: [
      "credits",
      {
        columnFilters,
        search: searchText,
        sort: sorting,
        pageIndex,
        pageSize,
        type,
        activeTab,
      },
    ],
    keepPreviousData: true,
    queryFn: () => {
      const searchQ = searchText
        ? `employee.name~"${searchText}" || customer.name~"${searchText}"`
        : "";
      const filters = formatFilter(columnFilters);

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      return pocketbase
        .collection("credits")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters, `${entity}!=""`, `status="${activeTab}"`]
              .filter((e) => e)
              .join("&&"),
            sort: sorters,
            expand: `${entity},created_by,transactions,transactions.payment_method,transactions.created_by`,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              console.log(e.transactions.map((e) => e.amount));
              return {
                id: e.id,
                [entity]: e.expand?.[entity]?.name || e.expand?.[entity]?.names,
                amount: e.amount,
                paid_amount:
                  e?.expand?.transactions
                    ?.map((e) => e.amount)
                    .reduce((a, b) => a + b, 0) || -0,
                remaining_amount:
                  e.amount -
                  (e?.expand?.transactions
                    ?.map((e) => e.amount)
                    .reduce((a, b) => a + b, 0) || -0),
                status: e.status,
                deduction_month: e.deduction_month
                  ? formatDate(e.deduction_month)
                  : "N.A",
                created_by: e.expand?.created_by?.name,
                monthly_deduction: e.monthly_deduction,
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
      .collection("credits")
      .delete(e.id)
      .then(() => {
        recordsQuery.refetch();
        confirmModal.close();
        toast.success("credit deleted succesfully");
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  const footer_row = useMemo(() => {
    const obj = {
      [entity]: "Total",
      amount: recordsQuery.data?.items
        ?.map((e) => e.amount)
        .reduce((a, b) => a + b, 0),
      paid_amount: recordsQuery.data?.items
        ?.map((e) => e.paid_amount)
        .reduce((a, b) => a + b, 0),
      remaining_amount: recordsQuery.data?.items
        ?.map((e) => e.remaining_amount)
        .reduce((a, b) => a + b, 0),
      status: "---",
      deduction_month: "---",
      created_by: "---",
      created: "---",
      meta: {
        isFooter: true,
      },
    };
    return obj;
  }, [recordsQuery.data]);

  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-lg font-semibold capitalize tracking-tight">
              {type} Credits
            </h2>
            <BreadCrumb
              items={[
                {
                  title: `${entity} Credits`,
                  link: `/${entity} credits`,
                },
              ]}
            />
          </div>
          <Button onClick={() => newRecordModal.open()} size="sm">
            <PlusCircle size={16} className="mr-2" />
            <span>Create new credit.</span>
          </Button>
        </div>
        <div className=" bg-white scroller border-t border-l border-r rounded-t">
          <ScrollArea className="w-full  whitespace-nowrap">
            <div className="flex px-2 items-center  justify-start">
              {[
                { title: "Pending Credits", name: "pending" },
                { title: "Partial paid", name: "partially_paid" },
                { title: "Paid Credits", name: "paid" },
                { title: "Suspended Credits", name: "suspended" },
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
            deduction_month: false,
          }}
          isLoading={recordsQuery.status === "loading"}
          data={
            [
              ...(recordsQuery?.data?.items || []),
              recordsQuery?.data?.totalPages === 1 && footer_row,
            ].filter((e) => e) || []
          }
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
              title: entity.charAt(0).toUpperCase() + entity.slice(1),
              loader: ({ search }) => {
                return pocketbase
                  .collection(type === "employees" ? "users" : "customers")
                  .getFullList(
                    cleanObject({
                      filter: search ? `name~"${search}"` : "",
                    })
                  )
                  .then((e) =>
                    e.map((e) => ({ label: e.names || e.name, value: e.id }))
                  );
              },
              name: entity,
              type: "async-options",
            },
            {
              title: "Created At",
              type: "date",
              name: "created",
            },
          ]}
        />
      </div>

      <CreditFormModal
        type={type}
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
      <CreditsPaymentsModal
        credit={creditToViewPayment}
        open={creditToViewPayment}
        setOpen={setCreditToViewPayment}
        refetch={() => recordsQuery.refetch()}
      />
    </>
  );
}

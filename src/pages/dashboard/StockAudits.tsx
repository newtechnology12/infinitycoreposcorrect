import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import BreadCrumb from "@/components/breadcrumb";
import { addDays } from "date-fns";
import useModalState from "@/hooks/useModalState";
import useEditRow from "@/hooks/use-edit-row";
import { formatDateToStartOfDay } from "@/utils/timeFormaters";
import { DailyReportFormModal } from "@/components/modals/DailyReportFormModal";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "react-feather";
import { useRoles } from "@/context/roles.context";
import { useAuth } from "@/context/auth.context";
import { useNavigate } from "react-router-dom";

export default function StockAudits() {
  const navigate = useNavigate();

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
        <div className="capitalize">{row.getValue("stock")}</div>
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
        <div className="capitalize">{row.getValue("created_by")}</div>
      ),
      enableSorting: true,
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
        <div className="capitalize">{row.getValue("balance")}</div>
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
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <div className="capitalize truncate"> {row.getValue("created")} </div>
      ),
      enableSorting: true,
      filterFn: (__, _, value) => {
        return value;
      },
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
            navigate(`/dashboard/inventory/stock-audits/${row.original.id}`);
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

  const [columnFilters, setColumnFilters] = useState<any>([
    {
      id: "created",
      value: {
        from: new Date(formatDateToStartOfDay(new Date())),
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

  const { canPerform } = useRoles();

  const { user } = useAuth();

  const recordsQuery = useQuery({
    queryKey: [
      "stock_audits",
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
      const searchQ = searchText ? `created_by.name~"${searchText}"` : "";
      const filters = columnFilters
        .map((e) => {
          if (e.value["from"]) {
            if (e.value?.to) {
              return `created >= "${new Date(
                e.value?.from
              ).toISOString()}" && created <= "${new Date(
                e.value?.to
              ).toISOString()}"`;
            } else {
              return `created >= "${new Date(
                e.value?.from
              ).toISOString()}" && created <= "${new Date(
                addDays(new Date(e.value?.from), 1)
              ).toISOString()}"`;
            }
          } else {
            return e.value.map((p) => `${e.id}="${p.value || p}"`).join(" || ");
          }
        })
        .join(" && ");
      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      // view_all_requisition_orders
      const permitionQ = !canPerform("view_all_stock_audits")
        ? `created_by="${user.id}"`
        : "";

      return pocketbase
        .collection("stock_audits")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: [searchQ, filters, permitionQ].filter((e) => e).join("&&"),
            expand: "created_by,stock",
            sort: sorters,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                created_by: e?.expand?.created_by?.name,
                stock: e.expand?.stock?.name,
                balance: e.balance.toLocaleString() + " FRW",
                created: new Date(e.created)?.toLocaleString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
                updated: new Date(e.created)?.toLocaleString("en-US", {
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

  const footer_row = useMemo(() => {
    const obj = {
      name: "Total",
      balance:
        recordsQuery?.data?.items
          ?.map((e) => Number(e?.original?.balance || 0))
          .reduce((a, b) => a + b, 0)
          .toLocaleString() + " FRW",
      meta: {
        isFooter: true,
      },
    };
    return obj;
  }, [recordsQuery?.data]);

  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Stock Audits.
            </h2>
            <BreadCrumb
              items={[{ title: "Stock Audits.", link: "/dashboard" }]}
            />
          </div>
          <div className="space-x-2">
            <Button
              onClick={() => {
                navigate("/dashboard/inventory/new-stock-audit");
              }}
              size="sm"
            >
              <PlusCircle size={16} className="mr-2" />
              <span>Create Stock Audit</span>
            </Button>
          </div>
        </div>
        <DataTable
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{
            itemsCount: false,
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
                  .getFullList({
                    filter: `name~"${search}"`,
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "created_by",
              type: "async-options",
            },
            {
              title: "Stock",
              loader: ({ search }) => {
                return pocketbase
                  .collection("stocks")
                  .getFullList({
                    filter: `name~"${search}"`,
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "stock",
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

      <DailyReportFormModal
        onComplete={() => {
          recordsQuery.refetch();
          newRecordModal.close();
          editRow.close();
        }}
        record={editRow.row}
        setOpen={editRow.isOpen ? editRow.setOpen : newRecordModal.setisOpen}
        open={newRecordModal.isOpen || editRow.isOpen}
      />
    </>
  );
}

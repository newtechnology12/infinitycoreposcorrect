import DataTable from "@/components/DataTable";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/components/datatable/DataTableColumnHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import pocketbase from "@/lib/pocketbase";
import cleanObject from "@/utils/cleanObject";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "react-query";
import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import useConfirmModal from "@/hooks/useConfirmModal";
import ConfirmModal from "@/components/modals/ConfirmModal";
import { toast } from "sonner";
import { useAuth } from "@/context/auth.context";
import exportCsv from "@/utils/exportCsv";
import formatFilter from "@/utils/formatFilter";
import getDaf from "@/utils/getDaf";

export default function WorkShiftReports() {
  const navigate = useNavigate();

  const [searchText, setsearchText] = useState("");

  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 4);

  const [columnFilters, setColumnFilters] = useState<any>([
    {
      id: "created",
      value: {
        from: null,
        to: null,
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
    pageSize: 100,
  });

  const recordsQuery = useQuery({
    queryKey: [
      "work_shift_reports",
      {
        columnFilters,
        search: searchText,
        sort: sorting,
        pageIndex,
        pageSize,
      },
    ],
    keepPreviousData: false,
    queryFn: async () => {
      const searchQ = searchText
        ? `waiter.name~"${searchText}" || cachier.name~"${searchText}"`
        : "";

      const sorters = sorting
        .map((p) => `${p.desc ? "-" : "+"}${p.id}`)
        .join(" && ");

      const payment_methods = await pocketbase
        .collection("payment_methods")
        .getFullList();

      const filters = formatFilter(
        columnFilters.filter((e) => e.id !== "created")
      );

      const dataFilter = columnFilters.find((e) => e.id === "created")?.value;

      console.log(dataFilter, "dataFilter");
      if (!Object.keys(dataFilter).length) {
        return { items: [], totalPages: 0, payment_methods: [] };
      }

      const fils = [
        searchQ ? `(${searchQ})` : undefined,
        filters ? `(${filters})` : undefined,
      ].filter((e) => e);

      const work_periods = await pocketbase
        .collection("work_periods")
        .getFullList({
          filter: getDaf(
            cleanObject(columnFilters.find((e) => e.id === "created")?.value)
          ),
        });

      const wp_filters = work_periods
        .map((e) => `work_period="${e?.id}"`)
        .join(" || ");

      fils.push(`(${wp_filters})`);

      if (!wp_filters.length)
        return { items: [], totalPages: 0, payment_methods: [] };

      return pocketbase
        .collection("work_shift_reports")
        .getList(pageIndex + 1, pageSize, {
          ...cleanObject({
            filter: fils.filter((e) => e).join(" && "),
            sort: sorters,
            expand: `cachier,waiter,credits,work_period,activity`,
          }),
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              const obj = {
                id: e.id,
                cachier: e?.expand?.cachier?.name,
                waiter: e?.expand?.waiter?.name,
                date: new Date(e?.expand?.work_period?.created).toLocaleString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                ),
                original: e,
                gross_amount: e.gross_amount,
                net_amount: e.net_amount,
                work_period: e.expand?.work_period?.created,
                created: new Date(e.created).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  minute: "2-digit",
                  hour: "numeric",
                }),
                activity: e?.expand?.activity?.name || "Pos",
                payment_methods: e?.payment_methods || [],
                total_allowance: e?.allowances?.reduce(
                  (acc, e) => acc + Number(e.amount || 0),
                  0
                ),
                total_discounts: e?.discounts
                  ? e?.discounts.reduce(
                      (acc, e) => acc + Number(e.amount || 0),
                      0
                    )
                  : 0,
                total_credits: e?.expand?.credits
                  ? e?.expand?.credits.reduce(
                      (acc, e) => acc + Number(e?.amount || 0),
                      0
                    )
                  : 0,
                total_cancelled: e?.cancelations?.reduce(
                  (acc, e) => acc + Number(e?.amount || 0),
                  0
                ),
              };
              payment_methods.forEach((p) => {
                const v = e.payment_methods?.find(
                  (q) => q.payment_method.id === p.id
                )?.amount;
                obj[p.name] = Number(v || 0);
              });

              return obj;
            }),
            payment_methods,
            totalPages: e.totalPages,
          };
        });
    },
    enabled: true,
  });

  const startPeriodModal = useConfirmModal();

  const { user } = useAuth();

  const [error, setError] = useState("");
  const startWorkPeriodMutation = useMutation({
    mutationFn: () => {
      const checkIfExist = recordsQuery.data?.items.find(
        (e) => !e.original.ended_at
      );

      if (checkIfExist) throw new Error("You have an ongoing work period");

      return pocketbase.collection("work_periods").create({
        started_by: user.id,
        started_at: new Date(),
      });
    },
    onSuccess: () => {
      toast.success("You have successfully started a new work period");
      recordsQuery.refetch();
      startPeriodModal.close();
    },
    onError: (error: any) => {
      setError(error.message);
      console.log(error);
    },
  });

  const additionl_columns = useMemo(() => {
    const payments_columns =
      recordsQuery?.data?.payment_methods?.map((e) => {
        return {
          accessorKey: e?.name,
          header: ({ column }) => (
            <div className="truncate text-[13px]">
              <DataTableColumnHeader column={column} title={e.name} />
            </div>
          ),
          cell: ({ row }) => {
            return (
              <div className="capitalize truncate">
                {row.getValue(e?.name)
                  ? Number(row.getValue(e?.name)).toLocaleString()
                  : 0}{" "}
                FRW
              </div>
            );
          },
          enableSorting: false,
          enableHiding: false,
        };
      }) || [];

    return [...payments_columns];
  }, [recordsQuery.data]);

  const columns: ColumnDef<any>[] = useMemo(
    () => [
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
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => (
          <div className="capitalize truncate">{row.getValue("date")}</div>
        ),
        enableSorting: true,
        filterFn: (__, _, value) => {
          return value;
        },
        enableHiding: true,
      },
      {
        accessorKey: "waiter",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Employee" />
        ),
        cell: ({ row }) => (
          <div className="capitalize truncate">{row.getValue("waiter")}</div>
        ),
        filterFn: (__, _, value) => {
          return value;
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: "cachier",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Cashier" />
        ),
        cell: ({ row }) => (
          <div className="capitalize truncate">{row.getValue("cachier")}</div>
        ),
        filterFn: (__, _, value) => {
          return value;
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: "gross_amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total Amount" />
        ),
        cell: ({ row }) => (
          <div className="capitalize">
            {Number(row.getValue("gross_amount")).toLocaleString()} FRW
          </div>
        ),
        filterFn: (__, _, value) => {
          return value;
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: "net_amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Net Amount" />
        ),
        cell: ({ row }) => (
          <div className="capitalize">
            {Number(row.getValue("net_amount")).toLocaleString()} FRW
          </div>
        ),
        filterFn: (__, _, value) => {
          return value;
        },
        enableSorting: true,
        enableHiding: true,
      },

      {
        accessorKey: "total_credits",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Credits" />
        ),
        cell: ({ row }) => {
          return (
            <div className="capitalize truncate">
              {Number(row.getValue("total_credits")).toLocaleString()} FRW
            </div>
          );
        },
        enableSorting: false,
        enableHiding: true,
      },
      {
        accessorKey: "total_discounts",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Discounts" />
        ),
        cell: ({ row }) => {
          return (
            <div className="capitalize truncate">
              {Number(row.getValue("total_discounts")).toLocaleString()} FRW
            </div>
          );
        },
        enableSorting: false,
        enableHiding: true,
      },
      {
        accessorKey: "total_allowance",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Allowances" />
        ),
        cell: ({ row }) => {
          return (
            <div className="capitalize truncate">
              {Number(row.getValue("total_allowance")).toLocaleString()} FRW
            </div>
          );
        },
        filterFn: (__, _, value) => {
          return value;
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: "activity",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Activity" />
        ),
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("activity") || "N.A"}</div>
        ),
        filterFn: (__, _, value) => {
          return value;
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: "total_cancelled",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Total Cancelations" />
        ),
        cell: ({ row }) => (
          <div className="capitalize">
            {Number(row.getValue("total_cancelled") || 0).toLocaleString()} FRW
          </div>
        ),
        filterFn: (__, _, value) => {
          return value;
        },
        enableSorting: true,
        enableHiding: true,
      },
      ...additionl_columns,
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
          <>
            {row?.original?.id ? (
              <Button
                size={"sm"}
                onClick={() => {
                  navigate(
                    `/dashboard/reports/cashier-reports/${row.original.id}`
                  );
                }}
                className="text-blue-500"
                variant="link"
              >
                View Details
              </Button>
            ) : (
              <>---</>
            )}
          </>
        ),
      },
    ],
    [additionl_columns]
  );

  const footer_row = useMemo(() => {
    const obj = {
      id: undefined,
      date: "---",
      waiter: "---",
      cachier: "---",
      net_amount:
        recordsQuery?.data?.items?.reduce((acc, e) => acc + e?.net_amount, 0) ||
        0,
      gross_amount:
        recordsQuery?.data?.items?.reduce(
          (acc, e) => acc + e?.gross_amount,
          0
        ) || 0,
      total_credits:
        recordsQuery?.data?.items?.reduce(
          (acc, e) => acc + Number(e?.total_credits || 0),
          0
        ) || 0,
      total_discounts:
        recordsQuery?.data?.items?.reduce(
          (acc, e) => acc + Number(e?.total_discounts || 0),
          0
        ) || 0,
      total_allowance:
        recordsQuery?.data?.items?.reduce(
          (acc, e) => acc + Number(e?.total_allowance || 0),
          0
        ) || 0,
      total_cancelled:
        recordsQuery?.data?.items?.reduce(
          (acc, e) => acc + Number(e?.total_cancelled || 0),
          0
        ) || 0,
      meta: {
        isFooter: true,
      },
    };
    // handle payment methods
    recordsQuery?.data?.payment_methods?.forEach((p) => {
      const c = (obj[p.name] =
        recordsQuery?.data?.items?.reduce(
          (acc, e) =>
            acc +
            Number(
              e.payment_methods?.find((q) => q.payment_method.id === p.id)
                ?.amount || 0
            ),
          0
        ) || 0);
      return Number(c);
    });

    obj["created"] = "---";

    return obj;
  }, [recordsQuery.data]);

  const handleExportToCsv = () => {
    const data = recordsQuery.data?.items.map((e, i) => {
      const obj = {
        ...e,
        id: i + 1,
        date: e.date.toString(),
      };
      recordsQuery.data?.payment_methods?.forEach((p) => {
        const c = (obj[p.name] = e.payment_methods?.find(
          (q) => q.payment_method.id === p.id
        )?.amount);
        return Number(c);
      });

      delete obj.original;
      delete obj.payment_methods;
      delete obj.work_period;

      return obj;
    });
    delete footer_row.meta;
    const dataToExport = [...data, footer_row];
    exportCsv({ data: dataToExport, name: "cashier_reports" });
  };

  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-lg font-semibold tracking-tight">
              Cashier Reports
            </h2>
            <BreadCrumb
              items={[{ title: "Cashier Reports", link: "/dashboard" }]}
            />
          </div>
        </div>
        {/* <div className="grid grid-cols-4 mb-3 mt-3">
          <Card className="rounded-[3px] shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
              <CardTitle className="text-[14.5px] font-medium">
                Total Sales Items.
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent className=" p-3">
              <div className="text-xl font-semibold mb-3">
                {
                  //@ts-ignore
                  recordsQuery?.data?.total_revenue?.toLocaleString() ||
                    (recordsQuery.status === "loading" ? "---" : 0)
                }{" "}
                {recordsQuery.status === "success" && "FRW"}
              </div>
              <p className="text-sm text-slate-500 capitalize">
                All the sales items.
              </p>
            </CardContent>
          </Card>
        </div> */}
        <DataTable
          onExport={(e) => {
            if (e === "csv") return handleExportToCsv();
          }}
          isFetching={recordsQuery.isFetching}
          defaultColumnVisibility={{
            created_by: false,
            approved_by: false,
            rejected_by: false,
            updated: false,
          }}
          isLoading={recordsQuery.status === "loading"}
          data={
            [
              ...(recordsQuery?.data?.items || []),
              recordsQuery?.data?.totalPages === 1 ? footer_row : undefined,
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
              title: "Waiter",
              loader: ({ search }) => {
                return pocketbase
                  .collection("users")
                  .getFullList({
                    filter: search ? `name~"${search}"` : "",
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "waiter",
              type: "async-options",
            },
            {
              title: "Cachier",
              loader: ({ search }) => {
                return pocketbase
                  .collection("users")
                  .getFullList({
                    filter: search ? `name~"${search}"` : "",
                  })
                  .then((e) => e.map((e) => ({ label: e.name, value: e.id })));
              },
              name: "cachier",
              type: "async-options",
            },
            {
              title: "Activity",
              loader: () => {
                return pocketbase
                  .collection("activities")
                  .getFullList()
                  .then((e) =>
                    e
                      .map((e) => ({ label: e.name, value: e.id }))
                      .concat({ label: "Pos", value: "." })
                  );
              },
              name: "activity",
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
      <ConfirmModal
        title={"Start New Work Period"}
        description={`Are you sure you want to start a new work period, this starts a new work period and ends the current one if any`}
        onConfirm={() => {
          startWorkPeriodMutation.mutate();
        }}
        error={error}
        isLoading={startWorkPeriodMutation.isLoading}
        open={startPeriodModal.isOpen}
        onClose={() => {
          startPeriodModal.close();
          setTimeout(() => {
            setError(undefined);
          }, 500);
        }}
      />
    </>
  );
}

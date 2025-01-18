import Loader from "@/components/icons/Loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth.context";
import useShowSidebar from "@/hooks/useShowSidebar";
import pocketbase from "@/lib/pocketbase";
import { cn } from "@/utils";
import cleanObject from "@/utils/cleanObject";
import formatOrder from "@/utils/formatOrder";
import {
  AlarmClock,
  ArrowLeftToLine,
  CheckCheckIcon,
  GitPullRequest,
  Menu,
  XIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Search, Terminal } from "react-feather";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDebounce } from "react-use";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  PaginationState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQuery } from "react-query";
import formatBill from "@/utils/formatBill";
import { Input } from "@/components/ui/input";
import NewOrderButton from "@/components/NewOrderButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useworkShift } from "@/context/workShift.context";

export default function PosOrders() {
  const navigate = useNavigate();

  const [search, setsearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  const [searchParams] = useSearchParams();

  const status = searchParams.get("status");

  useDebounce(
    () => {
      setDebouncedSearch(search);
    },
    700,
    [search]
  );

  // useeffect to set the status search param value to status on going if status is not set
  React.useEffect(() => {
    if (!status) {
      navigate({
        search: "?status=on going",
      });
    }
  }, [status]);

  const { showSideBar } = useShowSidebar();

  // handle navigate and store existing search params
  const handleNavigate = (params) => {
    navigate({
      search: new URLSearchParams({
        ...Object.fromEntries(searchParams),
        ...params,
      }).toString(),
    });
  };

  return (
    <>
      <div>
        <div className="h-dvh flex flex-col">
          <div>
            <div className="bg-white py-2 border-b flex items-center justify-between px-3">
              <div className="font-semibold gap-3 flex items-center text-sm">
                <a
                  onClick={() =>
                    handleNavigate({
                      show_sidebar: showSideBar ? "" : "yes",
                    })
                  }
                  className="h-8 w-8 cursor-pointer bg-slate-100 flex text-slate-600 items-center gap-2 justify-center rounded-[4px]"
                >
                  {!showSideBar ? (
                    <Menu size={16} className="text-slate-700" />
                  ) : (
                    <ArrowLeftToLine size={16} className="text-slate-700" />
                  )}
                </a>

                <span>Orders</span>
              </div>
              <NewOrderButton />
            </div>
            <div className="py-[6px] flex w-full items-center gap-2 sm:py-2 px-2">
              {/* <div>
                <a className="h-9 w-9 border border-slate-200 cursor-pointer bg-white flex text-slate-600 items-center gap-2 justify-center rounded-[4px]">
                  <Sliders size={16} className="text-slate-800" />
                </a>
              </div> */}
              <div className="flex flex-1 relative border focus-within:border-green-500  bg-white border-slate-200 overflow-hidden rounded-[4px] items-center gap-3-">
                <input
                  className="text-sm px-3 py-[10px] bg-transparent w-full h-full outline-none"
                  placeholder="Search a name, order, or etc."
                  type="search"
                  onChange={(e) => setsearch(e.target.value)}
                  value={search}
                />

                <Search className="absolute right-4 text-slate-600" size={14} />
              </div>
            </div>
            <ScrollArea className="w-full scroller whitespace-nowrap- scroll-dis">
              <div className="flex bg-white border-t items-center border-b justify-around">
                {["on going", "completed", "canceled"].map((e, i) => {
                  return (
                    <a
                      key={i}
                      className={cn(
                        "cursor-pointer w-full px-4 capitalize text-center relative w-full- text-slate-700 text-[13px] sm:text-sm py-3 font-medium",
                        {
                          "text-primary ": status === e,
                        }
                      )}
                      onClick={() => {
                        handleNavigate({
                          status: e,
                        });
                      }}
                    >
                      {status === e && (
                        <div className="h-[3px] left-0 flex items-center justify-center w-full absolute bottom-0">
                          <div className="bg-primary h-full rounded-t-md w-[70%] "></div>
                        </div>
                      )}
                      <span className=""> {e}</span>
                    </a>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          {status === "on going" && <OnGoingOrders search={debouncedSearch} />}
          {status === "completed" && (
            <ScrollArea className="w-full flex-1 whitespace-nowrap">
              <div className="p-2">
                <OtherOrders status="completed" />
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
          {status === "canceled" && (
            <ScrollArea className="w-full flex-1 whitespace-nowrap">
              <div className="p-2">
                <OtherOrders status="canceled" />
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </div>
      </div>
    </>
  );
}

function OnGoingOrders({ search }) {
  const { user } = useAuth();

  const ordersQuery = useQuery({
    queryKey: ["pos", "orders", { search: search, waiter: user?.id }],
    queryFn: () => {
      const searchQ = search ? `code~"${search}"` : "";

      return pocketbase
        .collection("orders")
        .getFullList(
          cleanObject({
            filter: [searchQ, `waiter="${user?.id}"`, `status="on going"`]
              .filter((e) => e)
              .join("&&"),
            expand: "table,items,items.menu,bills,bills.items",
            sort: "+created",
          })
        )
        .then((e) => {
          return e.map((e) => formatOrder({ ...e, items: e.expand?.items }));
        });
    },
    enabled: Boolean(user.id),
  });

  return (
    <ScrollArea className="w-full flex-1 whitespace-nowrap">
      {ordersQuery.status === "error" && (
        <div className="flex px-2 w-full sm:h-full h-[50dvh] items-center- py-14=">
          <Alert
            variant="destructive"
            className="rounded-sm bg-white h-fit my-3"
          >
            <Terminal className="h-4 w-4" />
            <AlertTitle>
              <span className="text-sm">Error: Something went wrong</span>
            </AlertTitle>
            <AlertDescription>{ordersQuery.error["message"]}</AlertDescription>
          </Alert>
        </div>
      )}
      {ordersQuery.status === "loading" && (
        <div className="px-2 gap-2 grid-cols-1 !pb-44- py-2 h-full  grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => {
            return (
              <div
                key={i}
                className="bg-white pt-2 px-3 pb-3 p-[10px] border border-slate-200 rounded-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-[4px]" />
                    <div>
                      <Skeleton className="h-3 w-28 rounded-[4px]" />

                      <Skeleton className="h-3 mt-2 w-20 rounded-[4px]" />
                    </div>
                  </div>
                  <div className="flex justify-end items-end gap-2 flex-col">
                    <Skeleton className="h-4 mt-2 w-16 rounded-[4px]" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 mt-0 w-16 rounded-[4px]" />
                    </div>
                  </div>
                </div>

                <div className="flex mt-1 items-center justify-between py-3">
                  <Skeleton className="h-3 mt-2 w-24 rounded-[4px]" />
                  <Skeleton className="h-3 mt-2 w-16 rounded-[4px]" />
                </div>
                <div className="w-full h-[1px] bg-slate-200"></div>
                <div className="pt-1">
                  <table className="table-auto w-full">
                    <thead>
                      <tr>
                        <th>
                          <Skeleton className="h-5 mt-2 w-[70%] rounded-[4px]" />
                        </th>
                        <th>
                          <Skeleton className="h-5 mt-2 w-[70%] rounded-[4px]" />
                        </th>
                        <th className="flex justify-end ">
                          <Skeleton className="h-5 mt-2 w-[70%] rounded-[4px]" />
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4].map((e, i) => {
                        return (
                          <tr key={i}>
                            <td>
                              <Skeleton className="h-5 mt-2 w-[70%] rounded-[4px]" />
                            </td>
                            <td>
                              <Skeleton className="h-5 mt-2 w-[70%] rounded-[4px]" />
                            </td>
                            <td className="flex justify-end ">
                              <Skeleton className="h-5 mt-2 w-[70%] rounded-[4px]" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="w-full my-2 h-[1px] bg-slate-200"></div>

                  <div className="flex pb-3 pt-1 items-center justify-between"></div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 mt-2 w-full rounded-[4px]" />
                    <Skeleton className="h-8 mt-2 w-full rounded-[4px]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ordersQuery.status === "success" && (
        <>
          {ordersQuery.data?.length === 0 && (
            <div className="flex px-4 text-center items-center py-24 justify-center gap-2 flex-col">
              <img
                className="h-20 w-20"
                src="/images/out-of-stock.png"
                alt=""
              />
              <h4 className="font-semibold mt-4">No order Found</h4>
              <p className="text-[15px]  whitespace-normal break-words  max-w-sm leading-8 text-slate-500">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam
                dolor expedita.
              </p>
            </div>
          )}
          {ordersQuery.data?.length !== 0 && (
            <div
              className={cn(
                "px-2 gap-2 !pb-44- py-2 h-full  grid grid-cols-1 ms:grid-cols-2 md:grid-cols-3- lg:grid-cols-4 xl:grid-cols-4"
              )}
            >
              {ordersQuery.data?.map((order, i) => {
                return <OrderCard order={formatOrder(order)} key={i} />;
              })}
            </div>
          )}
        </>
      )}
    </ScrollArea>
  );
}

function OrderCard({ order }) {
  const navigate = useNavigate();

  return (
    <>
      <div
        onClick={() => {
          if (order.status === "completed") {
            navigate(`/pos/orders/${order.id}?show_cart=yes`);
          }
        }}
        className="bg-white hover:bg-opacity-75- cursor-pointer flex flex-col justify-between pt-2 px-3 pb-3 p-[10px] border border-slate-200 rounded-sm"
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-10 text-[12px] uppercase w-10 bg-slate-200 flex items-center justify-center text-slate-500 rounded-[4px]",
                  {
                    "bg-blue-500 text-white": true,
                  }
                )}
              >
                {order.expand?.table?.code || "N.A"}
              </div>
              <div>
                <h4 className="text-[13px] mb-1 font-medium">#{order.code}</h4>
                <p className="text-[12.5px] text-slate-500 font-medium">
                  {order?.itemsCount} items
                </p>
              </div>
            </div>
            <div className="flex justify-end items-end gap-2 flex-col">
              <div
                className={cn(
                  "text-[12px] capitalize border bg-opacity-55 flex items-center gap-2 px-3 py-[4px] rounded-[5px] ",
                  {
                    "text-yellow-500 border-yellow-300  bg-yellow-100":
                      order.status === "on going",
                    "text-green-500  border-green-300   bg-green-100":
                      order.status === "completed",
                    "text-gray-500  border-gray-300  bg-gray-100":
                      order.status === "draft",
                    "text-red-500  border-red-300  bg-red-100":
                      order.status === "cancelled",
                  }
                )}
              >
                {
                  {
                    "on going": <AlarmClock size={15} />,
                    completed: <CheckCheckIcon size={15} />,
                    draft: <GitPullRequest size={15} />,
                    canceled: <XIcon size={15} />,
                  }[order.status]
                }
                <span>{order.status}</span>
              </div>
              {/* <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-slate-600">Cooking now</span>
              </div> */}
            </div>
          </div>

          <div className="flex mt-1 items-center justify-between py-3">
            <span className="text-[12.5px] text-slate-500 font-medium">
              {new Date(order.created).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                weekday: "long",
              })}
            </span>
            <span className="text-[12.5px] text-slate-500 font-medium">
              {new Date(order.created).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {order.status !== "completed" && (
            <>
              <div className="w-full h-[1px] bg-slate-200"></div>
              <div className="pt-1">
                <table className="table-auto w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-2  text-slate-500 capitalize text-[13px] font-medium">
                        Name
                      </th>
                      <th className="text-left py-2  text-slate-500 capitalize text-[13px] font-medium">
                        quantity
                      </th>
                      <th className="text-right py-2  text-slate-500 capitalize text-[13px] font-medium">
                        price
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items
                      // .filter((e) => e.status !== "draft")
                      .map((e, i) => {
                        return (
                          <tr key={i}>
                            <td className="text-left  whitespace-normal break-words leading-6 py-2 flex items-start gap-2 text-slate-600 capitalize text-[12.5px] font-medium">
                              <div
                                className={cn(
                                  "h-[6px] w-[6px] my-2  rounded-full",
                                  {
                                    "bg-yellow-500 ": e.status === "pending",
                                    "bg-green-500 ": e.status === "completed",
                                    "bg-gray-300 ": e.status === "draft",
                                    "bg-red-500 ": e.status === "cancelled",
                                  }
                                )}
                              ></div>

                              {e?.expand?.menu?.name}
                            </td>
                            <td className="text-left py-2  text-slate-600 capitalize text-[12.5px] font-medium">
                              {e.quantity}
                            </td>
                            <td className="text-right py-2  text-slate-600 capitalize text-[12.5px] font-medium">
                              {e.amount.toLocaleString()} FRW
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              {order.items.length === 0 && (
                <div className="text-center h-[130px] flex items-center justify-center font-medium text-slate-500 py-10= text-[13px]">
                  Order is empty
                </div>
              )}
              <div className="w-full my-2 h-[1px] bg-slate-200"></div>
            </>
          )}
        </div>
        <div>
          <div className="flex pt-1 items-center justify-between">
            <h4 className="font-medium text-slate-500 text-[13px]">Total</h4>
            <span className="font-semibold text-slate-800 text-[13px]">
              {(order.total | 0).toLocaleString()} FRW
            </span>
          </div>
          {order.status !== "completed" && (
            <div className="flex pt-3 items-center gap-2">
              <Button
                onClick={() =>
                  navigate(`/pos/orders/${order.id}?show_cart=yes`)
                }
                className="text-primary- text-white w-full"
                size="sm"
              >
                See Details
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function OtherOrders({ status }) {
  const navigate = useNavigate();

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("code")}</div>
      ),
    },
    {
      accessorKey: "date",
      header: "Order Date",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("date")}</div>
      ),
    },
    {
      accessorKey: "time",
      header: "Order time",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("time")}</div>
      ),
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <div className="  truncate">
          {row.getValue("total").toLocaleString()} FRW
        </div>
      ),
    },
    {
      accessorKey: "table",
      header: "Table",
      cell: ({ row }) => (
        <div className="  truncate">{row.getValue("table")}</div>
      ),
    },

    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        return row.original.id ? (
          <Button
            size={"sm"}
            onClick={() => {
              navigate(`/pos/orders/${row.original.id}`);
            }}
            className="text-blue-500 px-5"
            variant="link"
          >
            View Details
          </Button>
        ) : (
          <></>
        );
      },
    },
  ];

  const [rowSelection, setRowSelection] = React.useState({});

  const getPaginationRange = ({ currentPage, totalPages }) => {
    const visiblePages = 6;
    const range = [];
    const half = Math.floor(visiblePages / 2);
    let start = currentPage - half;
    let end = currentPage + half;

    if (start <= 0) {
      start = 1;
      end = visiblePages;
    }

    if (end > totalPages) {
      end = totalPages;
      start = totalPages - visiblePages + 1;
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  };

  const { user } = useAuth();

  const [search, setSearch] = useState("");

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const { pageIndex, pageSize } = React.useMemo(() => pagination, [pagination]);

  const { work_period } = useworkShift();

  const recordsQuery: any = useQuery({
    queryKey: [
      "my-orders",
      {
        pagination,
        waiter: user?.id,
        search,
      },
    ],
    keepPreviousData: true,
    queryFn: () => {
      const searchQ = search
        ? `&& code~"${search}" || table.name~"${search}"`
        : "";
      return pocketbase
        .autoCancellation(false)
        .collection("orders")
        .getList(pageIndex + 1, pageSize, {
          filter: `waiter="${user.id}" && work_period="${work_period?.id}" && status="${status}" ${searchQ}`,
          sort: "-created",
          expand: "table,bills,bills.items",
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                code: e.code,
                table: e.expand?.table?.code || "N.A",
                time: new Date(e.created).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                date: new Date(e.created).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  weekday: "short",
                }),
                total:
                  e?.expand?.bills
                    ?.map(formatBill)
                    .reduce((a, b) => a + b.total, 0) || 0,
                original: e,
              };
            }),

            totalPages: e.totalPages,
          };
        });
    },
    enabled: true,
  });

  const footer_row = useMemo(() => {
    return {
      code: "Total",
      date: "---",
      time: "---",
      total: recordsQuery?.data?.items
        ?.map((e) => e.total)
        .reduce((a, b) => a + b, 0),
      table: "---",
      meta: {
        isFooter: true,
      },
    };
  }, [recordsQuery.data?.items]);

  const table = useReactTable({
    data:
      [
        ...(recordsQuery?.data?.items || []),
        recordsQuery?.data?.totalPages === 1 ? footer_row : undefined,
      ].filter((e) => e) || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: recordsQuery?.data?.totalPages,
    state: {
      rowSelection,
      pagination,
    },
  });

  return (
    <div className="px-0 py-0 max-w-5xl mx-auto">
      <div className="w-full pt-3 px-3 rounded-[4px] border bg-white">
        <div className="mb-3 flex justify-between">
          <div className="relative">
            <Input
              placeholder="Search here..."
              value={search}
              type="search"
              onChange={(event) => setSearch(event.target.value)}
              className="h-8 w-[150px] rounded-[3px] lg:w-[250px]"
            />
            <Search
              className="absolute right-3 text-slate-500 top-2"
              size={15}
            />
          </div>
          <div>
            <NewOrderButton />
          </div>
        </div>
        <div className="rounded-[4px] border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, i, arr) => {
                    return (
                      <TableHead
                        className={cn({
                          "!text-right": i === arr.length - 1,
                        })}
                        key={header.id}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                <>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      className={cn({
                        "bg-primary !text-white": row.original.meta?.isFooter,
                      })}
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell, i, arr) => (
                        <TableCell
                          className={cn({
                            "!text-right !flex justify-end":
                              i === arr.length - 1,
                            " !text-white font-bold text-base":
                              row.original.meta?.isFooter,
                          })}
                          key={cell.id}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              ) : (
                <TableRow>
                  {recordsQuery.status === "loading" ? (
                    <TableCell
                      colSpan={columns.length}
                      className="h-28 text-center"
                    >
                      <div className="w-full flex items-center justify-center ">
                        <Loader className="mr-2 h-4 w-4 text-primary animate-spin" />
                      </div>
                    </TableCell>
                  ) : (
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex sm:flex-row sm:gap-0 gap-3 pb-3 px-2 pt-3 flex-col items-center bg-slate-100- w-full justify-between space-x-2 py-2">
          <div>
            <div className="flex items-center space-x-2">
              <p className="text-[13px] text-slate-500 font-medium">
                Rows per page
              </p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top" className="bg-white">
                  {[
                    2, 5, 10, 15, 20, 30, 40, 50, 100, 200, 500, 1000, 5000,
                  ].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => table.previousPage()}
                    size="sm"
                    className={cn("cursor-pointer", {
                      "opacity-50 pointer-events-none":
                        !table.getCanPreviousPage(),
                    })}
                  />
                </PaginationItem>
                {getPaginationRange({
                  currentPage: pagination.pageIndex,
                  totalPages: recordsQuery?.data?.totalPages,
                })
                  .filter((e) => e > 0)
                  .map((e, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        className="cursor-pointer"
                        size="sm"
                        isActive={pageIndex === i}
                        onClick={() => {
                          table.setPageIndex(i);
                        }}
                      >
                        {e}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => table.nextPage()}
                    size="sm"
                    className={cn("cursor-pointer", {
                      "opacity-50 pointer-events-none": !table.getCanNextPage(),
                    })}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </div>
    </div>
  );
}

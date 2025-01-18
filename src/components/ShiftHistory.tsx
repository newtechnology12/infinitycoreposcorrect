import * as React from "react";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "react-query";
import pocketbase from "@/lib/pocketbase";
import { useAuth } from "@/context/auth.context";
import { differenceInSeconds } from "date-fns";
import formatSeconds from "@/utils/formatSeconds";
import { cn } from "@/utils";
import { RunShiftReportModal } from "./modals/RunShiftReportModal";
import Loader from "./icons/Loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export function ShiftsHistory() {
  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("date")}</div>
      ),
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("duration")}</div>
      ),
    },
    {
      accessorKey: "started",
      header: "Started",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("started")}</div>
      ),
    },
    {
      accessorKey: "ended",
      header: "Ended",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("ended")}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  // @ts-ignore
                  setshiftToShow(row.original.original);
                }}
              >
                View shift report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState({});

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });

  const { pageIndex, pageSize } = React.useMemo(() => pagination, [pagination]);

  const { user } = useAuth();

  const recordsQuery: any = useQuery({
    queryKey: [
      "my_shifts",
      {
        pagination,
      },
    ],
    keepPreviousData: true,
    queryFn: () => {
      return pocketbase
        .autoCancellation(false)
        .collection("work_shifts")
        .getList(pageIndex + 1, pageSize, {
          filter: `employee="${user.id}"`,
          sort: "-created",
        })
        .then((e) => {
          return {
            items: e?.items?.map((e) => {
              return {
                id: e.id,
                date: new Date(e.created).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
                started: new Date(e.started_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                ended: e.ended_at
                  ? new Date(e.ended_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "---",
                shift: e?.expand?.shift?.name || "night shift",
                duration:
                  formatSeconds(
                    differenceInSeconds(e.ended_at || new Date(), e.started_at)
                  ) || "N.A",
                original: e,
              };
            }),
            totalPages: e.totalPages,
          };
        });
    },
    enabled: true,
  });

  const table = useReactTable({
    data: recordsQuery?.data?.items || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: recordsQuery?.data?.totalPages,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination,
    },
  });

  const [shiftToShow, setshiftToShow] = React.useState(undefined);

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

  return (
    <>
      <RunShiftReportModal
        open={Boolean(shiftToShow)}
        setOpen={(e) => {
          if (!e) {
            setshiftToShow(undefined);
          }
        }}
        readOnly
        shift={shiftToShow}
      />
      <div className="px-0 py-0">
        <div className="w-full pt-3 px-3 rounded-[4px] border bg-white">
          <div className="rounded-[4px] border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header, i, arr) => {
                      return (
                        <TableHead
                          className={cn("h-10", {
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
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell, i, arr) => (
                        <TableCell
                          className={cn({
                            "!text-right !flex justify-end":
                              i === arr.length - 1,
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
                  ))
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
                    {[2, 5, 10, 15, 20, 30, 40, 50].map((pageSize) => (
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
                        "opacity-50 pointer-events-none":
                          !table.getCanNextPage(),
                      })}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

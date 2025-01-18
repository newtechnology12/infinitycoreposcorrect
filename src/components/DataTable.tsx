import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Table as TanTable } from "@tanstack/react-table";

import * as React from "react";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "./ui/button";
import { DataTableToolbar } from "./datatable/DataTableToolbar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Loader from "./icons/Loader";
import { cn } from "@/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  facets;
  isLoading;
  defaultColumnVisibility;
  onSearch;
  columnFilters;
  setColumnFilters;
  setSorting;
  sorting;
  setPagination;
  pageIndex;
  pageSize;
  pageCount;
  title?: string;
  isFetching;
  className?: string;
  Action?: any;
  onExport?: any;
}

function DataTable<TData, TValue>({
  columns,
  data,
  title,
  facets,
  defaultColumnVisibility = {},
  isLoading,
  isFetching,
  onSearch,
  columnFilters,
  setColumnFilters,
  setSorting,
  sorting,
  setPagination,
  pageIndex,
  pageSize,
  pageCount,
  className,
  onExport,
  Action,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(defaultColumnVisibility);

  const pagination = React.useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  const table = useReactTable({
    data,
    columns,
    manualSorting: true,
    manualPagination: true,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    pageCount: pageCount,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <Card
      className={cn(
        "shadow-none sm:mt-0- mt-4- relative rounded-[3px] h-full",
        className
      )}
    >
      {isFetching && !isLoading && (
        <div className="progress-bar h-[3px] opacity-70 absolute top-0 rounded-t-md bg-primary bg-opacity-25 w-full overflow-hidden">
          <div className="progress-bar-value w-full h-full bg-primary " />
        </div>
      )}

      {title && (
        <CardHeader className="p-3- pb-2 pt-[10px] px-2 sm:px-4">
          <CardTitle className="mb-0">
            <span className="text-[15px]">{title}</span>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="sm:p-4 p-2 pt-3 h-full">
        <div className="space-y-4 h-[95%] flex flex-col pb-4- ">
          <DataTableToolbar
            Action={Action}
            onSearch={onSearch}
            facets={facets}
            table={table}
            onExport={onExport}
          />
          <div className="rounded-[4px] border dark:border-slate-600 flex-1">
            <Table id="dataTable" className="table-fixed-">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          className="last:text-right last:justify-end truncate last:flex last:items-center"
                          key={header.id}
                          colSpan={header.colSpan}
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
                {table.getRowModel().rows.filter((e) => {
                  return !e.original["meta"]?.isFooter;
                })?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => {
                        return (
                          <TableCell
                            className={cn(
                              "last:text-right last:justify-end last:flex last:items-center ",
                              row.original["meta"]?.isFooter &&
                                "font-semibold bg-primary truncate !py-3 h-10 !text-white text-[14px]"
                            )}
                            key={cell.id}
                          >
                            {JSON.stringify(row.getValue("meta"))}
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <>
                    {isLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-36 !inline-block= text-center"
                        >
                          <div className="flex items-center justify-center">
                            <Loader className="mr-2 h-5 w-5 text-primary animate-spin" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-36 text-center"
                        >
                          No results available.
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </div>
      </CardContent>
    </Card>
  );
}

export default DataTable;

interface DataTablePaginationProps<TData> {
  table: TanTable<TData>;
}

function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center flex-col gap-4 sm:flex-row justify-between px-2">
      <div className="flex-1 text-slate-500 font-medium dark:text-slate-300 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-[13px] text-slate-500 dark:text-slate-300 font-medium">
            Rows per page
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top" className="bg-white">
              {[
                2, 5, 10, 15, 20, 30, 40, 50, 100, 150, 200, 300, 400, 500, 700,
                1000, 2000, 5000, 7500, 10000, 100000000000000,
              ].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] dark:text-slate-300 text-[13px] text-slate-500 items-center justify-center text-sm font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to first page</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to last page</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

import { useState } from "react";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useOutletContext } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/utils";

function GeneralWorkPeriodReport() {
  const [_, __, data]: any = useOutletContext() as [any];

  return (
    <>
      <div>
        <div className="px-5">
          <div className="mt-2 border-b border-dashed  pb-4">
            <div className="flex items-center justify-between w-full">
              <h4>
                <span className="py-2 uppercase text-[12px] font-medium text-slate-500">
                  Payment Methods
                </span>
              </h4>
            </div>
            <div className="grid px-2- pt-3 grid-cols-3 gap-x-6 gap-y-3">
              {data?.payment_methods?.map((method, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className=" text-[13px] text-slate-600">
                    {method.payment_method.name}
                  </span>
                  <p>
                    <span className="font-semibold text-[13px]">
                      {method.amount.toLocaleString()} FRW
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
          {data?.closing_notes && (
            <div className="border-b border-dashed">
              <div className="px-2- mt-3">
                <Label className="text-[13px] mb-2 block text-slate-500">
                  Closing Note (Optional)
                </Label>
              </div>
            </div>
          )}
          <div className="my-4 space-y-4">
            <div>
              <SalesByItems title="Sales by items" data={data?.sold_items} />
            </div>
            <div>
              <SalesByCategories
                title="Sales by categories"
                data={data?.sold_categories}
              />
            </div>

            <SalesByWaiters
              title="Sales by waiters"
              data={data?.sold_items_by_waiter}
            />
          </div>
          <div className="mb-4 flex items-center justify-end"></div>
        </div>
      </div>
    </>
  );
}

export default GeneralWorkPeriodReport;

function WaiterSalesModal({ open, setOpen, sold_items }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        // @ts-ignore
        overlayClass={"backdrop-blur-md"}
        className="sm:max-w-[550px]"
      >
        <DialogHeader>
          <DialogTitle>
            <span className="text-sm px-1 font-semibold py-2">
              Waiter Sales
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-1 py-0 text-sm text-slate-500 leading-7">
              Total quantity, gross amount and percentage of each waiter.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className=" pt-2 px-2 py-1">
          <div className="w-full">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="font-semibold py-2 text-slate-700 uppercase text-[12px]">
                    Item
                  </th>
                  <th className="font-semibold py-2 text-slate-700 uppercase text-[12px]">
                    Quantity
                  </th>
                  <th className="font-semibold py-2 text-slate-700 uppercase text-[12px]">
                    Gross Amount
                  </th>
                  <th className="font-semibold py-2 text-slate-700 uppercase text-[12px]">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody>
                {sold_items?.map((e, i) => {
                  return (
                    <tr key={i}>
                      <td className="font-medium py-[10px] text-slate-500 text-[12.5px]">
                        {e?.menu?.name}
                      </td>
                      <td className="font-medium py-[10px] text-slate-500 text-[12.5px]">
                        {e.total_quantity}
                      </td>
                      <td className="font-medium capitalize py-[10px] text-slate-500 text-[12.5px]">
                        {Number(e.total_amount).toLocaleString()} FRW
                      </td>
                      <td className="font-medium capitalize py-[10px] text-slate-500 text-[12.5px]">
                        {e.percentage}%
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td className="font-medium border-t border-dashed capitalize py-[10px] text-slate-800 text-[12.5px]">
                    Total
                  </td>
                  <td className="font-medium py-[10px] border-t border-dashed text-slate-800 text-[12.5px]">
                    {sold_items?.reduce((a, b) => a + b.total_quantity, 0)}
                  </td>
                  <td className="font-medium py-[10px] border-t border-dashed text-slate-800 text-[12.5px]">
                    {Number(
                      sold_items?.reduce((a, b) => a + b.total_amount, 0)
                    ).toLocaleString()}{" "}
                    FRW
                  </td>
                  <td className="font-medium py-[10px] border-t border-dashed text-slate-800 text-[12.5px]">
                    100%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SalesByItems({ data, ...other }: any) {
  const columns: any[] = [
    {
      accessorKey: "menu",
      header: "Item",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("menu").name}</div>
      ),
    },
    {
      accessorKey: "total_quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {row.getValue("total_quantity")}
        </div>
      ),
    },
    {
      accessorKey: "total_amount",
      header: "Total amount",
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {row.getValue("total_amount").toLocaleString()} FRW
        </div>
      ),
    },
    {
      accessorKey: "percentage",
      header: "Percentage",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("percentage")}%</div>
      ),
    },
  ];

  return (
    <ReportTable
      {...other}
      columns={columns}
      data={data}
      footerCols={[
        {
          id: "menu",
          value: "Total",
        },
        {
          id: "total_quantity",
          value: data?.reduce((a, b) => a + b.total_quantity, 0),
        },
        {
          id: "total_amount",
          value:
            Number(
              data?.reduce((a, b) => a + b.total_amount, 0)
            ).toLocaleString() + " FRW",
        },
        {
          id: "percentage",
          value: "100%",
        },
      ]}
    />
  );
}

function SalesByCategories({ data, ...other }: any) {
  const columns: any[] = [
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("category")}</div>
      ),
    },
    {
      accessorKey: "total_quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {row.getValue("total_quantity")}
        </div>
      ),
    },
    {
      accessorKey: "total_amount",
      header: "Total amount",
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {row.getValue("total_amount").toLocaleString()} FRW
        </div>
      ),
    },
    {
      accessorKey: "percentage",
      header: "Percentage",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("percentage")}%</div>
      ),
    },
  ];

  return (
    <ReportTable
      {...other}
      columns={columns}
      data={data}
      footerCols={[
        {
          id: "category",
          value: "Total",
        },
        {
          id: "total_quantity",
          value: data?.reduce((a, b) => a + b.total_quantity, 0),
        },
        {
          id: "total_amount",
          value:
            Number(
              data?.reduce((a, b) => a + b.total_amount, 0)
            ).toLocaleString() + " FRW",
        },
        {
          id: "percentage",
          value: "100%",
        },
      ]}
    />
  );
}

function SalesByWaiters({ data, ...other }: any) {
  const [soldItemsToShow, setSoldItemsToShow] = useState(null);

  const columns: any[] = [
    {
      accessorKey: "waiter",
      header: "Waiter",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("waiter").name}</div>
      ),
    },
    // {
    //   accessorKey: "orders_count",
    //   header: "Orders Count",
    //   cell: ({ row }) => (
    //     <div className="capitalize truncate">
    //       {row.getValue("orders_count") || 0}
    //     </div>
    //   ),
    // },
    {
      accessorKey: "total_quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {row.getValue("total_quantity")}
        </div>
      ),
    },
    {
      accessorKey: "total_amount",
      header: "Total amount",
      cell: ({ row }) => (
        <div className="capitalize truncate">
          {row.getValue("total_amount").toLocaleString()} FRW
        </div>
      ),
    },
    {
      accessorKey: "percentage",
      header: "Percentage",
      cell: ({ row }) => (
        <div className="capitalize truncate">{row.getValue("percentage")}%</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        return (
          <div>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setSoldItemsToShow(row?.original?.items);
              }}
              className="h-6 px-3 mx-3 !text-primary w-8 p-0"
            >
              View sales
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      {" "}
      <ReportTable
        {...other}
        columns={columns}
        data={data}
        footerCols={[
          {
            id: "waiter",
            value: "Total",
          },
          // {
          //   id: "orders_count",
          //   value: data?.reduce((a, b) => a + b.orders_count || 0, 0),
          // },
          {
            id: "total_quantity",
            value: data?.reduce((a, b) => a + b.total_quantity, 0),
          },
          {
            id: "total_amount",
            value:
              Number(
                data?.reduce((a, b) => a + b.total_amount, 0)
              ).toLocaleString() + " FRW",
          },
          {
            id: "percentage",
            value: "100%",
          },
          {},
        ]}
      />
      <WaiterSalesModal
        open={Boolean(soldItemsToShow)}
        setOpen={() => {
          setSoldItemsToShow(null);
        }}
        sold_items={soldItemsToShow}
      />
    </>
  );
}

function ReportTable({ columns, data, footerCols = [], ...other }) {
  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div className="border">
      <div className="border-b py-2 font-medium px-3 text-sm bg-slate-50">
        <h4>{other?.title}</h4>
      </div>
      <Table>
        <TableHeader className="bg-slate-50-">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, i, arr) => {
                return (
                  <TableHead
                    className={cn(
                      "h-fit uppercase text-[12px] text-black border-r py-2",
                      {
                        "!text-right border-none": i === arr?.length - 1,
                      }
                    )}
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
            table.getRowModel().rows?.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell, i, arr) => (
                  <TableCell
                    className={cn("!border-0 !border-r-slate-200 !border-r", {
                      "!text-right !flex  !py-3 justify-end":
                        i === arr.length - 1,
                    })}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              {table.getRowModel()?.rows?.length ? (
                <TableCell
                  colSpan={columns?.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              ) : null}
            </TableRow>
          )}
        </TableBody>
        <TableRow className="border-b-0">
          {footerCols.map((col, i) => (
            <TableCell
              className={cn(
                "!border-0 !border-t font-semibold text-black !border-b-0 !border-r-slate-200 !border-r",
                {
                  "!text-right !flex  !py-3 justify-end":
                    i === footerCols.length - 1,
                }
              )}
              key={col.id}
            >
              {col.value}
            </TableCell>
          ))}
        </TableRow>
      </Table>
    </div>
  );
}

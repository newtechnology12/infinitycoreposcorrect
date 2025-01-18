import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { ArrowDown, Split, Trash } from "lucide-react";
import { cn } from "@/utils";
import { Button } from "../ui/button";
import { useMutation } from "react-query";
import pocketbase from "@/lib/pocketbase";
import Loader from "../icons/Loader";
import { toast } from "sonner";
import { useState } from "react";
import formatBill from "@/utils/formatBill";

function generateUniqueId() {
  return Math.floor(Math.random() * 1000000);
}

export function SplitBillModal({ open, setOpen, order, orderQuery }: any) {
  const createBill = () => {
    return pocketbase.collection("order_bills").create({
      items: [],
      order: order.id,
      code: generateUniqueId(),
    });
  };

  const createBillMutation = useMutation({
    mutationFn: () => {
      return createBill();
    },
    onSuccess: () => {
      console.log("done");
      orderQuery.refetch();
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  const [selectedItems, setSelectedItems] = useState([]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[750px] gap-0 h-dvh md:h-fit !p-0 flex flex-col">
        <DialogHeader className="!text-left">
          <DialogTitle>
            <span className="text-sm px-3 font-semibold pt-2 block">
              Split Bill
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-3 py-0 text-sm text-slate-500 leading-7-">
              Choose or select items to split a new bill.
            </span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="w-full scroller border-t border-t-slate-200 flex-1- md:h-[500px] whitespace-nowrap">
          <div className="py-3 px-3">
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
              {order?.expand?.bills
                // ?.filter((e) => !e?.expand?.transactions?.length)
                ?.map(formatBill)
                .map((bill, i) => {
                  return (
                    <Bill
                      setSelectedItems={setSelectedItems}
                      selectedItems={selectedItems}
                      orderQuery={orderQuery}
                      key={i}
                      bill={bill}
                      bills={order?.expand?.bills?.map(formatBill)}
                    />
                  );
                })}
              <div
                onClick={() => {
                  createBillMutation.mutate();
                }}
                className="w-full min-h-[200px] h-full hover:bg-slate-50 cursor-pointer flex items-center justify-center border-dashed border rounded-md border-slate-300 "
              >
                <div className="flex flex-col gap-3 justify-center items-center ">
                  {createBillMutation.isLoading ? (
                    <Loader className="mr-2 h-4 w-4 text-slate-500 animate-spin" />
                  ) : (
                    <Split className="text-slate-500" size={22} />
                  )}
                  <span className="text-sm font-medium- text-slate-500">
                    Create new bill.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Bill({ bill, bills, orderQuery, setSelectedItems, selectedItems }) {
  const createBill = async () => {
    return pocketbase.collection("order_bills").delete(bill.id);
  };

  const deleteBillMutation = useMutation({
    mutationFn: () => {
      return createBill();
    },
    onSuccess: () => {
      console.log("done");
      orderQuery.refetch();
    },
    onError: (e: any) => {
      toast.error(e.message);
    },
  });

  const moveBill = async ({ source, destination }) => {
    const newSourceItems = source.items
      .filter(
        (obj) => !selectedItems.some((targetObj) => targetObj.id === obj.id)
      )
      .map((e) => e.id);

    const newDestItems = [
      ...(destination?.items || [])?.map((e) => e.id),
      ...selectedItems?.map((e) => e.id),
    ];

    await pocketbase.collection("order_bills").update(source.id, {
      items: newSourceItems,
    });

    await pocketbase.collection("order_bills").update(destination.id, {
      items: newDestItems,
    });
  };

  const moveItemsMutation = useMutation({
    mutationFn: () => {
      const oneSelectedItem = selectedItems[0];
      const source = bills.find((bill) =>
        bill?.items?.find((i) => i.id === oneSelectedItem.id)
      );
      const destination = bill;
      return moveBill({ source, destination });
    },
    onError: (__, _) => {
      toast.error("Failed to delete item to order");
    },
    onSuccess: () => {
      setTimeout(() => {
        orderQuery.refetch();
      }, 500);
      setSelectedItems([]);
    },
  });

  return (
    <div className="bg-slate-100 border flex flex-col h-full justify-between rounded-[4px] pb-0">
      <div className="flex-1 relative border-b  h-full">
        {bill.transactions.length ? (
          <div className="w-full h-full bg-white bg-opacity-70 flex items-center justify-center absolute z-40">
            <img className="h-20" src="/paid.png" alt="" />
          </div>
        ) : null}
        <div className="mb-1 flex items-center py-[6px] border-b justify-between px-3">
          <div className="flex items-center justify-between w-full">
            <h4 className="font-semibold text-[13px]">Bill Details</h4>
            <div className="flex items-center gap-3">
              <a
                onClick={() => deleteBillMutation.mutate()}
                className={cn(
                  "h-7 cursor-pointer w-7 flex items-center justify-center rounded-sm bg-slate-200",
                  {
                    "pointer-events-none opacity-65": bill?.items?.length,
                  }
                )}
              >
                {deleteBillMutation.isLoading ? (
                  <Loader className="h-[14px] w-[14px] text-slate-500 animate-spin" />
                ) : (
                  <Trash className="text-red-500" size={14} />
                )}
              </a>
            </div>
          </div>
        </div>
        <ScrollArea className="h-[270px] px-2 w-full">
          {bill?.items?.map((e, i) => {
            return (
              <div
                key={i}
                className="flex py-2 items-start gap-3 justify-between"
              >
                <div>
                  <Checkbox
                    disabled={!bill.balance}
                    onCheckedChange={(value) => {
                      if (value) {
                        setSelectedItems((prev) => [...prev, e]);
                      } else {
                        setSelectedItems((prev) =>
                          prev.filter((i) => i.id !== e.id)
                        );
                      }
                    }}
                    checked={Boolean(selectedItems.find((p) => p.id === e.id))}
                    id={`item-${e.id}`}
                  />
                </div>
                <label
                  htmlFor={`item-${e.id}`}
                  className="flex flex-1 gap-2 items-start"
                >
                  <div className="flex-1">
                    <h4 className="text-[13px] mb-1 text-slate-500">
                      {e.expand.menu.name}
                    </h4>
                    <span className="text-[11.5px] text-slate-600 font-semibold">
                      {Number(e.amount).toLocaleString()} FRW
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">x{e.quantity}</p>
                  </div>
                </label>
              </div>
            );
          })}
        </ScrollArea>
      </div>
      <div className="pt-0 px-2 pb-2">
        <div className="flex py-2 items-center justify-between">
          <h4 className="font-semibold text-slate-800 text-[12.5px]">Total</h4>
          <span className="font-semibold text-slate-800 text-[12.5px]">
            {(bill?.total | 0).toLocaleString()} FRW
          </span>
        </div>
        <Button
          disabled={
            !selectedItems?.length ||
            bill?.items?.some((item) =>
              selectedItems.find((e) => e.id === item.id)
            ) ||
            bill.transactions.length ||
            moveItemsMutation?.isLoading
          }
          onClick={() => moveItemsMutation?.mutate()}
          size="sm"
          className="w-full"
        >
          {moveItemsMutation?.isLoading && (
            <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
          )}
          Move items here
          <ArrowDown className="ml-2 h-4 w-4 text-white" size={14} />
        </Button>
      </div>
    </div>
  );
}

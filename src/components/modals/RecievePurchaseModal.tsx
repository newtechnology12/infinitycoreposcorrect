import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import Loader from "../icons/Loader";
import { cn } from "@/utils";
import { useState } from "react";
import { toast } from "sonner";
import pocketbase from "@/lib/pocketbase";
import { useAuth } from "@/context/auth.context";

export function RecievePurchaseModal({
  open,
  setOpen,
  purchase,
  onComplete,
}: any) {
  console.log();
  const [isSaving, setisSaving] = useState(false);

  const { user } = useAuth();

  const recievePurchase = async () => {
    try {
      setisSaving(true);
      //create an adjustment for each item and adjust the stock
      const adjustments = purchase?.expand?.items?.map((e) => {
        return {
          stock: e.stock,
          quantity_adjusted: e.quantity,
          type: "addition",
          reason: "purchase",
          stock_item: e.stock_item,
          created_by: user.id,
          notes: `Recieved ${e?.quantity} ${
            e?.expand?.ingredient?.unit || ""
          } of ${e?.expand?.ingredient?.name} from purchase:${purchase?.id}`,
          quantity_before: e.expand?.stock_item?.available_quantity,
          quantity_after: e.expand?.stock_item?.available_quantity + e.quantity,
        };
      });

      // create the adjustments then update the stock then update the purchase status
      return Promise.all(
        adjustments?.map((e) =>
          pocketbase
            .autoCancellation(false)
            .collection("adjustments")
            .create(e)
            .then((e) => {
              return pocketbase
                .autoCancellation(false)
                .collection("stock_items")
                .update(e.stock_item, {
                  available_quantity: e.quantity_after,
                });
            })
        )
      ).then(() => {
        return pocketbase
          .autoCancellation(false)
          .collection("purchases")
          .update(purchase.id, {
            status: "recieved",
          })
          .then(() => {
            toast.success("Purchase recieved successfully");
            setisSaving(false);
            onComplete();
          });
      });
    } catch (error) {
      console.log("Failed to recieve purchase", error.message);
      toast.error("Failed to recieve purchase");
      setisSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-2 font-semibold py-2">
              Recieve purchase.
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-2 py-0 text-sm text-slate-500 leading-7">
              Review the purchase and click on the button below to recieve it.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className={cn("px-2")}>
            <div className="border px-3- rounded-[3px] mt-3 border-slate-200">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-[13px] px-3 py-2 border-b text-left font-medium">
                      Name
                    </th>
                    <th className="text-[13px]  px-3 py-2 border-b   text-left font-medium">
                      Unit price
                    </th>
                    <th className="text-[13px]  px-3 py-2 border-b   text-left font-medium">
                      Quantity
                    </th>
                    <th className="text-[13px] py-2 text-right   px-3 border-b font-medium">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                {purchase?.expand?.items?.map((e, index) => {
                  return (
                    <tr key={index} className="text-[13px] text-slate-600">
                      <td className="py-2 px-3 ">
                        {e?.expand?.ingredient?.name ||
                          e?.expand?.menu_item?.name}
                      </td>
                      <td className="py-2 px-3 ">
                        {Number(e?.unit_price).toLocaleString()} FRW
                      </td>
                      <td className="py-2  px-3 ">
                        <div className="w-fit relative">
                          {e?.quantity} {e?.item?.unit}
                        </div>
                      </td>
                      <td className="py-2 text-right px-3 ">
                        <div>
                          {Number(e?.quantity * e?.unit_price).toLocaleString()}{" "}
                          FRW
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </table>
              <div className="border-t">
                <div className="max-w-[200px] pt-2 ml-auto px-3">
                  <div className="flex pb-3 pt-0 sm:pt-1 items-center justify-between">
                    <h4 className="font-semibold text-slate-800 text-[12.5px]">
                      Total
                    </h4>
                    <span className="font-semibold text-slate-800 text-[12.5px]">
                      {purchase?.expand?.items
                        .filter((e) => !e.isDeleted)
                        .reduce(
                          (a, b) =>
                            a + Number(b.unit_price) * Number(b.quantity),
                          0
                        )
                        .toLocaleString()}{" "}
                      FRW
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <div className="mt-3 flex items-center gap-2 px-2 pb-1">
            <Button
              type="submit"
              onClick={recievePurchase}
              disabled={
                !purchase?.items || isSaving || purchase?.status === "recieved"
              }
              className="w-full"
              size="sm"
            >
              {isSaving && (
                <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
              )}
              Recieve Purchase
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

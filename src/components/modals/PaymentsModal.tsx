import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils";
import { Button } from "../ui/button";
import { Printer } from "lucide-react";

export function PurchasePaymentsModal({ open, setOpen, payments }: any) {
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>
              <span className="text-base px-2 font-semibold py-2">
                Purchase payments
              </span>
            </DialogTitle>
            <DialogDescription>
              <span className="px-2 py-0 text-sm text-slate-500 leading-7">
                View all payments for this purchase.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div>
            <div className={cn("px-2  mb-3")}>
              <div className="border px-3- rounded-[3px] mt-0 c border-slate-200">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-[13px] px-3 py-2 border-b text-left font-medium">
                        Date
                      </th>
                      <th className="text-[13px]  px-3 py-2 border-b   text-left font-medium">
                        Amount
                      </th>
                      <th className="text-[13px]  px-3 py-2 border-b   text-left font-medium">
                        Payment method
                      </th>

                      <th className="text-[13px] py-2  px-3 border-b  text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  {(payments || []).map((e, index) => {
                    return (
                      <tr className="text-[13px] text-slate-600">
                        <td className="py-2 px-3 ">
                          {new Date(e.created).toLocaleDateString("en-US")}
                        </td>
                        <td className="py-2 px-3 ">
                          {Number(e.amount).toLocaleString()} FRW
                        </td>
                        <td className="py-2 capitalize px-3 ">
                          {e.payment_method || "N/A"}
                        </td>
                        <td className="flex px-3 py-2 items-center justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => {
                              window.print();
                            }}
                          >
                            <Printer size={16} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </table>
                {!payments?.length ? (
                  <div className="border-t py-10 text-center justify-center text-[13px] text-slate-500">
                    No payments available
                  </div>
                ) : null}
                <div className="border-t">
                  <div className="max-w-[250px] pt-2 ml-auto px-3">
                    <div className="flex pb-3 pt-0 sm:pt-1 items-center justify-between">
                      <h4 className="font-semibold text-slate-800 text-[12.5px]">
                        Total
                      </h4>
                      <span className="font-semibold text-slate-800 text-[12.5px]">
                        {payments
                          ?.reduce((a, b) => a + Number(b.amount), 0)
                          .toLocaleString() || 0}{" "}
                        FRW
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

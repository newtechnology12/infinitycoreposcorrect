import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils";
import { DialogDescription } from "@radix-ui/react-dialog";
import { PlusCircle } from "react-feather";
import { useState } from "react";
import { CreditPaymentFormModal } from "./CreditPaymentFormModal";
export default function CreditsPaymentsModal({
  open,
  setOpen,
  refetch,
  credit,
}) {
  const [showPaymentFormModal, setshowPaymentFormModal] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[750px]">
          <DialogHeader>
            <DialogTitle>
              <span className="text-base px-2 font-semibold py-2">
                Credit Payments
              </span>
            </DialogTitle>
            <DialogDescription>
              <span className="px-2 py-0 text-sm text-slate-500 leading-7">
                List of credit payments, and their status.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="pb-2">
            <div>
              {!credit?.expand?.transactions?.length ? (
                <div>
                  <div className="flex py-6 items-center justify-center gap- flex-col text-center">
                    <img
                      className="w-16"
                      src="/images/payment-method-credit-card-svgrepo-com.svg"
                      alt=""
                    />
                    <div className="space-y-3 max-w-xs mt-3">
                      <h4 className="text-[14px] font-semibold">
                        No payments created yet.
                      </h4>
                      <p className="text-slate-500  leading-7 text-sm">
                        Add payments to the credit, to pay off the credit, or
                        dismiss the credit.
                      </p>
                    </div>
                  </div>
                </div>
              ) : undefined}
              {credit?.expand?.transactions?.length ? (
                <div className={cn("px-2")}>
                  <div className="border px-3- rounded-[3px] mt-3 border-slate-200">
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
                            Payment Method
                          </th>

                          <th className="text-[13px] py-2  px-3 border-b  text-left font-medium">
                            Created By
                          </th>

                          {/* <th className="text-[13px] py-2  px-3 border-b  text-right font-medium">
                            Action
                          </th> */}
                        </tr>
                      </thead>
                      {credit?.expand?.transactions.map((e, index) => {
                        return (
                          <tr
                            key={index}
                            className="text-[13px] text-slate-600"
                          >
                            <td className="py-2 px-3 ">
                              {new Date(e?.date).toLocaleDateString()}
                            </td>

                            <td className="py-2 px-3 ">
                              {(e?.amount).toLocaleString()} FRW
                            </td>
                            <td className="py-2 px-3 ">
                              {e?.expand?.payment_method?.name}
                            </td>
                            <td className="py-2 px-3 ">
                              {e?.expand?.created_by?.name}
                            </td>
                          </tr>
                        );
                      })}
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
            {credit?.status !== "paid" && (
              <div>
                <div className={cn("px-2  mt-4")}>
                  <a
                    onClick={() => {
                      setshowPaymentFormModal(true);
                    }}
                    className={`border gap-3 text-slate-600 font-medium text-[13px] text-center justify-center hover:bg-slate-100 cursor-pointer border-dashed w-full flex items-center border-slate-300 rounded-[3px] py-2 px-3 ${0}`}
                  >
                    <PlusCircle size={16} />
                    <span>Create a payment</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <CreditPaymentFormModal
        open={showPaymentFormModal}
        setOpen={setshowPaymentFormModal}
        credit={credit}
        onComplete={() => {
          refetch();
          setshowPaymentFormModal(false);
          setOpen(false);
        }}
      />
    </>
  );
}

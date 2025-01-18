import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { cn } from "@/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, CheckIcon, Delete, Printer, User } from "lucide-react";
import { Button } from "../ui/button";
import { useEffect, useMemo, useState } from "react";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import Loader from "../icons/Loader";
import { useAuth } from "@/context/auth.context";
import formatBill from "@/utils/formatBill";
import { useQuery } from "react-query";
import { Alert, AlertTitle } from "../ui/alert";
import BillToPrint from "../BillToPrint";
import { ScrollArea } from "../ui/scroll-area";
import InvoiceToPrint from "../InvoiceToPrint";
import { Input } from "../ui/input";
import { useRoles } from "@/context/roles.context";
import useSettings from "@/hooks/useSettings";

const formatTime = (date) => {
  const hours = date.getHours() % 12 || 12; // Convert to 12-hour format
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";

  const formattedTime = `${hours}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`;

  return formattedTime;
};

export function PaymentModal({ open, setOpen, ...props }: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[750px] gap-0 h-dvh md:h-fit !p-0 flex flex-col">
        <DialogHeader className="!text-left py-2">
          <DialogTitle>
            <span className="text-sm px-2 font-semibold py-2">Payment</span>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="w-full flex-1 scroller border-t border-t-slate-200 whitespace-nowrap">
          <Content {...props} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Content({ order, orderQuery, discounts }) {
  const [selectedBill, setselectedBill] = useState(order.bills[0]);

  const [discountToUse, setdiscountToUse] = useState(undefined);

  const dis = useMemo(
    () => discounts?.find((d) => d.id === discountToUse),
    [discounts, discountToUse]
  );

  const billsToUse = useMemo(() => {
    return order.expand.bills
      .filter(
        (e) =>
          e?.expand?.items
            .filter((e) => e.status !== "draft")
            .filter((e) => e.status !== "cancelled")?.length
      )
      .map((e) => {
        const bill = formatBill(e);
        const discountToUse = e.discount
          ? e?.expand?.discount?.amount
          : dis?.type === "percentage"
          ? (bill?.total * dis?.value) / 100
          : dis?.value;
        const total = bill.total - (discountToUse || 0);
        const balance = total - bill.total_paid;

        return {
          ...bill,
          discount: { amount: discountToUse || 0, id: dis?.id },
          total: bill.total,
          balance,
        };
      });
  }, [dis, order]);

  const activeBill = billsToUse.find((e) => e.id === selectedBill);

  // get all items in bills
  const items = useMemo(() => {
    const dd = (order?.expand?.bills || [])?.reduce((a, b) => {
      return [
        ...a,
        ...(b?.expand?.items
          .filter((e) => e.status !== "draft")
          .filter((e) => e.status !== "cancelled") || []),
      ];
    }, []);

    return dd;
  }, [order?.expand?.bills]);

  const { settings } = useSettings();

  const { canPerform } = useRoles();

  return (
    <div className="px-2 sm:pt-0 pt-4">
      <div className="grid grid-cols-1 pt-3 min-h-[500px] sm:grid-cols-2 gap-1- sm:gap-3-">
        <div className="pb-3 flex px-2 flex-col">
          <div className="flex mb-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-10 text-[12px] uppercase w-10 bg-slate-200 flex items-center justify-center text-slate-500 rounded-[4px]",
                  {
                    "bg-blue-500 text-white": true,
                  }
                )}
              >
                {order?.expand?.table?.code || "N.A"}
              </div>
              <div>
                <h4 className="text-[13px] mb-1 font-medium">
                  #Order {order.code}
                </h4>
                <p className="text-[12.5px] text-slate-500 font-medium">
                  {order?.itemsCount} items
                </p>
              </div>
            </div>

            <div className="flex justify-end items-end gap-2 flex-col">
              <span className="text-[12.5px] text-slate-500 font-medium">
                {new Date(order.created).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  weekday: "long",
                })}
              </span>
              <span className="text-[12.5px] text-slate-500 font-medium">
                {formatTime(new Date(order.created))}
              </span>
            </div>
          </div>
          {discounts?.length ? (
            <div className="mb-2">
              <Select
                // disabled={!order?.expand?.bills?.find((e) => e?.discount)}
                value={discountToUse}
                onValueChange={(e) => setdiscountToUse(e)}
              >
                <SelectTrigger className={cn("w-full")}>
                  <SelectValue placeholder={"Choose discount"} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectGroup>
                    {discounts.map((e, i) => {
                      return (
                        <SelectItem key={i} value={e.id}>
                          {e.name}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {billsToUse.map((e) => (
            <Bill
              setselectedBill={setselectedBill}
              selectedBill={selectedBill}
              bill={e}
              refetch={orderQuery?.refetch}
              order={order}
            />
          ))}

          <div>
            <div className="flex my-1 pb-[6px] pt-0 sm:pt-1 items-center justify-between">
              <h4 className="font-medium text-slate-500 text-[13px]">
                Grand Total
              </h4>
              <span className="font-semibold text-slate-800 text-[13px]">
                {Number(
                  billsToUse.reduce((a, b) => a + b.total, 0)
                ).toLocaleString()}
                FRW
              </span>
            </div>
            <div className="flex my-1 pb-[6px] pt-0 sm:pt-1 items-center justify-between">
              <h4 className="font-medium text-slate-500 text-[13px]">
                Total Paid
              </h4>
              <span className="font-semibold text-slate-800 text-[13px]">
                {Number(
                  billsToUse.reduce((a, b) => a + b.total_paid, 0)
                ).toLocaleString()}
                FRW
              </span>
            </div>
            <div className="flex my-1 pb-[6px] pt-0 sm:pt-1 items-center justify-between">
              <h4 className="font-medium text-slate-500 text-[13px]">
                Discount
              </h4>
              <span className="font-semibold text-slate-800 text-[13px]">
                -
                {Number(
                  billsToUse.reduce((a, b) => a + b?.discount?.amount, 0)
                ).toLocaleString()}
                FRW
              </span>
            </div>
            <div className="flex my-1 pb-[6px] pt-0 sm:pt-1 items-center justify-between">
              <h4 className="font-medium text-slate-500 text-[13px]">
                Balance/Remaining:
              </h4>
              <span className="font-semibold text-slate-800 text-[13px]">
                {Number(
                  billsToUse.reduce((a, b) => a + b.balance, 0)
                ).toLocaleString()}
                FRW
              </span>
            </div>
            {canPerform("print_full_bill") && (
              <BillToPrint
                number={"N.A"}
                Action={({ onClick }) => {
                  return (
                    <Button onClick={onClick} variant="outline" size="sm">
                      <Printer className="mr-2" size={14} />
                      <span>Print Full Bill</span>
                    </Button>
                  );
                }}
                items={items?.map((e) => {
                  return {
                    name: e?.expand?.menu?.name,
                    subTotal: e?.amount || 0,
                    quantity: e?.quantity,
                  };
                })}
                discount={
                  `-` + billsToUse.reduce((a, b) => a + b?.discount?.amount, 0)
                }
                extraInfo={[
                  {
                    title: "Waiter",
                    value: order?.expand?.waiter?.name,
                  },
                  {
                    title: "Tin Number",
                    value: settings?.company_tin,
                  },
                  ...[
                    ...(settings?.bills_metadata?.map((e) => ({
                      title: e.key,
                      value: e.value,
                    })) || []),
                  ],
                ].filter((e) => e)}
                // onAfterPrint={handleAfterPrint}
                total={items
                  .map((e) => e?.quantity * e?.amount)
                  .reduce((a, b) => a + b, 0)}
              />
            )}
          </div>
        </div>
        {activeBill && (
          <Pay
            order={order}
            onCompleted={() => {
              orderQuery.refetch();
            }}
            bill={activeBill}
          />
        )}
      </div>
    </div>
  );
}

function PaymentSelect({ setpayment_method, payment_method, disabled }) {
  const getPaymentMethods = async () => {
    const payment_methods = await pocketbase
      .collection("payment_methods")
      .getFullList();
    return payment_methods;
  };

  const { data } = useQuery("payment_methods", getPaymentMethods);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {[...(data || [])]?.map((e) => {
        return (
          <a
            onClick={() => {
              setpayment_method(e.id);
            }}
            className={cn(
              "text-[12.5px] text-slate-500 px-3 py-[6px] cursor-pointer rounded-[4px] border border-slate-200",
              {
                "bg-primary/10  text-primary border-primary":
                  payment_method === e.id,
                "pointer-events-none opacity-55": disabled,
              }
            )}
          >
            {e.name}
          </a>
        );
      })}
    </div>
  );
}

function Pay({ bill, onCompleted, order }) {
  const [isCompleting, setisCompleting] = useState(false);

  const [inputValue, setInputValue] = useState<any>(
    bill?.balance?.toString() || "0"
  );

  useEffect(() => {
    setInputValue(bill?.balance?.toString());
  }, [bill]);

  const handleButtonClick = (value) => {
    if (inputValue === "0") {
      setInputValue(value.toString());
    } else {
      setInputValue((prevValue) => prevValue + value);
    }
  };

  const [payment_method, setpayment_method] = useState(undefined);

  const handleDelete = () => {
    setInputValue((prevValue) => {
      const newVal = prevValue.slice(0, -1);
      if (!newVal.length) {
        return "0";
      } else {
        return newVal;
      }
    });
  };

  const { user } = useAuth();

  const handleCompleteOrder = async () => {
    setisCompleting(true);

    let inputToUse = inputValue;

    // check if the inputToUse is greater than the balance, then set theinputToUse to the balance
    if (parseInt(inputToUse) > bill.balance) {
      inputToUse = bill.balance;
    }

    const q = await pocketbase.collection("transactions").create({
      amount: inputToUse,
      payment_method: payment_method,
      order: order.id,
      order_bill: bill.id,
      customer: order.customer,
      bill_to: "pos",
      created_by: user.id,
      date: new Date(),
      type: "income",
      status: "pending",
      payed_by_name: customerName,
    });

    const payment_status = inputToUse < bill.balance ? "partial-paid" : "paid";

    // check if there is a discount applied then create its usage
    const discount = bill.discount?.id
      ? await pocketbase.collection("discounts_usage").create({
          discount: bill?.discount?.id,
          order: order.id,
          bill: bill.id,
          amount: bill.discount?.amount,
        })
      : null;

    return pocketbase
      .collection("order_bills")
      .update(bill.id, {
        payment_status: payment_status,
        "transactions+": payment_method !== "customer" ? q?.id : undefined,
        "credits+": payment_method === "customer" ? q.id : null,
        discount: discount?.id,
      })
      .then(() => {
        onCompleted();
        toast.success("payment confimed succesfully");
        setisCompleting(false);
      })
      .catch((e) => {
        onCompleted();
        toast.error(e.message);
        setisCompleting(false);
      });
  };

  const [customerName, setCustomerName] = useState("");

  return (
    <div className="sm:px-2 pb-3 w-full flex flex-col">
      {!bill.balance ? (
        <div className="mt-4 relative">
          <ScrollArea className="h-[280px] w-full relative rounded-[4px] border p-2">
            {bill.transactions.length ? (
              <div className="w-full h-full bg-white bg-opacity-80 flex items-center justify-center absolute z-40">
                <img className="h-20" src="/paid.png" alt="" />
              </div>
            ) : null}
            <div className="relative h-full">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="py-1 uppercase text-left">Item</th>
                    <th className="py-1 uppercase w-2/12 text-center">Qty</th>
                    <th className="py-1 uppercase w-3/12 text-right">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items
                    ?.filter((e) => e.status !== "draft")
                    ?.filter((e) => e.status !== "cancelled")
                    ?.map((e, i) => {
                      return (
                        <tr>
                          <td className="py-3 text-slate-500 text-left">
                            <span>{e.expand?.menu?.name}</span>
                          </td>
                          <td className="py-3 text-slate-500 text-center">
                            x{e.quantity}
                          </td>
                          <td className="py-3 text-slate-500 text-right">
                            {Number(e.amount).toLocaleString()} RWF
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </ScrollArea>
          {bill?.expand?.transactions?.map((e) => {
            return (
              <div className="flex my-2 pb-[6px] pt-0 sm:pt-1 items-center justify-between">
                <h4 className="font-medium text-slate-500- text-[12.5px]">
                  {e?.expand?.payment_method?.name}
                </h4>
                <span className="font-semibold text-slate-800 text-[12.5px]">
                  {Number(e.amount).toLocaleString()} FRW
                </span>
              </div>
            );
          })}

          <div className="w-full my-2 border-dashed h-[1px] bg-slate-200"></div>

          {bill.discount?.amount ? (
            <div className="flex my-1 pb-[6px] pt-0 sm:pt-1 items-center justify-between">
              <h4 className="font-medium text-slate-500- text-[13px]">
                Discount
              </h4>
              <span className="font-semibold text-slate-800 text-[13px]">
                -{Number(bill?.discount?.amount || 0).toLocaleString()} FRW
              </span>
            </div>
          ) : null}
          <div className="flex my-1 pb-[6px] pt-0 sm:pt-1 items-center justify-between">
            <h4 className="font-medium text-slate-500- text-[13px]">
              Total Paid
            </h4>
            <span className="font-semibold text-slate-800 text-[13px]">
              {Number(bill.total_paid).toLocaleString()} FRW
            </span>
          </div>
        </div>
      ) : (
        <>
          <div>
            <div>
              <h4 className="text-[13px] font-semibold">Choose Payment</h4>
            </div>
            <div className="mt-2">
              <PaymentSelect
                disabled={!bill.balance}
                setpayment_method={setpayment_method}
                payment_method={payment_method}
              />

              {!order.customer && payment_method === "customer" && (
                <Alert
                  variant="destructive"
                  className="px-3 pt-1 mt-3 rounded-[3px] py-[6px] h-fit"
                >
                  <AlertTitle>
                    <span className="text-[13.5px] leading-6">
                      Order must have customer to use customer account.
                    </span>
                  </AlertTitle>
                </Alert>
              )}
            </div>
          </div>
          <div className="h-full mt-2 flex flex-col bg-red-100-">
            <div className="flex-1">
              <div className="mt-3">
                <div className="py-2 sm:mb-0 mb-4 sm:py-3 border border-slate-200 rounded-sm">
                  <input
                    disabled={!bill.balance}
                    className="text-xl font-semibold sm:text-3xl bg-transparent text-center outline-none w-full"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={Number(inputValue)}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                    }}
                  />
                </div>
              </div>
              <div className="sm:grid mt-4 mb-0 hidden sm:mb-5 w-full grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((e, i) => {
                  return (
                    <a
                      key={i}
                      className={cn(
                        "text-center cursor-pointer select-none text-slate-600 hover:bg-slate-100 rounded-md py-2 sm:py-3 text-base font-medium",
                        {
                          "pointer-events-none": !bill.balance,
                        }
                      )}
                      onClick={() => handleButtonClick(e)}
                    >
                      {e}
                    </a>
                  );
                })}
                <a
                  onClick={() => handleButtonClick(".")}
                  className={cn(
                    "text-center py-3 text-base  select-none font-medium",
                    {
                      "pointer-events-none": !bill.balance,
                    }
                  )}
                >
                  .
                </a>
                <a
                  className={cn(
                    "text-center cursor-pointer text-slate-600  py-3 text-base font-medium",
                    {
                      "pointer-events-none": !bill.balance,
                    }
                  )}
                  onClick={() => handleButtonClick(0)}
                >
                  0
                </a>
                <a
                  className={cn(
                    "text-center cursor-pointer  select-none flex items-center justify-center py-3 text-xl font-medium",
                    {
                      "pointer-events-none": !bill.balance,
                    }
                  )}
                  onClick={handleDelete}
                >
                  <Delete size={22} className="text-slate-600 " />
                </a>
              </div>
            </div>
            <div className="relative">
              <User
                size={18}
                className="absolute top-3 left-4 mx-auto text-slate-500"
              />
              <Input
                onChange={(e) => {
                  setCustomerName(e.target.value);
                }}
                // disabled={order?.customer}
                value={customerName}
                className="mt-2- !px-11"
                placeholder="Enter Customer Name"
              />
            </div>
            <div className="my-4">
              <Button
                onClick={handleCompleteOrder}
                disabled={
                  !parseInt(inputValue) ||
                  isCompleting ||
                  !payment_method ||
                  (!order.customer && payment_method === "customer")
                }
                size="sm"
                className="w-full flex items-center gap-3"
              >
                {isCompleting && (
                  <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                )}
                <span>Confirm Payment</span>
                <CheckCircle strokeWidth={3} className="text-sm" size={14} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Bill({ bill, setselectedBill, selectedBill, refetch, order }) {
  const handleAfterPrint = () => {
    pocketbase
      .collection("order_bills")
      .update(bill.id, {
        printed: true,
        printed_at: new Date(),
      })
      .then(() => {
        refetch();
        toast.success("Invoice printed successfully");
      })
      .catch((e) => {
        toast.error(e.message);
      });
  };

  const { canPerform } = useRoles();

  const { settings } = useSettings();

  const { user } = useAuth();

  return (
    <>
      <div className="py-[6px]">
        <div
          onClick={() => setselectedBill(bill.id)}
          className={cn(
            "bg-slate-50 cursor-pointer pl-2 pr-3 py-[6px] border flex flex-col h-full justify-between rounded-[4px]",
            {
              "border-primary": selectedBill === bill.id,
            }
          )}
        >
          <div className="flex items-start gap-3">
            <div className="py-1 gap-4 flex-col justify-between h-full flex pl-[2px]">
              <div
                className={cn(
                  "h-5 w-5 border flex items-center justify-center text-white rounded-full",
                  {
                    "bg-primary border-primary": selectedBill === bill.id,
                  }
                )}
              >
                <CheckIcon size={16} />
              </div>

              {(!bill.printed || canPerform("re_print_bills")) && (
                <BillToPrint
                  number={bill?.code}
                  created={bill?.created}
                  Action={({ onClick }) => {
                    return (
                      <a
                        onClick={(e) => {
                          e.stopPropagation();
                          onClick();
                        }}
                        className={cn(
                          "h-7 cursor-pointer !bg-blue-500 px-2- py-2- w-7 flex items-center justify-center rounded-sm bg-slate-200-"
                        )}
                      >
                        <Printer className="text-white" size={14} />{" "}
                      </a>
                    );
                  }}
                  items={bill?.items?.map((e) => {
                    return {
                      name: e?.expand?.menu?.name,
                      subTotal: e?.amount,
                      quantity: e?.quantity,
                      variant: e?.variant,
                      status: e.status,
                    };
                  })}
                  discount={`-` + bill.discount?.amount}
                  extraInfo={[
                    bill?.printed
                      ? {
                          title: "NOTE",
                          value: "Bill is re-printed",
                        }
                      : undefined,
                    bill?.printed
                      ? {
                          title: "Reprinted By",
                          value: user?.names,
                        }
                      : undefined,
                    {
                      title: "Waiter",
                      value: order?.expand?.waiter?.name,
                    },
                    {
                      title: "Tin Number",
                      value: settings?.company_tin,
                    },
                    {
                      title: "Order",
                      value: order?.code,
                    },
                    ...[
                      ...(settings?.bills_metadata?.map((e) => ({
                        title: e.key,
                        value: e.value,
                      })) || []),
                    ],
                  ].filter((e) => e)}
                  onAfterPrint={handleAfterPrint}
                  total={bill.total}
                />
              )}
            </div>

            <div className="pt-0 flex-1 px-4-">
              <div className="hidden sm:flex pb-[6px] pt-1 items-center justify-between">
                <h4 className="font-medium text-slate-500 text-[12.5px]">
                  Items:
                </h4>
                <span className="font-medium text-slate-500 text-[12.5px]">
                  {bill?.itemsCount || 0} (Item{bill?.itemsCount > 1 && "s"})
                </span>
              </div>

              {bill?.discount?.amount ? (
                <div className="flex pb-[6px] pt-0 sm:pt-1 items-center justify-between">
                  <h4 className="font-medium text-slate-500 text-[13px]">
                    Discount:
                  </h4>
                  <span className="font-semibold text-slate-800 text-[13px]">
                    -{(bill?.discount?.amount || 0).toLocaleString()} FRW
                  </span>
                </div>
              ) : null}

              <div className="flex pb-[9px] pt-0 sm:pt-1 items-center justify-between">
                <h4 className="font-medium text-slate-500 text-[13px]">
                  Total:
                </h4>
                <span className="font-semibold text-slate-800 text-[13px]">
                  {(bill.total | 0).toLocaleString()} FRW
                </span>
              </div>
              <div className="flex pb-[6px] pt-0 sm:pt-1 items-center justify-between">
                <h4 className="font-medium text-slate-500 text-[13px]">
                  Balance/Remaining:
                </h4>
                <span className="font-semibold text-slate-800 text-[13px]">
                  {Number(bill.balance).toLocaleString()} FRW
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

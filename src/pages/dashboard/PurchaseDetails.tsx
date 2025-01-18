import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import pocketbase from "@/lib/pocketbase";
import { cn } from "@/utils";
import { Edit, Trash } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Download, PlusCircle } from "react-feather";
import { PurchasePaymentModal } from "@/components/modals/PurchasePaymentModal";
import useModalState from "@/hooks/useModalState";
import useConfirmModal from "@/hooks/useConfirmModal";
import { toast } from "sonner";
import ConfirmModal from "@/components/modals/ConfirmModal";
import useEditRow from "@/hooks/use-edit-row";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import Loader from "@/components/icons/Loader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppFormField from "@/components/forms/AppFormField";
import { useAuth } from "@/context/auth.context";
import { useRoles } from "@/context/roles.context";

export default function PurchaseDetails() {
  const { purchaseId } = useParams();

  const { data: data, refetch }: any = useQuery({
    queryKey: ["dashboard", "purchases-details", purchaseId],
    queryFn: async () => {
      const purchase = await pocketbase
        .collection("purchases")
        .getOne(purchaseId, {
          expand:
            "stock,payments,supplier,payments.payment_method,payments.created_by,items,items.item,items.adjustments,items.item.menu",
        });

      const total_amount = purchase?.expand?.items?.reduce((acc, item) => {
        return acc + item?.sub_total;
      }, 0);

      const paid_amount =
        purchase?.expand?.payments?.reduce((acc, item) => {
          return acc + (item?.amount || 0);
        }, 0) || 0;

      const due_amount = total_amount - paid_amount;

      return {
        ...purchase,
        total_amount,
        paid_amount,
        due_amount,
        items: purchase?.expand?.items?.map((e) => {
          return {
            ...e,
            item: e?.expand?.menu_item || e?.expand?.ingredient,
          };
        }),
        payments: purchase?.expand?.payments,
      };
    },
    enabled: !!purchaseId,
  });

  const report_status = useMemo(() => {
    const total =
      data?.expand?.items?.reduce((acc, e) => {
        return acc + e?.cost * e?.quantity;
      }, 0) || 0;
    const total_paid =
      data?.expand?.payments?.reduce((acc, e) => {
        return acc + e?.amount;
      }, 0) || 0;
    return [
      {
        name: "purchase_date",
        title: "Purchase date",
        value: data?.created
          ? new Date(data?.created).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "N.A",
      },
      {
        name: "invoice_number",
        title: "Invoice Number",
        value: "PUR-" + data?.invoice_number || "N.A",
      },
      {
        name: "order_status",
        title: "Order Status",
        value: data?.status || "N.A",
      },
      {
        name: "payment_status",
        title: "Payment Status",
        value: data?.payment_status || "N.A",
      },
      {
        name: "total_amount",
        title: "Total amount",
        value: total.toLocaleString() + " FRW",
      },
      {
        name: "paid_amount",
        title: "Paid amount",
        value: Number(total_paid).toLocaleString() + " FRW",
      },
      {
        name: "due_amount",
        title: "Balance amount",
        value: Number(total - total_paid).toLocaleString() + " FRW",
      },
    ];
  }, [data]);

  const [selected, setSelected] = useState("Purchase Items");

  const recievePurchaseMutation = useMutation({
    mutationFn: () => {
      return pocketbase.collection("purchases").update(data?.id, {
        status: "recieved",
      });
    },
    onSuccess: () => {
      toast.success("You have successfully recieved the purchase");
      refetch();
      recievePurchaseModal.close();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const recievePurchaseModal = useModalState();

  const { canPerform } = useRoles();

  return (
    <>
      <div className="px-3">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Purchases
            </h2>
            <BreadCrumb
              items={[
                {
                  title: "Purchases",
                  link: `/dashboard/inventory/purchases`,
                },
                { title: "Details", link: "/dashboard" },
              ]}
            />
          </div>

          {canPerform("recieve_purchase") && (
            <Button
              onClick={() => recievePurchaseModal.open()}
              size="sm"
              disabled={data?.status !== "pending"}
            >
              <Download size={16} className="mr-2" />
              <span>Complete Purchase recieve.</span>
            </Button>
          )}
        </div>
        <Card className="rounded-[4px] px-4 pt-2 mb-3 shadow-none">
          <div className="border-b-  border-dashed">
            <h4>
              <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                Purchase details
              </span>
            </h4>
            <div className="grid gap-4  pb-3 grid-cols-2 sm:grid-cols-5">
              {report_status.map((status, i) => (
                <div key={i}>
                  <h1 className="px-2- py-1 text-base sm:text-[16px] font-semibold capitalize">
                    {status.value}
                  </h1>
                  <div className="px-2- py-1 text-sm text-slate-500">
                    {status.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="border border-slate-200 bg-white rounded-[4px] overflow-hidden">
          <div className="w-full bg-white  border-b ">
            <div className="flex px-2 w-fit bg-white items-center justify-around">
              {[
                {
                  name: "Purchase Items",
                },
                canPerform("view_purchase_payments")
                  ? {
                      name: "Payments & Transactions",
                    }
                  : undefined,
              ]
                .filter((e) => e)
                .map((e, i) => {
                  return (
                    <a
                      key={i}
                      onClick={() => {
                        setSelected(e.name);
                      }}
                      className={cn(
                        "cursor-pointer px-8 capitalize text-center relative w-full- text-slate-700 text-[12.5px] sm:text-sm py-3  font-medium",
                        {
                          "text-primary ": selected === e.name,
                        }
                      )}
                    >
                      {selected === e.name && (
                        <div className="h-[3px] left-0 rounded-t-md bg-primary absolute bottom-0 w-full"></div>
                      )}
                      <span className=""> {e.name}</span>
                    </a>
                  );
                })}
            </div>
          </div>
          <div>
            {selected === "Payments & Transactions" && (
              <Payments
                purchase={data}
                payments={data?.payments}
                refetch={refetch}
              />
            )}
            {selected === "Purchase Items" && (
              <Items
                refetch={refetch}
                purchase={data}
                items={data?.items || []}
              />
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        title={"Recieve this purchase"}
        description={`Recieving this purchase will mark it as recieved and you will not be able to make any changes to it.`}
        onConfirm={() => {
          recievePurchaseMutation.mutate();
        }}
        isLoading={recievePurchaseMutation.isLoading}
        open={recievePurchaseModal.isOpen}
        onClose={() => {
          recievePurchaseModal.close();
        }}
      />
    </>
  );
}

function Payments({ payments = [], refetch, purchase }) {
  const newPaymentModal = useModalState();

  const confirmModal = useConfirmModal();

  const handleDelete = (e) => {
    confirmModal.setIsLoading(true);
    return pocketbase
      .collection("transactions")
      .delete(e?.id)
      .then(() => {
        refetch();
        confirmModal.close();
      })
      .catch((e) => {
        confirmModal.setIsLoading(false);
        toast.error(e.message);
      });
  };

  const paymentToEdit = useEditRow();

  const { canPerform } = useRoles();

  return (
    <>
      <ConfirmModal
        title={"Are you sure you want to delete?"}
        description={`Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi, amet
        a! Nihil`}
        meta={confirmModal.meta}
        onConfirm={handleDelete}
        isLoading={confirmModal.isLoading}
        open={confirmModal.isOpen}
        onClose={() => confirmModal.close()}
      />
      <div>
        <div className="p-4">
          <Table className="border rounded-[4px]">
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead className="!h-10 text-[12px] font-medium uppercase">
                  #
                </TableHead>
                <TableHead className="!h-10 text-[12px] font-medium uppercase">
                  Method
                </TableHead>
                <TableHead className="!h-10 text-[12px] font-medium uppercase">
                  Created at
                </TableHead>
                <TableHead className="!h-10 text-[12px] font-medium uppercase">
                  Created by
                </TableHead>{" "}
                <TableHead className="!h-10 text-[12px] font-medium uppercase">
                  Amount
                </TableHead>
                <TableHead className="!h-10 text-[12px] text-right font-medium uppercase">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((e, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium w-[50px]">
                    {index + 1}
                  </TableCell>
                  <TableCell className="!h-11 flex items-center gap-[2px]">
                    {e?.expand?.payment_method?.name || "N.A"}
                  </TableCell>
                  <TableCell className="!h-11">
                    {new Date(e?.created).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      minute: "numeric",
                      hour: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="!h-11">
                    {e?.expand?.created_by?.name || "N.A"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {e?.amount.toLocaleString()} FRW
                  </TableCell>
                  <TableCell className="!h-11">
                    <div className="flex items-center justify-end gap-2">
                      {/* <Button
                        type="button"
                        onClick={() => {
                          paymentToEdit.edit(e);
                        }}
                        size="sm"
                        className="!px-2 !h-7 !bg-blue-500 "
                      >
                        <Edit size={14} className="" />
                      </Button> */}
                      {canPerform("delete_purchase_payment") && (
                        <Button
                          type="button"
                          onClick={() => {
                            confirmModal.open({ meta: e });
                          }}
                          size="sm"
                          variant="destructive"
                          className="!px-2 !h-7 "
                        >
                          <Trash size={14} className="" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            {!payments.length ? (
              <TableRow>
                <TableCell colSpan={6} className="bg-yellow-50-">
                  <div className="flex py-6 justify-center items-center ">
                    <div className="flex py-6 items-center justify-center gap- flex-col text-center">
                      <img
                        className="w-14"
                        src="/images/payment-method-credit-card-svgrepo-com.svg"
                        alt=""
                      />
                      <div className="space-y-2 max-w-xs mt-3">
                        <h4 className="text-[14px] font-semibold">
                          No payment made yet.
                        </h4>
                        <p className="text-slate-500 font-normal leading-7 text-sm">
                          You can make a payment by clicking the button below.
                        </p>
                        {canPerform("create_purchase_payment") && (
                          <Button
                            variant="link"
                            className="underline text-primary "
                            onClick={() => newPaymentModal.setisOpen(true)}
                            size="sm"
                          >
                            <PlusCircle size={16} className="mr-2" />
                            Make first Payment
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <></>
            )}
            {payments.length !== 0 && (
              <TableFooter className="bg-slate-50">
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell colSpan={3}> </TableCell>
                  <TableCell className="text-right-">
                    {payments.reduce((acc, e) => {
                      return acc + e.amount;
                    }, 0)}{" "}
                    FRW
                  </TableCell>
                  <TableCell> </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
          {canPerform("create_purchase_payment") && (
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => {
                  newPaymentModal.setisOpen(true);
                }}
              >
                <PlusCircle size={16} className="mr-2" />
                Add Payment
              </Button>
            </div>
          )}
        </div>
      </div>
      <PurchasePaymentModal
        onComplete={() => {
          refetch();
          newPaymentModal.close();
          paymentToEdit.close();
        }}
        purchase={purchase}
        setOpen={
          paymentToEdit.isOpen
            ? paymentToEdit.setOpen
            : newPaymentModal.setisOpen
        }
        open={newPaymentModal.isOpen}
      />
    </>
  );
}

function Items({ items = [], purchase, refetch }) {
  const [itemToRecieve, setitemToRecieve] = useState<any>(null);

  const itemsToShow = items.map((e) => {
    const recieved = e?.expand?.adjustments?.reduce((acc, e) => {
      return acc + e.quantity_adjusted;
    }, 0);

    return {
      ...e,
      quantity_remaining: e?.quantity - (recieved || 0),
      quantity_received: recieved || 0,
      sub_total: e?.cost * (recieved || 0),
    };
  });

  const { canPerform } = useRoles();

  return (
    <>
      {" "}
      <div className="p-4">
        <Table className="border rounded-[4px]">
          <TableHeader>
            <TableRow className="bg-slate-100">
              <TableHead className="!h-10 text-[12px] font-medium uppercase">
                #
              </TableHead>
              <TableHead className="!h-10 text-[12px] font-medium uppercase">
                Name
              </TableHead>
              <TableHead className="!h-10 text-[12px] font-medium uppercase">
                Quantity
              </TableHead>
              <TableHead className="!h-10 text-[12px] font-medium uppercase">
                Q Received
              </TableHead>
              <TableHead className="!h-10 text-[12px] font-medium uppercase">
                Q Remaining
              </TableHead>
              <TableHead className="!h-10 text-[12px] font-medium uppercase">
                Cost
              </TableHead>
              <TableHead className="!h-10 text-[12px] font-medium uppercase">
                SubTotal
              </TableHead>
              <TableHead className="!h-10 text-[12px] font-medium uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemsToShow.map((e, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium w-[50px]">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium capitalize">
                  {e?.expand?.item?.name || e?.expand?.item?.expand?.menu?.name}
                </TableCell>
                <TableCell className="!h-11 flex items-center gap-[2px]">
                  <div className="w-fit relative">{e?.quantity}</div>
                  <div className="w-fit relative">
                    {e?.expand?.ingredient?.expand?.unit?.name}
                  </div>
                </TableCell>
                <TableCell className="!h-11">{e?.quantity_received}</TableCell>
                <TableCell
                  className={cn("!h-11", {
                    "text-red-500": e.quantity_remaining > 0,
                  })}
                >
                  {e.quantity_remaining}
                </TableCell>
                <TableCell className="!h-11">
                  {(e?.cost || 0).toLocaleString()} FRW
                </TableCell>

                <TableCell className="!h-11">
                  {e?.sub_total?.toLocaleString()} FRW
                </TableCell>
                <TableCell className="!h-11">
                  {canPerform("recieve_purchase") && (
                    <Button
                      disabled={
                        e.quantity_remaining === 0 ||
                        purchase.status === "recieved"
                      }
                      onClick={() => {
                        setitemToRecieve(e);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Receive Item
                      <ArrowLeft size={14} className="ml-2" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {items.length !== 0 && (
            <TableFooter className="bg-slate-50">
              <TableRow>
                <TableCell colSpan={1}>Total</TableCell>
                <TableCell className="text-right"></TableCell>
                <TableCell>
                  <span className="font-semibold gap-[2px] text-sm">---</span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-[13px]">--</span>
                </TableCell>{" "}
                <TableCell>
                  <span className="font-semibold text-[13px]">--</span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-[13px]">--</span>
                </TableCell>{" "}
                <TableCell>
                  <span className={cn("font-semibold text-[13px]", {})}>
                    {items
                      .reduce((acc, e) => {
                        return acc + Number(e.cost) * e.quantity || 0;
                      }, 0)
                      .toLocaleString()}{" "}
                    FRW
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-[13px]">---</span>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
      <RecievePurchaseItem
        refetch={refetch}
        open={itemToRecieve}
        setOpen={(e) => {
          if (!e) {
            setitemToRecieve(null);
          }
        }}
        item={itemToRecieve}
        purchase={purchase}
      />
    </>
  );
}

function RecievePurchaseItem({ open, setOpen, item, purchase, refetch }) {
  const formSchema = z.object({
    quantity: z.string().min(1, { message: "Please enter a quantity" }),
  });

  const quantity_remaning =
    item?.quantity -
    (item?.expand?.adjustments?.reduce((acc, e) => {
      return acc + e.quantity_adjusted;
    }, 0) || 0);

  // const formSchema =
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      quantity: quantity_remaning?.toString(),
    },
  });

  const { user } = useAuth();

  const getOrCreateStockItem = async (item) => {
    const stockItem = await pocketbase.collection("stock_items").getFullList({
      filter: `item="${item?.expand?.item?.id}" && stock="${purchase?.stock}"`,
    });

    if (stockItem.length) {
      return stockItem[0];
    }

    const newStockItem = await pocketbase.collection("stock_items").create({
      item: item?.expand?.item?.id,
      available_quantity: 0,
      quantity_alert: 0,
      stock: purchase.stock,
    });

    return newStockItem;
  };

  const onSubmit = async (values) => {
    try {
      // check quantity does not exceed the quantity in the purchase
      if (values.quantity > quantity_remaning) {
        throw new Error(
          "Quantity exceeds the remaning quantity in the purchase"
        );
      }

      const stockItemToUse = await getOrCreateStockItem(item);

      const adjustmentData = {
        stock: purchase.stock,
        quantity_adjusted: values.quantity,
        type: "addition",
        reason: "purchase",
        stock_item: stockItemToUse?.id,
        created_by: user?.id,
        notes: "",
        quantity_before: stockItemToUse?.available_quantity || 0,
        quantity_after: quantity_after_recieving,
      };

      const adjustment = await pocketbase
        .collection("adjustments")
        .create(adjustmentData);

      await pocketbase.collection("stock_items").update(stockItemToUse?.id, {
        available_quantity:
          stockItemToUse?.available_quantity + Number(values.quantity),
      });

      // update purchase items adjustments
      await pocketbase.collection("purchase_items").update(item?.id, {
        "adjustments+": adjustment?.id,
      });

      setOpen(false);
      toast.success("Item recieved successfully");
      refetch();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // stock item query
  const { data: stockItem } = useQuery({
    queryKey: ["dashboard", "stock-item", item?.id],
    queryFn: async () => {
      const items = await pocketbase.collection("stock_items").getFullList({
        filter: `item="${item?.id}"`,
      });
      return items[0];
    },
    enabled: !!item,
  });

  const quantity_after_recieving = useMemo(() => {
    return (
      (stockItem?.available_quantity || 0) +
      Number(form.getValues("quantity") || 0)
    );
  }, [stockItem, form.watch("quantity")]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[15px]">
            Recive Item Purchase item.
          </DialogTitle>
          <DialogDescription className="text-sm leading-7">
            This action cannot be undone. This will permanently.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div>
                <AppFormField
                  form={form}
                  label={"Enter a quantity"}
                  placeholder={"Enter quantity"}
                  name={"quantity"}
                  type={"number"}
                />
              </div>
              <div className="text-sm flex flex-col gap-1 leading-7">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Stock:</span>
                  <span className="text-slate-600">
                    {purchase?.expand?.stock?.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Quantity After Recieving</span>:{" "}
                  <span className="text-slate-600">
                    {quantity_after_recieving || 0}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <div className="mt-6 flex items-center gap-2 px-2 pb-1">
                <Button
                  type="submit"
                  onClick={() => form.handleSubmit(onSubmit)}
                  disabled={
                    form.formState.disabled ||
                    form.formState.isSubmitting ||
                    !Number(form.watch("quantity"))
                  }
                  className="w-full"
                  size="sm"
                >
                  {form.formState.isSubmitting && (
                    <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                  )}
                  Recieve Item in stock.
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

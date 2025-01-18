import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/auth.context";
import pocketbase from "@/lib/pocketbase";
import formatOrder from "@/utils/formatOrder";
import { useMemo, useState } from "react";
import { ArrowLeft, Edit, Trash2, XCircle } from "react-feather";
import { useMutation, useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import AppFormTextArea from "@/components/forms/AppFormTextArea";
import Loader from "@/components/icons/Loader";
import useModalState from "@/hooks/useModalState";
import ConfirmModal from "@/components/modals/ConfirmModal";
import useConfirmModal from "@/hooks/useConfirmModal";
import { PaymentModal } from "@/components/modals/PaymentModal";
import UpdateOrderItemModal from "@/components/UpdateOrderItemModal";
import getFileUrl from "@/utils/getFileUrl";
import { CreditCard, SplitIcon, Trash, XIcon } from "lucide-react";
import TicketItem from "@/components/TicketItem";
import { useRoles } from "@/context/roles.context";
import { cn } from "@/utils";
import { SplitBillModal } from "@/components/modals/SplitBillModal";
import recordActivtyLog from "@/utils/recordActivtyLog";
import useEditRow from "@/hooks/use-edit-row";
import CancelItemModal from "@/components/CancelItemModal";

export default function OrderDetails() {
  const navigate = useNavigate();

  const getOrder = async () => {
    const order = await pocketbase.collection("orders").getOne(orderId, {
      expand:
        "bills,bills.discount,bills.discount.discount,table,items,items.order_ticket,items.order_ticket.order_station,customer,waiter,bills,bills.transactions,items.menu,bills.transactions.payment_method,canceled_by,bills.items,bills.items.menu,tickets,tickets.order_station,items.cancelled_by",
    });

    const {
      total,
      balance,
      total_cancelled,
      paidAmount: total_paid,
    } = formatOrder({
      items: order.expand?.items || [],
      expand: {
        bills: order.expand?.bills,
      },
    });

    // const total_paid = order?.expand?.bills?.reduce(
    //   (acc, bill) =>
    //     acc +
    //     bill?.expand?.transactions?.reduce(
    //       (acc, transaction) => acc + Number(transaction.amount),
    //       0
    //     ),
    //   0
    // );
    // get payment_status and get pending, paid, paid partially
    const payment_status =
      total_paid === total
        ? "paid"
        : total_paid > 0
        ? "partially paid"
        : "pending";

    const total_discount = order?.expand?.bills?.reduce(
      (acc, bill) => acc + (bill?.expand?.discount?.amount || 0),
      0
    );

    return {
      id: order.id,
      code: order.code.toString(),
      table: order?.expand?.table?.code || "N.A",
      items_count: order.expand?.items?.length || 0,
      items: order.expand?.items || [],
      total_discount: total_discount,
      status: order?.status,
      completed_at: order.completed_at
        ? new Date(order.completed_at).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            minute: "2-digit",
            hour: "2-digit",
          })
        : "---",
      canceled_at: order.canceled_at
        ? new Date(order.canceled_at).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            minute: "2-digit",
            hour: "2-digit",
          })
        : "---",
      transactions: order?.expand?.bills?.reduce(
        (acc, bill) => acc.concat(bill?.expand?.transactions || []),
        []
      ),
      payment_status,
      total_paid: (total_paid || 0)?.toLocaleString() + " FRW",
      guests: order.guests,
      created: new Date(order.created).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        minute: "2-digit",
        hour: "2-digit",
      }),
      customer: order?.expand?.customer?.names || "N.A",
      total: total,
      total_cancelled,
      waiter: order?.expand?.waiter?.name,
      balance: balance,
      canceled_by: order?.expand?.canceled_by?.name,
      original: order,
    };
  };

  const orderId = useParams().orderId;

  const orderQuery: any = useQuery(["orders", orderId], getOrder, {
    enabled: Boolean(orderId),
  });

  const { data, refetch } = orderQuery;

  const summary = useMemo(
    () =>
      [
        {
          name: "waiter",
          title: "Waiter",
          value: data ? data?.waiter : "---",
        },
        {
          name: "total",
          title: "Total Amount",
          value: data ? data?.total.toLocaleString() + " FRW" : "---",
        },
        {
          name: "total_paid",
          title: "Total Paid",
          value: data ? data?.total_paid : "---",
        },
        {
          name: "total_paid",
          title: "Balance/remaning",
          value: data ? Number(data?.balance).toLocaleString() + " FRW" : "---",
        },
        {
          name: "table",
          title: "Table",
          value: data ? data?.table : "---",
        },
        {
          name: "customer",
          title: "Customer",
          value: data ? data?.customer : "---",
        },
        {
          name: "status",
          title: "Status",
          value: data ? data?.status : "---",
        },
        {
          name: "payment_status",
          title: "Payment Status",
          value: data ? data?.payment_status : "---",
        },

        {
          name: "created",
          title: "Created",
          value: data ? data?.created : "---",
        },

        {
          name: "items_count",
          title: "Items Count",
          value: data ? data?.items_count : "---",
        },
        {
          name: "guests",
          title: "Guests",
          value: data ? data?.guests : "---",
        },
        {
          name: "completed_at",
          title: "Completed At",
          value: data ? data?.completed_at || "N.A" : "---",
        },
        {
          name: "canceled_at",
          title: "Canceled At",
          value: data ? data?.canceled_at || "N.A" : "---",
        },
        {
          name: "canceled_by",
          title: "Canceled By",
          value: data ? data?.canceled_by || "N.A" : "---",
        },
        // total_discount
        {
          name: "total_discount",
          title: "Total Discount",
          value: data ? data?.total_discount?.toLocaleString() + " FRW" : "---",
        },
        {
          name: "total_cancelled",
          title: "Total cancelled",
          value: data
            ? data?.total_cancelled?.toLocaleString() + " FRW"
            : "---",
        },
      ].filter((e) => e.value !== "---"),
    [data]
  );

  const deleteTransaction = async (transactionId: string) => {
    await pocketbase
      .collection("transactions")
      .delete(transactionId)
      .then(() => {
        refetch();
      })
      .catch((e) => {
        console.log(e);
        toast.error("Failed to delete the transaction");
      });
  };

  const cancledModal = useModalState();

  const [error, setError] = useState(undefined);

  const completeMutation = useMutation({
    mutationFn: () => {
      return pocketbase.collection("orders").update(data.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("You have successfully completed the order");
      completeOrderConfirmation.close();
      refetch();
    },
    onError: (error: any) => {
      setError(error.message);
      console.log(error);
    },
  });

  const completeOrderConfirmation = useConfirmModal();

  const paymentModal = useModalState();

  const [itemToEdit, setitemToEdit] = useState(undefined);

  const { canPerform } = useRoles();

  const itemToCancelModal = useEditRow();

  const splitBillModal = useModalState();

  return (
    <>
      <CancelItemModal
        record={itemToCancelModal?.row?.original}
        open={itemToCancelModal.isOpen}
        setOpen={itemToCancelModal.setOpen}
        onCompleted={() => {
          orderQuery.refetch();
          itemToCancelModal.close();
        }}
      />

      <SplitBillModal
        order={data?.original}
        open={splitBillModal.isOpen}
        setOpen={splitBillModal.setisOpen}
        orderQuery={orderQuery}
        onCompleted={() => {
          orderQuery.refetch();
          splitBillModal.close();
        }}
      />

      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Order Details #{data?.code}
            </h2>
            <BreadCrumb
              items={[
                { title: "Orders", link: "/dashboard" },
                { title: `Order#${data?.code}`, link: "/dashboard" },
              ]}
            />
          </div>
        </div>
        <Card className="rounded-[4px] overflow-hidden">
          <div className="mt-1">
            <div className="flex pr-3 sm:flex-row flex-col sm:items-center justify-between">
              <div className="px-3 py-3">
                <Button
                  onClick={() => {
                    navigate(-1);
                  }}
                  size="sm"
                  className="gap-3 rounded-full text-primary hover:underline"
                  variant="secondary"
                >
                  <ArrowLeft size={16} />
                  <span>Go back to orders</span>
                </Button>
              </div>
              <div className="flex px-3 mb-4 items-center gap-2">
                <Button
                  onClick={() => splitBillModal.open()}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  size="sm"
                  disabled={
                    data?.status === "completed" || data?.items?.length < 2
                    // !order?.balance
                  }
                >
                  Split Bills
                  <SplitIcon size={16} className="ml-3" />
                </Button>
                {/* {data?.status === "on going" && ( */}
                {canPerform("process_order_payment") && (
                  <Button
                    onClick={() => {
                      paymentModal.setisOpen(true);
                    }}
                    disabled={
                      data?.status === "canceled" || !data?.items?.length
                    }
                    size="sm"
                  >
                    <CreditCard size={16} className="mr-2" />
                    Process payment
                  </Button>
                )}

                {data?.status === "on going" && (
                  <Button
                    onClick={() => {
                      completeOrderConfirmation.setisOpen(true);
                    }}
                    variant="secondary"
                    disabled={data?.status === "canceled"}
                    className="text-green-500 border-green-200 border bg-green-50 hover:bg-green-100"
                    size="sm"
                  >
                    <XCircle size={16} className="mr-2" />
                    Complete Order
                  </Button>
                )}
                {data?.status === "on going" && (
                  <Button
                    onClick={() => {
                      cancledModal.setisOpen(true);
                    }}
                    variant="secondary"
                    disabled={
                      data?.status === "canceled" || data?.items?.length
                    }
                    className="text-red-500 border-red-200 border bg-red-50 hover:bg-red-100"
                    size="sm"
                  >
                    <XCircle size={16} className="mr-2" />
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
            <div className="border-b px-3  border-dashed">
              <h4>
                <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                  Order summary
                </span>
              </h4>
              <div className="grid gap-4  pb-3 grid-cols-2 sm:grid-cols-5">
                {summary.map((status, i) => (
                  <div key={i}>
                    <h1 className="px-2- py-1 capitalize text-[14px] sm:text-[15px] font-semibold">
                      {status.value}
                    </h1>
                    <div className="px-2- py-1 text-sm text-slate-500">
                      {status.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid px-2- py-1 grid-cols-1 gap-2">
              <div className="border-r px-4 border-dashed">
                <h4>
                  <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                    Order Items
                  </span>
                </h4>
                <div className="overflow-x-auto border">
                  <table className="w-full ">
                    <tr className="text-left text-[11px] bg-slate-50 font-medium uppercase">
                      <th className="py-2 border-b px-3">Item</th>
                      <th className="py-2 truncate border-b px-3">Quantity</th>
                      <th className="text-right- truncate py-2  px-3 border-b">
                        Total
                      </th>
                      <th className="py-2 truncate border-b px-3">Status</th>
                      <th className="py-2 truncate border-b px-3">
                        Destination
                      </th>
                      <th className="py-2 border-b px-3">Fired at</th>
                      <th className="py-2 truncate border-b px-3">
                        Cancelled By
                      </th>
                      <th className="py-2 truncate border-b px-3">
                        Cancel Reason.
                      </th>
                      <th className="text-right border-b px-3">Actions</th>
                    </tr>
                    {data?.items.length === 0 && (
                      <tr>
                        <td colSpan={6}>
                          <div className="py-12 text-center">
                            <p className="text-[13px] text-slate-500 font-medium leading-none">
                              No items
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}

                    {data?.items
                      .map((e) => ({
                        ...e?.expand?.menu,
                        order_item_id: e.id,
                        quantity: e.quantity,
                        status: e.status,
                        original: e,
                        order_station:
                          e?.expand?.order_ticket?.expand?.order_station?.name,
                        cancelled_by: e?.expand?.cancelled_by?.name,
                        cancel_reason: e?.cancel_reason,
                        fired_at: e.expand?.order_ticket?.fired_at,
                        amount: e.amount,
                      }))
                      .map((item: any) => (
                        <tr>
                          <td className="py-[8px] px-3 border-b">
                            <div className="flex items-center gap-2">
                              <img
                                className="h-8 rounded-[4px] border border-slate-200- w-8"
                                src={
                                  item?.image ||
                                  getFileUrl({
                                    file: item?.image_file,
                                    collection: "menu_items",
                                    record: item?.id,
                                  }) ||
                                  "/images/menu_placeholder.png"
                                }
                                alt=""
                              />{" "}
                              <p
                                className={cn(
                                  "text-[13px] truncate text-slate-500 font-medium leading-none",
                                  {
                                    "line-through": item.status === "cancelled",
                                  }
                                )}
                              >
                                {item?.name}
                              </p>
                            </div>
                          </td>
                          <td
                            className={cn(
                              "py-[6px] text-[13px]  px-3 border-b font-medium",
                              {
                                "line-through": item.status === "cancelled",
                              }
                            )}
                          >
                            x{item?.quantity}
                          </td>
                          <td
                            className={cn(
                              "text-right- text-[13px] truncate px-3 border-b font-medium text-slate-500 py-[6px]",
                              {
                                "line-through": item.status === "cancelled",
                              }
                            )}
                          >
                            {parseInt(item?.amount)?.toLocaleString()} FRW
                          </td>
                          <td
                            className={cn(
                              "text-right- text-[13px] truncate capitalize  px-3 border-b font-medium text-slate-500 py-[6px]",
                              {
                                "text-green-500": item.status === "completed",
                                "text-red-500": item.status === "cancelled",
                                "text-yellow-500": item.status === "pending",
                              },
                              {
                                "line-through": item.status === "cancelled",
                              }
                            )}
                          >
                            {item.status}
                          </td>{" "}
                          <td
                            className={cn(
                              "text-right- text-[13px] truncate px-3 border-b font-medium text-slate-500 py-[6px]",
                              {
                                "line-through": item.status === "cancelled",
                              }
                            )}
                          >
                            {item.order_station || "N.A"}
                          </td>
                          <td
                            className={cn(
                              "text-right- text-[13px] truncate px-3 border-b font-medium text-slate-500 py-[6px]",
                              {
                                "line-through": item.status === "cancelled",
                              }
                            )}
                          >
                            {new Date(item.fired_at).toLocaleDateString(
                              "en-US",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            ) || "N.A"}
                          </td>
                          <td
                            className={cn(
                              "text-right- text-[13px] truncate px-3 border-b font-medium text-slate-500 py-[6px]",
                              {
                                "line-through": item.status === "cancelled",
                              }
                            )}
                          >
                            {item?.cancelled_by || "N.A"}
                          </td>
                          <td
                            className={cn(
                              "text-right- text-[13px] capitalize truncate px-3 border-b font-medium text-slate-500 py-[6px]"
                            )}
                          >
                            {item?.cancel_reason || "N.A"}
                          </td>
                          <td className="text-right text-[13px]  px-3 border-b font-medium text-slate-500 py-[6px]">
                            <div className="flex items-center gap-3 w-full justify-end">
                              {canPerform("delete_order_items") &&
                                item?.status === "pending" && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="px-2"
                                    onClick={() => {
                                      setitemToEdit(item?.original);
                                    }}
                                  >
                                    <Edit size={15} className="text-blue-500" />
                                  </Button>
                                )}
                              {canPerform("delete_order_items") &&
                                item.status === "draft" && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="px-2"
                                    onClick={() => {
                                      if (
                                        confirm(
                                          "Are you shure you want to delete?"
                                        )
                                      ) {
                                        return pocketbase
                                          .collection("order_items")
                                          .delete(item?.order_item_id)
                                          .then((e) => {
                                            refetch();
                                          });
                                      }
                                    }}
                                  >
                                    <Trash size={15} className="text-red-500" />
                                  </Button>
                                )}
                              {canPerform("cancel_items") &&
                                (item.status === "pending" ||
                                  item.status === "completed") && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="px-2"
                                    onClick={() => itemToCancelModal.edit(item)}
                                  >
                                    <XIcon size={15} className="text-red-500" />
                                  </Button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    {data?.items.length !== 0 && (
                      <tr>
                        <td className="py-[10px]  px-3  border-t border-dashed text-[13px] font-medium">
                          Total
                        </td>
                        <td className="py-[10px] px-3  text-[13px] border-t border-dashed  font-medium">
                          x{data?.items_count || 0}
                        </td>
                        <td
                          colSpan={2}
                          className="text-left px-3  font-semibold text-[13px] border-t border-dashed  text-slate-900 py-[10px]"
                        >
                          {Number(data?.total || 0).toLocaleString()}
                          FRW
                        </td>
                      </tr>
                    )}
                  </table>
                </div>
              </div>
              <div className="px-3 mt-3 mb-5-">
                <h4>
                  <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                    Payments/Transactions
                  </span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border">
                    <tr className="text-left bg-slate-50 border-b text-[11px] font-medium uppercase">
                      <th className="text-right- truncate border-b px-3  [10px] ">
                        Payment method
                      </th>
                      <th className="py-[10px] truncate border-b px-3 ">
                        Amount
                      </th>
                      <th className="py-[10px]  border-b px-3 ">Time</th>
                      <th className="text-right [10px]  border-b px-3 ">
                        Actions
                      </th>
                    </tr>
                    {data?.transactions?.length === 0 && (
                      <tr>
                        <td colSpan={4}>
                          <div className="py-12 text-center">
                            <p className="text-[13px] text-slate-500 font-medium leading-none">
                              No Transactions yet
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}

                    {data?.transactions?.map((t: any) => (
                      <tr>
                        <td className="py-[6px] truncate text-[13px] px-3 font-medium">
                          {t?.expand?.payment_method?.name}{" "}
                        </td>

                        <td className="py-[6px] truncate text-[13px] px-3 font-medium">
                          {Number(t.amount || 0).toLocaleString()} FRW
                        </td>
                        <td className="text-right- truncate text-[13px] font-medium text-slate-500 py-[6px]">
                          {new Date(t.created).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="text-right text-[13px] px-3 font-medium text-slate-500 py-[6px]">
                          <div className="flex items-center gap-3 w-full justify-end">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="px-2"
                              disabled={
                                data?.status === "canceled" ||
                                data?.status === "completed"
                              }
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to delete this transaction?"
                                  )
                                ) {
                                  deleteTransaction(t.id);
                                }
                              }}
                            >
                              <Trash2 size={15} className="text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {data?.transactions.length !== 0 && (
                      <tr>
                        <td className="py-[10px] px-3 border-t border-dashed text-[13px] font-medium">
                          Total
                        </td>
                        <td className="py-[10px]  px-3  text-[13px] border-t border-dashed  font-medium">
                          {Number(
                            data?.transactions?.reduce(
                              (acc, transaction) => acc + transaction.amount,
                              0
                            ) || 0
                          ).toLocaleString()}{" "}
                          FRW
                        </td>
                        <td
                          colSpan={2}
                          className="text-left font-semibold text-[13px] border-t border-dashed  text-slate-900 py-[10px]"
                        ></td>
                      </tr>
                    )}
                  </table>
                </div>
              </div>
              <div className="px-3 mt-3 mb-5">
                <h4>
                  <span className="py-2 uppercase text-[12px] block font-medium text-slate-500">
                    Order Tickets
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(orderQuery?.data?.original?.expand?.tickets || []).map(
                    (e, i) => {
                      const items = orderQuery?.data?.items?.filter(
                        (i) => i.order_ticket === e.id
                      );
                      const sortedItems = items;
                      return (
                        <TicketItem
                          tickets={orderQuery?.data?.expand?.tickets}
                          ticket={{
                            id: e.id,
                            code: e.code,
                            printed: e.printed,
                            name: e.name,
                            count: sortedItems?.length || 0,
                            items: sortedItems,
                            status: e.status,
                            fired_at: e.fired_at,
                            order_station: e.expand?.order_station,
                            created: e.created,
                          }}
                          setactiveCourse={() => {}}
                          key={i}
                          activeCourse={undefined}
                          orderQuery={orderQuery}
                          order={orderQuery?.data?.original}
                          index={i}
                        />
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <CancelModal
        open={cancledModal.isOpen}
        setOpen={cancledModal.setisOpen}
        order={data}
        onCompleted={() => {
          refetch();
          cancledModal.setisOpen(false);
        }}
      />

      <UpdateOrderItemModal
        readOnly={false}
        item={itemToEdit}
        open={Boolean(itemToEdit)}
        onCompleted={() => {
          refetch();
        }}
        order={data}
        tickets={[]}
        setOpen={setitemToEdit}
        ticket={undefined}
      />

      <ConfirmModal
        title={"Are you sure you want to complete the order?"}
        description={`Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi, amet
        a! Nihil`}
        error={error}
        onConfirm={() => {
          completeMutation.mutate();
        }}
        isLoading={completeMutation.isLoading}
        open={completeOrderConfirmation.isOpen}
        onClose={() => completeOrderConfirmation.close()}
      />

      {data && (
        <PaymentModal
          order={formatOrder(data?.original)}
          open={paymentModal.isOpen}
          setOpen={paymentModal.setisOpen}
          orderQuery={orderQuery}
          onCompleted={() => {
            refetch();
            paymentModal.setisOpen(false);
          }}
        />
      )}
    </>
  );
}

const formSchema = z.object({
  reason: z.string().min(1, { message: "Please enter a reason" }),
});

function CancelModal({ open, setOpen, order, onCompleted }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  const { user } = useAuth();

  const onSubmit = (values) => {
    return pocketbase
      .collection("orders")
      .update(order.id, {
        status: "canceled",
        canceled_at: new Date().toISOString(),
        canceled_by: user?.id,
        cancel_reason: values?.reason,
      })
      .then(() => {
        setOpen(false);
        toast.success(`Order cancled succesfully`);
        onCompleted();
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-1 font-semibold py-2">
              Cancel Order
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-1 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to cancel the order.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div>
                <AppFormTextArea
                  form={form}
                  label={"Enter a reason"}
                  placeholder={"Enter reason"}
                  name={"reason"}
                />
              </div>
            </div>
            <DialogFooter>
              <div className="mt-6 flex items-center gap-2 px-2 pb-1">
                <Button
                  type="submit"
                  onClick={() => form.handleSubmit(onSubmit)}
                  disabled={
                    form.formState.disabled || form.formState.isSubmitting
                  }
                  className="w-full"
                  size="sm"
                >
                  {form.formState.isSubmitting && (
                    <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                  )}
                  Cancel Order.
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

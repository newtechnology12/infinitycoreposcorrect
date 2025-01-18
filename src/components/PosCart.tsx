import { User, Terminal } from "react-feather";
import { BiChevronDown } from "react-icons/bi";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MdOutlineTableRestaurant } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { CustomerModal } from "./CustomerModal";
import { InvoiceModal } from "./InvoiceModal";
import {
  CheckCheckIcon,
  ChevronDown,
  CreditCard,
  PlusCircle,
  SplitIcon,
  Trash,
  XCircle,
  XIcon,
} from "lucide-react";
import EditOrderModal from "./EditOrderModal";

import Loader from "./icons/Loader";
import pocketbase from "@/lib/pocketbase";
import { toast } from "sonner";
import { useMutation } from "react-query";
import { cn } from "@/utils";
import { PaymentModal } from "./modals/PaymentModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import useModalState from "@/hooks/useModalState";

import { SplitBillModal } from "./modals/SplitBillModal";
import { useAuth } from "@/context/auth.context";
import { useNavigate } from "react-router-dom";

import TicketItem from "./TicketItem";
import useConfirmModal from "@/hooks/useConfirmModal";
import ConfirmModal from "./modals/ConfirmModal";
import recordActivtyLog from "@/utils/recordActivtyLog";

function PosCart({
  order,
  refechOrder,
  orderQuery,
  activeCourse,
  setactiveCourse,
  discounts,
  setshowDraer,
}: any) {
  const [showCustomersModal, setshowCustomersModal] = useState(false);

  const [showPrintIvoiceModal, setshowPrintIvoiceModal] = useState(false);

  const [showTableEditModal, setshowTableEditModal] = useState(false);

  const [updatingCustomer, setupdatingCustomer] = useState(false);

  const updateCustomer = (customer) => {
    setupdatingCustomer(true);
    return pocketbase
      .collection("orders")
      .update(order.id, {
        customer: customer?.id || "",
      })
      .then(() => {
        refechOrder();
        // setTimeout(() => {
        setupdatingCustomer(false);
        toast.success("customer updated succesfully");
        // }, 1000);
      })
      .catch((e) => {
        console.log(e);
        setupdatingCustomer(false);
        toast.success(e.message);
      });
  };

  const [canceling, setcanceling] = useState(false);

  const { user } = useAuth();
  const cancleOrder = () => {
    setcanceling(true);
    return pocketbase
      .collection("orders")
      .update(order.id, {
        status: "canceled",
        canceled_at: new Date(),
        canceled_by: user?.id,
      })
      .then(async () => {
        refechOrder();
        setTimeout(() => {
          setcanceling(false);
          navigate("/pos/orders");
          toast.success("order canceled succesfully");
        }, 500);

        recordActivtyLog({
          title: "Order Canceled by User",
          event_type: "ORDER_CANCELED",
          details: `Order ${order?.code} canceled by ${user.names}`,
          log_level: "WARNING",
          user: user?.id,
        });
      })
      .catch((e) => {
        console.log(e);
        setcanceling(false);
        toast.success(e.message);
      });
  };

  const [showPaymentModal, setshowPaymentModal] = useState(false);

  function generateUniqueId() {
    return Math.floor(Math.random() * 1000000);
  }

  const createCourse = async () => {
    try {
      await pocketbase.collection("order_tickets").create({
        order: order.id,
        status: "draft",
        code: generateUniqueId(),
      });
    } catch (error) {
      console.log(error);
    }
  };

  const createCourseMutation = useMutation({
    mutationFn: createCourse,
    onError: (__, _) => {
      toast.error("Failed to add item to order");
    },
    onSuccess: () => {
      orderQuery.refetch();
    },
  });

  const splitBillModal = useModalState();

  const completeOrder = async () => {
    try {
      await pocketbase.collection("orders").update(order.id, {
        status: "completed",
        completed_at: new Date(),
      });

      recordActivtyLog({
        title: "Order completed by User",
        event_type: "ORDER_COMPLETED",
        details: `Order ${order?.code} completed by ${user.names}`,
        log_level: "INFO",
        user: user?.id,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const navigate = useNavigate();

  const completeOrderMutation = useMutation({
    mutationFn: () => {
      return completeOrder();
    },
    onSuccess: () => {
      orderQuery.refetch();
      navigate("/pos/orders");
      toast.success("Completed order succesfully");
    },
    onError: () => {
      toast.error("failed to Complete order");
    },
  });

  // get flat items for bills reduced length
  const bills_items = useMemo(
    () =>
      (order?.expand?.bills || [])?.reduce((acc, bill) => {
        return [...acc, ...(bill?.items ?? [])];
      }, []),
    [order]
  );

  const confirmCompleteOrder = useConfirmModal();

  return (
    <>
      <PaymentModal
        order={order}
        open={showPaymentModal}
        setOpen={setshowPaymentModal}
        orderQuery={orderQuery}
        onCompleted={() => {
          orderQuery.refetch();
          setshowPaymentModal(false);
          setshowPrintIvoiceModal(true);
        }}
        discounts={discounts}
      />

      <SplitBillModal
        order={order}
        open={splitBillModal.isOpen}
        setOpen={splitBillModal.setisOpen}
        orderQuery={orderQuery}
        onCompleted={() => {
          orderQuery.refetch();
          splitBillModal.close();
        }}
      />

      <CustomerModal
        open={showCustomersModal}
        setOpen={setshowCustomersModal}
        onSelect={(e) => {
          setshowCustomersModal(false);
          updateCustomer(e);
        }}
      />
      <InvoiceModal
        isReciept={order?.status === "completed"}
        order={orderQuery.data}
        open={showPrintIvoiceModal}
        setOpen={setshowPrintIvoiceModal}
        handlePay={() => {
          setshowPaymentModal(true);
          setshowPrintIvoiceModal(false);
        }}
      />
      <EditOrderModal
        open={showTableEditModal}
        setOpen={setshowTableEditModal}
        order={order}
        onCompleted={() => {
          setshowTableEditModal(false);
          refechOrder();
        }}
      />

      <ConfirmModal
        title={"Are you sure you want to complete order with unpaid balance?"}
        description={`This will mark the order as completed and will not be able to make any changes.`}
        meta={confirmCompleteOrder.meta}
        onConfirm={(e) => completeOrderMutation.mutate(e)}
        isLoading={completeOrderMutation.isLoading}
        open={confirmCompleteOrder.isOpen}
        onClose={() => confirmCompleteOrder.close()}
      />
      <div className="h-full flex flex-col bg-white">
        <div>
          <div className="border-b flex  px-2 py-2 items-center justify-between">
            <div className="space-y-[2px]">
              <h4 className="text-[13px] font-semibold">Current Order</h4>
            </div>
            <div className="sm:mr-0 mr-10">
              {!order?.expand?.items?.length ? (
                <Button
                  onClick={cancleOrder}
                  disabled={canceling || !order || order?.status === "canceled"}
                  variant="secondary"
                  className="text-red-500 border-red-200 border bg-red-50 hover:bg-red-100"
                  size="sm"
                >
                  {canceling ? (
                    <Loader className="mr-2 h-4 w-4 text-red-500 animate-spin" />
                  ) : (
                    <XCircle size={16} className="mr-2" />
                  )}
                  Cancel Order
                </Button>
              ) : (
                <Button
                  disabled={
                    !order?.items ||
                    !order?.items?.length ||
                    order?.status === "completed" ||
                    completeOrderMutation.isLoading
                  }
                  onClick={() => {
                    if (order?.balance) {
                      confirmCompleteOrder.open({});
                    } else {
                      completeOrderMutation.mutate();
                    }
                  }}
                  size="sm"
                  className="bg-red-500 hover:bg-red-600"
                >
                  {completeOrderMutation.isLoading && (
                    <Loader className="mr-2 h-[14px] w-[14px] text-white animate-spin" />
                  )}
                  <CheckCheckIcon size={16} className="mr-2 text-white" />
                  Complete Order
                </Button>
              )}
            </div>
          </div>
          <div className="py-2 flex justify-between items-center px-2 border-b">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setshowCustomersModal(true)}
                variant="secondary"
                size="sm"
                className="border  !text-slate-600"
                disabled={
                  updatingCustomer ||
                  order?.status === "completed" ||
                  order?.status === "canceled"
                }
              >
                {updatingCustomer ? (
                  <Loader className="mr-2 h-4 w-4 text-slate-900 animate-spin" />
                ) : (
                  <User size={15} className="mr-2 text-slate-900" />
                )}
                {order?.expand?.customer
                  ? order?.expand?.customer?.names
                  : "Select Customer"}

                <BiChevronDown size={15} className="ml-2 text-slate-900" />
              </Button>
              {order?.customer && (
                <a
                  onClick={() => {
                    updateCustomer(null);
                  }}
                  className="cursor-pointer"
                >
                  <Trash size={16} className="text-red-500" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setshowTableEditModal(true)}
                className="flex items-center gap-2 border  !text-slate-600"
                variant="secondary"
                size="sm"
                disabled={
                  order?.status === "completed" || order?.status === "canceled"
                }
              >
                <MdOutlineTableRestaurant size={17} />
                <span>{order?.expand?.table?.name || "Select table"}</span>
                <ChevronDown size={16} />
              </Button>
            </div>
          </div>
        </div>
        <ScrollArea className="w-full flex-1 scroller sm:h-full whitespace-nowrap">
          {orderQuery.status === "loading" && (
            <div className="flex px-4 text-center w-full sm:h-full h-[50dvh] items-center py-14 justify-center gap-2 flex-col">
              <Loader className="mr-2 h-4 w-4 text-primary animate-spin" />
            </div>
          )}

          {orderQuery.status === "error" && (
            <div className="flex px-4 w-full sm:h-full h-[50dvh] items-center- py-14=">
              <Alert variant="destructive" className="rounded-sm h-fit my-5">
                <Terminal className="h-4 w-4" />
                <AlertTitle>
                  <span className="text-sm">Error: Something went wrong</span>
                </AlertTitle>
                <AlertDescription>
                  {orderQuery.error["message"]}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {orderQuery.status === "success" && (
            <>
              <div className="px-[6px] pb-[6px]">
                {(orderQuery?.data?.expand?.tickets || []).map((e, i) => {
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
                        // order: { code: order?.code, id: order?.id },
                      }}
                      setactiveCourse={setactiveCourse}
                      key={i}
                      activeCourse={activeCourse}
                      orderQuery={orderQuery}
                      index={i}
                      order={order}
                    />
                  );
                })}
                {!order?.paidAmount && (
                  <a
                    onClick={() => createCourseMutation.mutate()}
                    className={cn(
                      "flex items-center cursor-pointer my-2 rounded-[3px] w-full py-2 text-[13px] text-center font-medium border-green-500 bg-opacity-35 text-primary justify-center border border-dashed bg-green-50 hover:bg-green-100",
                      {
                        "opacity-60 pointer-events-none":
                          createCourseMutation.isLoading ||
                          order.status === "completed" ||
                          order.status === "canceled",
                      }
                    )}
                  >
                    {createCourseMutation.isLoading ? (
                      <Loader className="mr-2 h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <PlusCircle size={15} className="mr-2 text-primary" />
                    )}
                    Add new ticket.
                  </a>
                )}
              </div>
            </>
          )}
        </ScrollArea>
        <div className="w-full pt-0 sm:pt-2 border-t px-3">
          <div className="border-b space-y-2 py-2 border-dashed">
            <div className="hidden- sm:flex pb-2- items-center justify-between">
              <span className="text-[13px] text-slate-500 font-medium">
                Items
              </span>
              <span className="text-[13px] text-slate-500 font-medium">
                ({order?.itemsCount || 0} Item{order?.itemsCount > 1 && "s"})
              </span>
            </div>
          </div>

          <div className="flex pb-1 pt-2 items-center justify-between">
            <span className="font-semibold text-[14px]">Grand Total</span>
            <span className="text-[15px] text-primary font-semibold">
              {Number(order?.total).toLocaleString()} FRW
            </span>
          </div>
          <div className="flex py-3 sm:pt-1 items-center justify-between">
            <h4 className="font-medium text-slate-600 text-[13px]">
              Paid Amount
            </h4>
            <span className="font-medium text-slate-600 text-[13px]">
              {Number(order?.paidAmount).toLocaleString()} FRW
            </span>
          </div>
          {order?.discount_used ? (
            <div className="flex py-3 sm:pt-1 items-center justify-between">
              <h4 className="font-medium text-slate-600 text-[13px]">
                Discount
              </h4>
              <span className="font-medium text-slate-600 text-[13px]">
                -{Number(order?.discount_used).toLocaleString()} FRW
              </span>
            </div>
          ) : null}
          <div className="flex pb-3 pt-0 sm:pt-1 items-center justify-between">
            <h4 className="font-medium text-slate-600 text-[13px]">
              Balance/Remaining
            </h4>
            <span className="font-medium text-slate-600 text-[13px]">
              {(order?.balance || 0).toLocaleString()} FRW
            </span>
          </div>
          <div className="pb-2 flex items-center gap-2">
            <Button
              onClick={() => setshowPaymentModal(true)}
              className="w-full"
              size="sm"
              disabled={
                order?.status === "completed" ||
                order?.status === "draft" ||
                order?.status === "canceled" ||
                !bills_items?.length
              }
            >
              Process Payment
              <CreditCard size={17} className="ml-3" />
            </Button>
            <Button
              onClick={() => splitBillModal.open()}
              className="w-full bg-blue-500 hover:bg-blue-600"
              size="sm"
              disabled={
                order?.status === "completed" ||
                order?.items?.length < 2 ||
                Boolean(order?.paidAmount)
              }
            >
              Split Bill
              <SplitIcon size={17} className="ml-3" />
            </Button>
          </div>
          <div className="pb-2 sm:hidden">
            <Button
              onClick={() => setshowDraer(false)}
              className="w-full bg-red-500 hover:bg-red-600"
              size="sm"
            >
              Close
              <XIcon size={17} className="ml-3" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default PosCart;

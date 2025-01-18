import { useAuth } from "@/context/auth.context";
import { useworkShift } from "@/context/workShift.context";
import pocketbase from "@/lib/pocketbase";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "./ui/button";
import Loader from "./icons/Loader";
import { PlusCircle } from "lucide-react";
import recordActivtyLog from "@/utils/recordActivtyLog";

export default function NewOrderButton() {
  const [isCreatingOrder, setisCreatingOrder] = useState(false);

  function generateUniqueId() {
    return Math.floor(Math.random() * 1000000);
  }

  const { user } = useAuth();

  const navigate = useNavigate();

  function formatDate(date) {
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC", // Adjust time zone as needed
    }).format(date);

    // @ts-ignore
    return formattedDate.replace(",", "").replaceAll("/", "-"); // Remove comma
  }

  const handlePlaceOrder = async () => {
    try {
      const work_shifts_res = await pocketbase
        .collection("work_shifts")
        .getFullList({
          filter: `employee="${user.id}" && started_at>="${formatDate(
            new Date()
          )}" && ended_at=""`,
          expand: "work_period",
        });

      const current_work_shift = work_shifts_res[0];

      if (!current_work_shift) throw new Error("No active work shift found");

      setisCreatingOrder(true);
      const order = await pocketbase.collection("orders").create({
        subTotal: 0,
        itemCount: 0,
        total: 0,
        waiter: user.id,
        kitchen_notes: "",
        customer_notes: "",
        status: "on going",
        kitchenStatus: "queue",
        code: generateUniqueId(),
        work_period: current_work_shift.work_period,
        work_shift: current_work_shift.id,
      });

      navigate(`/pos/orders/${order.id}`);
      setisCreatingOrder(false);
      toast.success("Order created succesfully");

      recordActivtyLog({
        title: "New Order Created",
        event_type: "ORDER_PLACED",
        log_level: "INFO",
        details: `New order created by ${user.email}`,
        user: user.id,
      });
    } catch (error) {
      console.log(error);
      setisCreatingOrder(false);
      toast.error(error.message);
    }
  };

  const { current, setShowClockinModal, work_period } = useworkShift();

  return (
    <Button
      onClick={() => {
        if (current) {
          handlePlaceOrder();
        } else {
          setShowClockinModal(true);
        }
      }}
      size="sm"
      disabled={isCreatingOrder}
    >
      {isCreatingOrder ? (
        <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
      ) : (
        <PlusCircle size={16} className="mr-2" />
      )}

      <span>Create Order</span>
    </Button>
  );
}

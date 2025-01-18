import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import Loader from "./icons/Loader";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { cn } from "@/utils";
import { Alert, AlertTitle } from "./ui/alert";
import { AlertCircleIcon } from "lucide-react";
import pocketbase from "@/lib/pocketbase";
import { useAuth } from "@/context/auth.context";

export default function CancelItemModal({
  open,
  setOpen,
  record,
  onCompleted,
}: any) {
  const [quantity, setQuantity] = useState<any>();
  const [reason, setReason] = useState<string>();

  useEffect(() => {
    if (record?.quantity) {
      setQuantity(record?.quantity);
    }
  }, [record?.quantity]);

  const [isLoading, setIsLoading] = useState(undefined);

  const [error, setError] = useState("");

  const { user } = useAuth();

  const handleCancel = async () => {
    try {
      setIsLoading(true);
      setError("");
      if (!Number(quantity || 0)) return setError("Quantity is required.");
      if (!reason) return setError("Reason is required.");
      if (Number(quantity || 0) > record.quantity)
        return setError(
          "Quantity to cancel can not be greater than actual quantity."
        );

      if (record?.quantity === quantity) {
        await pocketbase.collection("order_items").update(record.id, {
          status: "cancelled",
          cancelled_by: user.id,
          cancel_reason: reason,
        });
      } else {
        await pocketbase.collection("order_items").update(record.id, {
          quantity: record?.quantity - Number(quantity || 0),
          amount: !Number(quantity)
            ? 0
            : (record?.amount / record?.quantity) * Number(quantity || 0),
        });

        const item = await pocketbase.collection("order_items").create({
          order: record?.order,
          menu: record.menu,
          quantity: quantity,
          amount: (record?.amount / record?.quantity) * quantity,
          status: "cancelled",
          cancelled_by: user.id,
          cancel_reason: reason,
          order_ticket: record?.order_ticket,
        });

        await pocketbase.collection("orders").update(record?.order, {
          "items+": item?.id,
        });
      }

      onCompleted();
      setIsLoading(false);
    } catch (error) {
      setError(error?.message);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[445px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-sm block- !pt-[2px] px-2 font-semibold py-2">
              Cancel Item.
            </span>
          </DialogTitle>
          <DialogDescription>
            <p className="px-2 py-0 leading-7">
              This action cannot be undone this will permanently.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div>
          {error && (
            <div className="px-2 mb-1 py-2">
              <Alert
                variant="destructive"
                className="py-2 -mt-2- rounded-[4px] flex items-center"
              >
                <AlertCircleIcon className="!h-8 -mt-[14px] mr-3 w-4" />
                <AlertTitle className="text-[13px] font-medium fon !m-0">
                  {error}
                </AlertTitle>
              </Alert>
            </div>
          )}
          <div className="px-2 mb-5">
            <h4 className="font-medium text-[13px] text-slate-600 mb-[8px]">
              Quantity to cancel.
            </h4>
            <Input
              onChange={(e) => {
                setQuantity(e?.target?.value);
              }}
              placeholder="Enter quantity"
              value={quantity}
              type="number"
            />
          </div>

          <div className="px-2 mb-5">
            <h4 className="font-medium text-[13px] text-slate-600 mb-[8px]">
              Choose reason.
            </h4>
            <Select value={reason} onValueChange={(e) => setReason(e)}>
              <SelectTrigger className={cn("w-full")}>
                <SelectValue placeholder={"Choose reason"} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectGroup>
                  {[
                    { label: "Return", value: "return" },
                    { label: "No stock", value: "no-stock" },
                    { label: "Damage", value: "damage" },
                  ].map((e, i) => {
                    return (
                      <SelectItem key={i} value={e.value}>
                        {e.label}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 px-2 pb-1">
            <Button
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              {isLoading && (
                <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
              )}
              Cancel items
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

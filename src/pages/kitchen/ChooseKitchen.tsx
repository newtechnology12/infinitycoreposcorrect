import pocketbase from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useQuery } from "react-query";
import { useMemo, useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { CheckIcon } from "lucide-react";
import { cn } from "@/utils";
import { useAuth } from "@/context/auth.context";

const getStations = () => {
  return pocketbase.collection("order_stations").getFullList();
};

interface ItemProps {
  kitchen: any; // Replace with your kitchen type
  selectedKitchenId: string;
  onSelect: (id: string) => void;
}

const Item: React.FC<ItemProps> = ({
  kitchen,
  selectedKitchenId,
  onSelect,
}) => {
  return (
    <div className="dark">
      <div
        onClick={() => onSelect(kitchen.id)}
        className={cn({
          "rounded-[4px] cursor-pointer border border-slate-600 flex justify-between items-center w-full px-4 py-3":
            true,
          "border-primary bg-slate-700 bg-opacity-50":
            selectedKitchenId === kitchen.id,
          "bg-slate-700 bg-opacity-50": selectedKitchenId !== kitchen.id,
        })}
      >
        <div className=" space-y-2">
          <h4 className="font-semibold capitalize text-slate-100 text-sm">
            {kitchen.name}
          </h4>
          <p className="font-medium- text-sm text-slate-400">
            {kitchen.description || "No description"}
          </p>
        </div>
        {selectedKitchenId === kitchen.id && (
          <div>
            <div className="h-5 w-5 flex items-center justify-center text-white bg-primary rounded-full">
              <CheckIcon size={16} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function ChooseKitchen() {
  const [selectedKitchenId, setSelectedKitchenId] = useState("");

  const { isLoading, data, status, error } = useQuery(
    "order_stations",
    getStations
  );

  const navigate = useNavigate();

  if (error) {
    return <div>Error loading stations</div>;
  }

  const { user } = useAuth();

  const kitchenToShow = useMemo(
    () => data?.filter((k) => k?.users?.includes(user?.id)),
    [user, data]
  );

  return (
    <div className="dark">
      <div className="bg-slate-900 px-3">
        <div className="max-w-md mx-auto h-screen flex flex-col justify-center items-center">
          <h1 className="text-lg text-white font-semibold">
            Choose Order station.
          </h1>
          <p className="text-sm text-slate-300 capitalize mt-1.5">
            Select the kitchen you want to display.
          </p>
          <div className="w-[100px] mt-4 mb-4 flex gap-1 h-[3px]">
            <div className="w-[70%] rounded-md bg-primary" />
            <div className="w-[30%] rounded-md bg-primary" />
          </div>
          <div className="grid grid-cols-1 gap-3 w-full mt-5">
            {isLoading && (
              <div className="space-y-3">
                {/* add skeletons loader */}
                {[1, 2].map((_, indx) => (
                  <div
                    key={indx}
                    className="rounded-[4px] cursor-pointer border flex justify-between items-center w-full px-4 py-4 dark:border-slate-700 dark:!bg-slate-800 dark:!bg-opacity-25 bg-white"
                  >
                    <div className="space-y-3 w-full">
                      <Skeleton className="h-4  w-[200px]" />
                      <Skeleton className="h-3 w-[300px]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {status === "success" &&
              kitchenToShow?.map((kitchen) => (
                <Item
                  key={kitchen.id}
                  kitchen={kitchen}
                  selectedKitchenId={selectedKitchenId}
                  onSelect={setSelectedKitchenId}
                />
              ))}
          </div>
          <Button
            disabled={!selectedKitchenId}
            className="mt-5"
            onClick={() => {
              navigate(`/kitchen-display/${selectedKitchenId}`);
            }}
          >
            Continue to Kitchen Display
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

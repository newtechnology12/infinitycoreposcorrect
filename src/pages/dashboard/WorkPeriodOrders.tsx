import Orders from "@/components/Orders";
import { useOutletContext } from "react-router-dom";

export default function WorkPeriodOrders() {
  const [_, workPeriodId] = useOutletContext() as [any, any];

  return workPeriodId ? (
    <Orders
      className="border-none"
      initial_filter={`work_period="${workPeriodId}"`}
    />
  ) : null;
}

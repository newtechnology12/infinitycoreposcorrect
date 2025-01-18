import BillToPrint from "@/components/BillToPrint";
import pocketbase from "@/lib/pocketbase";
import formatBill from "@/utils/formatBill";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";

export default function BillPage() {
  const billCode = useParams().billId;

  const getBill = async () => {
    const bill = await pocketbase.collection("order_bills").getFullList({
      filter: `code="${billCode}"`,
      expand: "items,items.menu,order,order.waiter,discount",
    });
    return bill[0];
  };

  const billQuery = useQuery(["bills", billCode], getBill, {
    enabled: Boolean(billCode),
  });

  const bill = formatBill(billQuery.data);

  return (
    <div>
      {billQuery.status === "error" && <div>Error: Something went wrong.</div>}

      {billQuery.status === "success" && (
        <div className="relative">
          <div className="absolute bg-red-200- flex items-center justify-center w-full h-full font-semibold">
            {billQuery.data ? (
              <h4 className="text-[90px] text-green-500 -mt-44 opacity-70 font-cour -rotate-45">
                APPROVED
              </h4>
            ) : (
              <h4 className="text-[90px] text-red-500 -mt-44 opacity-70 font-cour -rotate-45">
                DECLINED
              </h4>
            )}
          </div>
          <BillToPrint
            created={bill?.created}
            className="!block"
            number={billQuery?.data?.code}
            items={(bill?.items || [])?.map((e) => {
              return {
                name: e?.expand?.menu?.name,
                subTotal: e?.amount,
                quantity: e?.quantity,
                variant: e?.variant,
                status: e.status,
              };
            })}
            extraInfo={[
              bill?.printed
                ? {
                    title: "NOTE",
                    value: "Bill is re-printed",
                  }
                : undefined,
              {
                title: "Waiter",
                value: bill?.expand?.order?.expand?.waiter?.name,
              },
            ].filter((e) => e)}
            total={bill.total}
          />
        </div>
      )}

      {billQuery.status === "loading" && <div>Loading...</div>}
    </div>
  );
}

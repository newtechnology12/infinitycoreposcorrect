import { useQuery } from "react-query";
import BreadCrumb from "./breadcrumb";
import pocketbase from "@/lib/pocketbase";
import { cn } from "@/utils";

export default function CancellationsReport({ ...other }) {
  const recordsQuery = useQuery({
    queryKey: ["cancellations-report"],
    keepPreviousData: true,
    onError: (e) => {
      console.log(e);
    },
    queryFn: async () => {
      const cachier_reports = await pocketbase
        .collection("work_shift_reports")
        .getFullList({
          expand: `cachier,waiter,work_period`,
        });

      const with_cancelled_sales = cachier_reports.filter(
        (report) => report.cancelations.reduce((a, b) => a + b?.amount, 0) > 0
      );

      const all_cancelled_sales = with_cancelled_sales.map((report) => {
        return report.cancelations.map((cancelation) => {
          return {
            ...cancelation,
            cachier: report?.expand?.cachier?.name,
            waiter: report?.expand?.waiter?.name,
            date: report?.expand?.work_period?.created,
          };
        });
      });

      console.log(all_cancelled_sales.flat());

      const its = all_cancelled_sales.flat();

      const result = await pocketbase.collection("order_items").getFullList({
        filter: its
          .map((e) => `id="${e.item.id}" && status!="cancelled"`)
          .join("||"),
      });

      // get its in result
      const ee = its.filter((e) => {
        return result.find((r) => r.id === e.item.id);
      });

      return {
        items: ee,
      };
    },
    enabled: true,
  });

  return (
    <div>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Cancellation Sales.
            </h2>
            <BreadCrumb
              items={[{ title: "All Cancellations", link: "/dashboard" }]}
            />
          </div>
        </div>

        <div className="mt-3">
          <div>
            <h4 className="text-[15px] font-semibold">
              Cancellation items report.
            </h4>
          </div>
          <div className="bg-white w-full overflow-x-scroll mt-3">
            <table className="w-full border">
              <tr className="text-left text-[11px] bg-slate-50 font-medium uppercase">
                <th className="py-3 border-r border-b px-3">Menu Item</th>
                <th className="py-3 border-b border-r px-3"> Amount</th>
                <th className="py-3 border-b border-r px-3"> Waiter</th>
                <th className="py-3 border-b border-r px-3"> Cashier</th>
                <th className="py-3 border-b border-r px-3"> Date</th>
                <th className="py-3 border-b border-r px-3"> Comment</th>
                <th className="py-3 border-b border-r px-3"> Action</th>
              </tr>

              {recordsQuery?.data?.items?.map((e: any) => (
                <tr>
                  <td className="py-[12px] px-3 border-r border-b">
                    <span className="text-[13px] truncate font-medium">
                      {e?.item?.expand?.menu?.name}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "py-[6px] border-r text-[13px] truncate text-slate-700 px-3 border-b font-medium"
                    )}
                  >
                    {e?.amount?.toLocaleString()} FRW
                  </td>
                  <td
                    className={cn(
                      "py-[6px] border-r capitalize truncate text-[13px] text-slate-700 px-3 border-b font-medium"
                    )}
                  >
                    {e?.waiter}
                  </td>
                  <td
                    className={cn(
                      "py-[6px] border-r truncate capitalize text-[13px] text-slate-700 px-3 border-b font-medium"
                    )}
                  >
                    {e?.cachier}
                  </td>
                  <td
                    className={cn(
                      "py-[6px] border-r truncate capitalize text-[13px] text-slate-700 px-3 border-b font-medium"
                    )}
                  >
                    {new Date(e?.date).toLocaleString()}
                  </td>
                  <td
                    className={cn(
                      "py-[6px] border-r text-wrap text-[13px] text-slate-700 px-3 border-b font-medium"
                    )}
                  >
                    {e?.comment || "No comment"}
                  </td>
                  <td className="py-[6px] border-r text-[13px] text-slate-700 px-3 border-b font-medium">
                    <a
                      className="cursor-pointer truncate text-[13px] underline text-red-500"
                      href={`/dashboard/sales/orders/${e?.item?.order}`}
                    >
                      View Item Order.
                    </a>
                  </td>
                </tr>
              ))}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

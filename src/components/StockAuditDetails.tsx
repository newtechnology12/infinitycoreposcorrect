import pocketbase from "@/lib/pocketbase";
import { useState } from "react";
import { Search } from "react-feather";
import { useQuery } from "react-query";
import { useParams } from "react-router-dom";

export default function StockAuditDetails() {
  const getOrder = async () => {
    const audit = await pocketbase.collection("stock_audits").getOne(auditId, {
      expand: "created_by,stock",
    });

    const stock_audits = await pocketbase
      .collection("stock_audit_items")
      .getFullList({
        filter: `stock_audit="${auditId}"`,
        expand: "item.item.menu,item.item.menu.subCategory",
      });

    return {
      audit,
      stock_audits,
    };
  };

  const auditId = useParams().auditId;

  const { data } = useQuery(["stock_audits", auditId], getOrder, {
    enabled: Boolean(auditId),
  });

  const [search, setsearch] = useState("");

  const auditsToShow = data?.stock_audits?.filter((item) => {
    const searchKey = search.toLowerCase();
    return item?.expand?.item?.expand?.item?.expand?.menu?.name
      .toLowerCase()
      .includes(searchKey);
  });

  const totals = {
    initial_stock: auditsToShow?.reduce(
      (acc, item) => acc + item.initial_stock,
      0
    ),
    entrance_stock: auditsToShow?.reduce(
      (acc, item) => acc + item.entrance_stock,
      0
    ),
    closing_stock: auditsToShow?.reduce(
      (acc, item) => acc + item.closing_stock,
      0
    ),
    stock_out: auditsToShow?.reduce((acc, item) => acc + item.stock_out, 0),
    price: auditsToShow?.reduce((acc, item) => acc + item.entrance_stock, 0),
    balance: auditsToShow?.reduce((acc, item) => acc + item.balance, 0),
  };

  return (
    <div className="px-4">
      <div className="w-full bg-white border rounded-[4px]">
        <div className="py-2 border-b px-3 border-dashed">
          <h3 className="text-[15px] font-semibold">Stock Audit Form</h3>

          <div className="text-sm space-y-2 mt-2">
            <div className="flex gap-2">
              Stock: <span>{data?.audit?.expand?.stock?.name}</span>
            </div>
            <div className="flex gap-2">
              Created By: <span>{data?.audit?.expand?.created_by?.name}</span>
            </div>
          </div>
          <div>
            <div className="px-2- mt-2 pt-1">
              <div className="rounded-[4px] relative overflow-hidden text-sm w-[300px] border">
                <Search
                  size={16}
                  className="absolute text-slate-500 top-[10px] left-[8px]"
                />
                <input
                  placeholder="Search here.."
                  className="w-full py-[10px] pl-8 h-full"
                  type="text"
                  value={search}
                  onChange={(e) => setsearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-3">
          <div>
            <table className="w-full border rounded-[4px]">
              <thead>
                <tr className="!font-medium">
                  <th className="!font-medium border text-left p-2 text-sm">
                    Item
                  </th>
                  <th className="!font-medium border text-left p-2 text-sm">
                    Category
                  </th>
                  <th className="!font-medium border text-left p-2 text-sm">
                    Initial Stock
                  </th>
                  <th className="!font-medium border text-left p-2 text-sm">
                    Entrance Stock
                  </th>
                  <th className="!font-medium border text-left p-2 text-sm">
                    Closing Stock
                  </th>
                  <th className="!font-medium border text-left p-2 text-sm">
                    Stock out
                  </th>
                  <th className="!font-medium border text-left p-2 text-sm">
                    Price
                  </th>

                  <th className="!font-medium border text-left p-2 text-sm">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditsToShow?.map((item, index) => (
                  <tr key={index}>
                    <td className="border py-2 truncate font-medium capitalize text-sm px-3">
                      {item?.expand?.item?.expand?.item?.expand?.menu?.name}
                      {item.variant ? `- (${item.variant.name})` : ""}
                    </td>
                    <td className="border py-2  truncate capitalize text-[13px]  px-3">
                      {item?.expand?.item?.expand?.item?.expand?.menu?.expand
                        ?.subCategory?.name || "N.A"}
                    </td>
                    <td className="border py-2  text-sm  px-3">
                      {item.initial_stock}
                    </td>
                    <td className="border py-2  text-sm  px-3">
                      {item.entrance_stock}
                    </td>
                    <td className="border py-2  text-sm  px-3">
                      {item.closing_stock}
                    </td>
                    <td className="border py-2  text-sm w-[150px] px-3">
                      {item?.stock_out || 0}
                    </td>
                    <td className="border py-2  text-sm w-[150px] px-3">
                      {item.price.toLocaleString()} FRW
                    </td>

                    <td className="border py-2  text-sm w-[150px] px-3">
                      {item.balance.toLocaleString()} FRW
                    </td>
                  </tr>
                ))}
                <tr className="bg-green-500 text-white border-green-500">
                  <td className="border py-2 text-sm w-[150px] px-3">Total</td>
                  <td className="border py-2  text-sm w-[150px] px-3">---</td>
                  <td className="border py-2  text-sm w-[150px] px-3">
                    {totals.initial_stock}
                  </td>
                  <td className="border py-2 text-sm w-[150px] px-3">
                    {totals.entrance_stock}
                  </td>
                  <td className="border py-2  text-sm w-[150px] px-3">
                    {totals.closing_stock}
                  </td>
                  <td className="border py-2  text-sm w-[150px] px-3">
                    {totals.stock_out}
                  </td>
                  <td className="border py-2  text-sm w-[150px] px-3"></td>
                  <td className="border py-2  text-sm w-[150px] px-3">
                    {Number(totals.balance)?.toLocaleString()} FRW
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

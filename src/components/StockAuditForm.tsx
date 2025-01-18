import { CheckCircle, PlusCircle, Search } from "react-feather";
import { Button } from "./ui/button";
import { useEffect, useMemo, useState } from "react";
import useModalState from "@/hooks/useModalState";
import { StockItemsModal } from "./modals/StockItemsModal";
import pocketbase from "@/lib/pocketbase";
import { useAuth } from "@/context/auth.context";
import Loader from "./icons/Loader";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useQuery } from "react-query";

export default function StockAuditForm() {
  const [items, setItems] = useState<any>([]);

  const stockItemsModal = useModalState();

  const computedItems = useMemo(() => {
    return items.map((item) => {
      const stock_out =
        item.entrance_stock + item.initial_stock - item.closing_stock;
      return {
        ...item,
        stock_out: stock_out,
        balance: item.price * stock_out,
        closing_balance: item.price * item.closing_stock,
      };
    });
  }, [items]);

  const totals = {
    initial_stock: computedItems.reduce(
      (acc, item) => acc + item.initial_stock,
      0
    ),
    entrance_stock: computedItems.reduce(
      (acc, item) => acc + item.entrance_stock,
      0
    ),
    closing_stock: computedItems.reduce(
      (acc, item) => acc + item.closing_stock,
      0
    ),
    stock_out: computedItems.reduce((acc, item) => acc + item.stock_out, 0),
    price: computedItems.reduce((acc, item) => acc + item.entrance_stock, 0),
    balance: computedItems.reduce((acc, item) => acc + item.balance, 0),
  };

  const { user } = useAuth();

  const [submiting, setSubmiting] = useState(false);

  const navigate = useNavigate();

  const [stock, setStock] = useState<any>();

  const submit = async () => {
    try {
      setSubmiting(true);
      const stock_audit = await pocketbase.collection("stock_audits").create({
        balance: totals.balance,
        created_by: user?.id,
        stock: "ledioxuy4ecp3l1",
      });

      return await Promise.all(
        computedItems.map((item) => {
          return pocketbase.collection("stock_audit_items").create({
            stock_audit: stock_audit.id,
            item: item.item.id,
            initial_stock: item.initial_stock,
            entrance_stock: item.entrance_stock,
            closing_stock: item.closing_stock,
            stock_out: item.stock_out,
            price: item.price,
            variant: item.variant,
            balance: item.balance,
          });
        })
      ).then(() => {
        toast.success("Stock audit report submitted successfully");
        navigate(`/`);
        setSubmiting(false);
      });
    } catch (error) {
      toast.error("Failed to submit stock audit report");
      setSubmiting(false);
    }
  };

  const { data: stocks } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => {
      return pocketbase.collection("stocks").getFullList();
    },
  });

  const [search, setsearch] = useState("");

  const handleItems = (items) => {
    let itms = [];

    items.forEach((item) => {
      if (item?.expand?.item?.expand?.menu?.variants?.length) {
        item?.expand?.item?.expand?.menu?.variants.forEach((variant) => {
          itms.push({
            initial_stock: 0,
            entrance_stock: 0,
            closing_stock: 0,
            stock_out: 0,
            price: Number(variant.price),
            variant_name: variant.name,
            item: item,
            variant: variant,
          });
        });
      } else {
        console.log("------");
        itms.push({
          initial_stock: 0,
          entrance_stock: 0,
          closing_stock: 0,
          stock_out: 0,
          price: Number(item?.expand?.item?.expand?.menu?.price),
          item: item,
        });
      }
    });

    setItems((prev) => {
      return [...prev, ...itms];
    });

    stockItemsModal.setisOpen(false);
  };

  const loadItems = async (stock) => {
    const items = await pocketbase.collection("stock_items").getFullList({
      filter: [`stock="${stock}" && item.menu!=null`]
        .filter((e) => e)
        .join(" && "),
      expand: "item,item.unit,item.menu,item.menu.subCategory",
    });

    handleItems(items);
  };

  const itemsToShow = useMemo(() => {
    return computedItems.filter((item) => {
      const searchKey = search.toLowerCase();
      return item?.item?.expand?.item?.expand?.menu?.name
        .toLowerCase()
        .includes(searchKey);
    });
  }, [computedItems, search]);

  useEffect(() => {
    if (stock) {
      setItems([]);
      loadItems(stock);
    }
  }, [stock]);

  return (
    <>
      <div className="px-4">
        <div className="w-full bg-white border rounded-[4px]">
          <div className="py-2 border-b px-3 border-dashed">
            <div>
              <h3 className="text-[15px] font-semibold">Stock Audit Form</h3>
            </div>
            <div className="flex mt-2 flex-col gap-0">
              <span className="text-sm">Choose Stock</span>
              <select
                // disabled={submiting || stock}
                className="w-[300px] text-sm py-2 px-3 border rounded-[4px] mt-1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              >
                <option disabled selected value="">
                  Choose stock to audit
                </option>
                {stocks?.map((stock) => (
                  <option key={stock.id} value={stock.id}>
                    {stock.name}
                  </option>
                ))}
              </select>
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
                  {itemsToShow.map((item, index) => (
                    <tr key={index}>
                      <td className="border truncate font-medium capitalize text-sm px-3">
                        {item?.item?.expand?.item?.expand?.menu?.name}
                        {item.variant ? `- (${item.variant.name})` : ""}
                      </td>
                      <td className="border truncate capitalize text-[13px]  px-3">
                        {item?.item?.expand?.item?.expand?.menu?.expand
                          ?.subCategory?.name || "N.A"}
                      </td>
                      <td className="border text-sm">
                        <input
                          type="number"
                          className="h-full py-2 w-full px-3"
                          value={item.initial_stock}
                          onChange={(e) => {
                            setItems((prev) => {
                              const newItems = [...prev];
                              newItems[index].initial_stock = e.target.value
                                ? Number(e.target.value)
                                : e.target.value;
                              return newItems;
                            });
                          }}
                        />
                      </td>
                      <td className="border text-sm">
                        <input
                          type="number"
                          className="h-full py-2 w-full px-3"
                          value={item.entrance_stock}
                          onChange={(e) => {
                            setItems((prev) => {
                              const newItems = [...prev];
                              newItems[index].entrance_stock = e.target.value
                                ? Number(e.target.value)
                                : e.target.value;
                              return newItems;
                            });
                          }}
                        />
                      </td>
                      <td className="border text-sm">
                        <input
                          type="number"
                          className="h-full py-2 w-full px-3"
                          value={item.closing_stock}
                          onChange={(e) => {
                            setItems((prev) => {
                              const newItems = [...prev];
                              newItems[index].closing_stock = e.target.value
                                ? Number(e.target.value)
                                : e.target.value;
                              return newItems;
                            });
                          }}
                        />
                      </td>
                      <td className="border text-sm w-[150px] px-3">
                        {item?.stock_out || 0}
                      </td>
                      <td className="border text-sm w-[150px] px-3">
                        {item.price.toLocaleString()} FRW
                      </td>

                      <td className="border text-sm w-[150px] px-3">
                        {item.balance.toLocaleString()} FRW
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-green-500 text-white border-green-500">
                    <td className="border py-2 text-sm w-[150px] px-3">
                      Total
                    </td>
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
                      {totals?.balance?.toLocaleString()} FRW
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-3">
              {/* <Button
                variant="outline"
                onClick={() => stockItemsModal.open()}
                size="sm"
              >
                <PlusCircle size={16} className="mr-2" />
                <span> Add new item</span>
              </Button> */}
              <Button disabled={submiting} onClick={() => submit()} size="sm">
                {submiting ? (
                  <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                ) : (
                  <CheckCircle size={16} className="mr-2" />
                )}
                <span> Save & Confirm Report</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <StockItemsModal
        stock={stock}
        open={stockItemsModal.isOpen}
        setOpen={stockItemsModal.setisOpen}
        onSelect={handleItems}
      />
    </>
  );
}

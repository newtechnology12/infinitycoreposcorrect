import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { cn } from "@/utils";
import useSettings from "@/hooks/useSettings";
import QRCode from "react-qr-code";

export default function BillToPrint({
  items,
  total,
  number,
  Action,
  className,
  onAfterPrint,
  extraInfo,
  discount,
  created,
}: any) {
  const contentToPrint = useRef(null);
  const pageStyle = `{ size: 2.5in 4in }`;
  const props: any = { removeAfterPrint: true, pageStyle };

  const handlePrint: any = useReactToPrint({
    content: () => contentToPrint.current,
    // @ts-ignore
    props,
    bodyClass: "font-prime",
    onAfterPrint,
  });

  const { settings } = useSettings();

  const reducedGroupedItems = items.reduce((acc: any, item: any) => {
    if (acc[item.name]) {
      acc[item.name].quantity += item.quantity;
      acc[item.name].subTotal += item.subTotal;
    } else {
      acc[item.name] = { ...item };
    }
    return acc;
  }, {});

  const newItems: any = Object.values(reducedGroupedItems);

  return (
    <>
      {Action && (
        <Action
          onClick={() => {
            handlePrint(null, () => contentToPrint.current);
          }}
        />
      )}

      <div
        className={cn(
          className,
          "hidden font-prime border border-gray-200 m-2"
        )}
      >
        <div ref={contentToPrint} className="bg-white">
          <div
            id="receipt-content"
            className="text-left w-full text-base p-3 overflow-auto"
          >
            <div className="text-center text-[13px] flex flex-col justify-center items-center gap-1">
              <span className="font-bold text-2xl uppercase">
                {settings?.company_name || "Company Name"}
              </span>
              <p className="font-bold text-3xl !font-prime uppercase underline">
                Payment request
              </p>
              <div className="mt-2 text-base">
                <span className="underline font-bold">Tell</span>
                <span>:{settings.company_phone}</span>
              </div>
              <p className="capitalize text-base font-bold">
                {settings.company_address}
              </p>
            </div>
            <div className="flex mt-4 text-base font-bold">
              <div className="flex-grow">
                No: <span>{number}</span>
              </div>
              <div>
                {new Date(created).toLocaleDateString()}{" "}
                {new Date(created).toLocaleTimeString()}
              </div>
            </div>
            <hr className="my-2  border border-dashed" />
            <div>
              <table className="w-full text-base font-bold">
                <thead>
                  <tr>
                    <th className="py-1 px-2  border text-left">Item</th>
                    <th className="py-1 px-2 border w-1/12 text-center">Qty</th>
                    <th className="py-1 px-2  border w-3/12 text-right">
                      U.Price
                    </th>
                    <th className="py-1 px-2  border w-3/12 text-right">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {newItems.map((e, i) => {
                    return (
                      <tr>
                        <td
                          className={cn("py-2 px-2  border text-left", {
                            "line-through": e.status === "cancelled",
                          })}
                        >
                          <span>{e.name}</span>
                        </td>
                        <td
                          className={cn("py-2 px-2  border text-center", {
                            "line-through": e.status === "cancelled",
                          })}
                        >
                          {e.quantity}
                        </td>
                        <td
                          className={cn("py-2 px-2  border text-right", {
                            "line-through": e.status === "cancelled",
                          })}
                        >
                          {(e.subTotal / e.quantity)?.toLocaleString()}
                        </td>
                        <td
                          className={cn("py-2 px-2  border text-right", {
                            "line-through": e.status === "cancelled",
                          })}
                        >
                          {e.subTotal?.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <hr className="my-2 border border-dashed" />
            <div>
              <div className="flex font-bold">
                <div className="flex-grow text-slate-900 font-bold text-base">
                  TOTAL AMOUNT
                </div>
                <div className="font-bold text-base">
                  RWF. {total?.toLocaleString()}
                </div>
              </div>
            </div>
            <div>
              <div className="flex mt-2 font-bold">
                <div className="flex-grow font-bold text-base">DISCOUNT</div>
                <div className="font-bold text-base">RWF. {discount || 0}</div>
              </div>
            </div>
            <hr className="my-2  border border-dashed" />
            <div className="space-y-2">
              <div className="text-base">
                <span className="underline font-bold">NOTE</span>
                <span className="font-bold">
                  :This is not an official receipt.
                </span>
              </div>

              {extraInfo.map((e: any) => (
                <div className="text-base">
                  <span className="underline font-bold">{e.title}</span>
                  <span className="font-bold">: {e.value}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[14.5px] font-bold px-3 my-3 leading-6 !text-center">
                Thank you for shopping with us. Please come again. Have a nice
                day.
              </p>
            </div>

            <div className="mx-auto flex items-center justify-center mt-5">
              <QRCode
                size={106}
                value={
                  settings?.application_url + "/bills/" + number?.toString()
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

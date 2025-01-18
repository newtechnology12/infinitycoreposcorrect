import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { cn } from "@/utils";
import useSettings from "@/hooks/useSettings";

export default function InvoiceToPrint({
  items,
  total,
  number,
  Action,
  className,
  transactions,
  discount,
  extraInfo,
}: any) {
  const contentToPrint = useRef(null);
  const pageStyle = `{ size: 2.5in 4in }`;
  const props: any = { removeAfterPrint: true, pageStyle };

  const handlePrint: any = useReactToPrint({
    content: () => contentToPrint.current,
    // @ts-ignore
    props,
    bodyClass: "font-cour",
  });

  const { settings } = useSettings();

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
        className={cn(className, "hidden font-cour border border-gray-200 m-2")}
      >
        <div ref={contentToPrint} className="bg-white">
          <div
            id="receipt-content"
            className="text-left w-full text-sm p-3 overflow-auto"
          >
            <div className="text-center text-[13px] flex flex-col justify-center items-center my-4">
              <span className="font-bold text-lg uppercase">
                {settings?.company_name || "Company Name"}
              </span>
              <p className="font-bold text-[14px] !font-cour uppercase underline">
                Payment invoice
              </p>
              <div className="mt-2">
                <span className="underline">Tell</span>
                <span>:{settings.company_phone}</span>
              </div>
              <p>
                <span className="underline">TIN</span>:{" "}
                {settings.company_tin || "N.A"}
              </p>
              <p className="capitalize">{settings.company_address}</p>
            </div>
            <div className="flex mt-4 text-xs">
              <div className="flex-grow">
                No: <span>{number}</span>
              </div>
              <div>
                {new Date().toLocaleDateString()}{" "}
                {new Date().toLocaleTimeString()}
              </div>
            </div>
            <hr className="my-2  border border-dashed" />
            <div>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="py-1 w-1/12 text-center">#</th>
                    <th className="py-1 text-left">Item</th>
                    <th className="py-1 w-2/12 text-center">Qty</th>
                    <th className="py-1 w-3/12 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((e, i) => {
                    return (
                      <tr>
                        <td className="py-2 text-center">{i + 1}</td>
                        <td className="py-2 text-left">
                          <span>{e.name}</span>
                        </td>
                        <td className="py-2 text-center">{e.quantity}</td>
                        <td className="py-2 text-right">RWF.{e.subTotal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <hr className="my-2 border border-dashed" />
            <div>
              <div className="flex font-semibold">
                <div className="flex-grow">TOTAL AMOUNT</div>
                <div>RWF. {total}</div>
              </div>
            </div>

            <hr className="my-2 border border-dashed" />
            <div>
              <div className="flex text-[12px]">
                <div className="flex-grow">AMOUNT PAID</div>
                <div>RWF. {total}</div>
              </div>
              {transactions?.map((e) => {
                return (
                  <div className="flex text-[12px]">
                    <div className="flex-grow">
                      {e.expand?.payment_method?.name}
                    </div>
                    <div>RWF. {e?.amount}</div>
                  </div>
                );
              })}
            </div>
            {discount ? (
              <div>
                <div className="flex font-semibold">
                  <div className="flex-grow">DISCOUNT</div>
                  <div>RWF. -{discount}</div>
                </div>
              </div>
            ) : null}
            <hr className="my-2  border border-dashed" />
            {extraInfo.map((e: any) => (
              <div className="text-xs">
                <span className="underline font-bold">{e.title}</span>
                <span>: {e.value}</span>
              </div>
            ))}
            <div>
              <p className="text-[11.5px] px-3 my-3 leading-6 !text-center">
                Thank you for shopping with us. Please come again. Have a nice
                day.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

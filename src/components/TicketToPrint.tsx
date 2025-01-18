import { forwardRef, useImperativeHandle, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { cn } from "@/utils";
import useSettings from "@/hooks/useSettings";
import { useAuth } from "@/context/auth.context";
import QRCode from "react-qr-code";

const TicketToPrint = forwardRef(
  (
    {
      items,
      number,
      Action,
      title,
      table,
      className,
      isReprint,
      waiter,
      onAfterPrint,
      created,
      order,
    }: any,
    ref
  ) => {
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

    useImperativeHandle(ref, () => ({
      print() {
        handlePrint();
      },
    }));

    const { settings } = useSettings();

    const { user } = useAuth();

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
            "hidden relative font-prime border border-gray-200 m-2"
          )}
        >
          <div ref={contentToPrint} className="bg-white px-3 relative">
            <div className="absolute w-full z-50 flex h-full justify-center items-start pt-6">
              <span className="text-[400px] opacity-40 font-bold">
                {settings.ticket_watermark || "N.A"}
              </span>
            </div>
            <div
              id="receipt-content"
              className="text-left w-full text-sm pb-48 pt-3 overflow-auto"
            >
              <div className="text-center text-[14px] flex flex-col justify-center items-center gap-1">
                <span className="font-bold text-2xl uppercase">
                  {settings?.company_name || "Company Name"}
                </span>
                <p className="font-bold text-[28px] !font-prime uppercase underline">
                  {title}
                </p>
                <div className="mt-2 text-lg text-black font-bold">
                  <span className="underline">Table</span>
                  <span>:{table || "N.A"}</span>
                </div>
                <p className="font-bold  text-lg">
                  {settings.company_address}i
                </p>
              </div>
              <div className="flex mt-4 text-[19px] font-bold">
                <div className="flex-grow bold">
                  No: <span>{number}</span>
                </div>
                <div>
                  {new Date(created).toLocaleDateString()}{" "}
                  {new Date(created).toLocaleTimeString()}
                </div>
              </div>
              <hr className="my-2  border border-dashed" />
              <div>
                <table className="w-full text-lg">
                  <thead>
                    <tr>
                      <th className="py-1 w-2/12- text-center">Qty</th>
                      <th className="py-1 text-left">Item</th>
                      <th className="py-1 w-3/12- text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((e, i) => {
                      return (
                        <tr>
                          <td className="py-2 pr-5 text-center font-bold align-top">
                            {e.quantity}
                          </td>
                          <td className="py-2 pr-5  text-text-lg  text-left font-bold align-top">
                            <span
                              className={cn({
                                "line-through": e.status === "cancelled",
                              })}
                            >
                              {e.name}
                            </span>

                            <div className="ml-7-">
                              {e.notes && (
                                <p className="whitespace-normal text-lg text-black leading-6">
                                  <span className="underline">Notes</span>:{" "}
                                  {e.notes}
                                </p>
                              )}
                              {e.modifiers && (
                                <div className=" text-slate-500 font-medium- items-center justify-between">
                                  {e.modifiers.map((e, i) => {
                                    return (
                                      <div
                                        key={i}
                                        className="flex items-center leading-6 gap-2"
                                      >
                                        +{" "}
                                        <span className="capitalize underline">
                                          {e.name}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {e.variant ? (
                                <div className="text-[15px] text-slate-500 font-medium- items-center justify-between">
                                  <div className="flex items-center leading-7 gap-2">
                                    Variant:{" "}
                                    <span className="capitalize underline">
                                      {e?.variant?.name}
                                    </span>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </td>

                          <td className="py-2 text-right font-bold  align-top">
                            RWF.{e.subTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <hr className="my-2 border border-dashed" />
              <div>
                <div className="flex font-bold-">
                  <div className="flex-grow text-lg  font-bold text-18">
                    TOTAL ITEMS
                  </div>
                  <div className="text-lg  font-bold">
                    X
                    {items
                      .filter((e) => e.status !== "cancelled")
                      .reduce(
                        (acc: number, item: any) => acc + item?.quantity,
                        0
                      )}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex mt-2 font-bold">
                  <div className="flex-grow text-lg font-bold">
                    TOTAL Amount
                  </div>
                  <div className="text-lg ">
                    RWF.{" "}
                    {items
                      .filter((e) => e.status !== "cancelled")
                      .reduce(
                        (acc: number, item: any) => acc + item?.subTotal,
                        0
                      )}
                  </div>
                </div>
              </div>
              <hr className="my-2  border border-dashed" />
              <div className="space-y-2">
                <div className="text-lg ">
                  <span className="underline font-bold">Waiter</span>
                  <span className="text-lg font-bold">
                    :{waiter?.name || "N.A"}.
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-lg ">
                  <span className="underline font-bold">Order</span>
                  <span className="text-lg font-bold">:{order || "N.A"}.</span>
                </div>
              </div>
              {isReprint && (
                <div>
                  <div className="space-y-2 mt-3">
                    <div className="text-[16px]">
                      <span className="underline font-bold">NOTE: </span>
                      <span className=" font-bold">
                        :This ticked is Re-Printed
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-[15px]">
                    <div className="text-lg">
                      <span className="underline font-bold">
                        Reprinted By:{" "}
                      </span>
                      <span className=" font-bold">:{user?.names}</span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[14.5px] font-bold px-3 my-3 leading-6 !text-center">
                  Thank you.
                </p>
              </div>

              <div className="mx-auto flex items-center justify-center mt-5">
                <QRCode
                  size={106}
                  value={
                    settings?.application_url + "/tickets/" + number?.toString()
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

export default TicketToPrint;

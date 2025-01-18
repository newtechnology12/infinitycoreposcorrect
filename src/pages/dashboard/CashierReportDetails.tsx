import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import pocketbase from "@/lib/pocketbase";
import { cn } from "@/utils";
import formatSeconds from "@/utils/formatSeconds";
import { useMemo } from "react";
import { ArrowLeft } from "react-feather";
import { useQuery } from "react-query";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function CashierReportDetails() {
  const navigate = useNavigate();

  const getShiftReport = async () => {
    const report = await pocketbase
      .collection("work_shift_reports")
      .getOne(reportId, {
        expand:
          "work_shift,waiter,cachier,credits,credits.employee,credits.customer,activity",
      });

    const payment_methods_used = report.payment_methods;

    return {
      waiter: report?.expand?.waiter?.name,
      cachier: report?.expand?.cachier?.name,
      date: new Date(report?.date).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      credits: report?.expand?.credits,
      payment_methods: payment_methods_used,
      amount_owed: report.amount_owed,
      gross_amount: report.gross_amount,
      orders_count: report.orders_count,
      activity: report?.expand?.activity?.name || "N.A",
      allowances: report?.allowances || [],
      discounts: report?.discounts || [],
      closing_notes: report.closing_notes || "N.A",
      cancelations: report.cancelations,
      credits_amount: report?.expand?.credits?.reduce(
        (acc, curr) => acc + Number(curr.amount),
        0
      ),
      duration: formatSeconds(400),
    };
  };

  const reportId = useParams().reportId;

  const { data } = useQuery(["work_shift_reports", reportId], getShiftReport, {
    enabled: Boolean(reportId),
  });

  const report_status = useMemo(
    () => [
      {
        name: "names",
        title: "Waiter",
        value: data ? data?.waiter : "---",
      },
      {
        name: "cachier",
        title: "Cachier",
        value: data ? data?.cachier : "---",
      },
      {
        name: "date",
        title: "Date",
        value: data ? data?.date : "---",
      },
      {
        name: "gross_amount_amount",
        title: "Total Sales Amount",
        value: data
          ? Number(data?.gross_amount || 0).toLocaleString() + " FRW"
          : "---",
      },
      {
        name: "credits_amount",
        title: "Total credits Amount",
        value: data
          ? Number(data?.credits_amount || 0).toLocaleString() + " FRW"
          : "---",
      },
      {
        name: "shift_time",
        title: "Shift Time",
        value: data ? data?.duration || "---" : "---",
      },
      {
        name: "total_orders",
        title: "Total Orders",
        value: data ? Number(data?.orders_count || 0) : "---",
      },
      {
        name: "activity",
        title: "Activity",
        value: data ? data?.activity : "N.A",
      },
    ],
    [data]
  );

  const total_payments = useMemo(
    () =>
      data?.payment_methods?.reduce(
        (acc, curr) => acc + Number(curr.amount),
        0
      ) || 0,
    [data]
  );

  const total_allowances = useMemo(
    () =>
      data?.allowances?.reduce((acc, curr) => acc + Number(curr.amount), 0) ||
      0,
    [data]
  );

  const total_cancelations = useMemo(
    () =>
      data?.cancelations?.reduce(
        (acc, curr) => acc + Number(curr?.amount),
        0
      ) || 0,
    [data]
  );
  const total_credits = useMemo(
    () =>
      data?.credits?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0,
    [data]
  );

  const total_balance = useMemo(
    () =>
      total_payments +
      total_cancelations +
      total_credits +
      total_allowances -
      data?.gross_amount,
    [data, total_payments, total_cancelations, total_allowances, total_credits]
  );

  const total_discounts = useMemo(
    () =>
      data?.discounts?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0,
    [data]
  );
  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Cachier Report details
            </h2>
            <BreadCrumb
              items={[{ title: "Cachier reports", link: "/dashboard" }]}
            />
          </div>
        </div>
        <Card className="rounded-[4px] overflow-hidden">
          <div className="mt-1">
            <div className="px-3 py-3">
              <Button
                onClick={() => {
                  navigate(-1);
                }}
                size="sm"
                className="gap-3 rounded-full text-primary hover:underline"
                variant="secondary"
              >
                <ArrowLeft size={16} />
                <span>Go back to reports</span>
              </Button>
            </div>
            <div className="border-b px-5  border-dashed">
              <h4>
                <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                  Cashier Report
                </span>
              </h4>
              <div className="grid gap-4  pb-3 grid-cols-2 md:grid-cols-7">
                {report_status.map((status, i) => (
                  <div key={i}>
                    <h1 className="px-2- capitalize py-1 text-[14px] sm:text-[15px] font-semibold">
                      {status.value}
                    </h1>
                    <div className="px-2- capitalize py-1 text-sm text-slate-500">
                      {status.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 py-2">
              <h4>
                <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                  payments Report
                </span>
              </h4>
              <div className="border rounded-[3px] overflow-hidden mb-3">
                <table className="w-full  table-fixed">
                  <thead>
                    <tr className="text-left">
                      <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Payment Method
                      </th>
                      <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.payment_methods?.map((method, i) => {
                      return (
                        <tr key={i}>
                          <td className="border-b text-[13px] px-3 border-r py-[10px]">
                            {method?.payment_method?.name || "---"}
                          </td>
                          <td className="border-b text-[13px] px-3 border-r py-[10px]">
                            {Number(method?.amount).toLocaleString()} FRW
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td className="text-sm px-3 border-r font-semibold py-[10px]">
                        Total
                      </td>
                      <td className=" text-sm font-semibold px-3 border-r py-[10px]">
                        <span>{total_payments?.toLocaleString() || 0}</span>
                        <span> FRW</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-2">
              <h4>
                <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                  credits Report
                </span>
              </h4>
              <div className="border rounded-[3px] overflow-hidden mb-3">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="text-left">
                      <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Employee /Customer
                      </th>
                      <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.credits?.map((credit, i) => {
                      return (
                        <tr key={i}>
                          <td className="border-b text-[13px] px-3 border-r py-[10px]">
                            {credit.expand?.customer?.names ||
                              credit.expand?.employee?.name}
                          </td>
                          <td className="border-b text-[13px] px-3 border-r py-[10px]">
                            {Number(credit.amount).toLocaleString()} FRW
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td className="text-sm px-3 border-r font-semibold py-[10px]">
                        Total
                      </td>
                      <td className=" text-sm font-semibold px-3 border-r py-[10px]">
                        <span>
                          {Number(total_credits || 0).toLocaleString() || 0}
                        </span>
                        <span> FRW</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-2">
              <h4>
                <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                  Allowances Report
                </span>
              </h4>
              <div className="border rounded-[3px] overflow-hidden mb-3">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="text-left">
                      <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Employee
                      </th>
                      <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Amount
                      </th>
                      <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Limit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.allowances?.map((allowance, i) => {
                      return (
                        <tr key={i}>
                          <td className="border-b capitalize text-[13px] px-3 border-r py-[10px]">
                            {allowance?.employee?.name}
                          </td>
                          <td
                            className={cn(
                              "border-b text-[13px] px-3 border-r py-[10px]",
                              Number(allowance.amount) > Number(allowance.limit)
                                ? "text-red-500"
                                : ""
                            )}
                          >
                            {Number(allowance.amount).toLocaleString()} FRW
                          </td>
                          <td className="border-b text-[13px] px-3 border-r py-[10px]">
                            {Number(allowance.limit).toLocaleString()} FRW
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td className="text-sm px-3 border-r font-semibold py-[10px]">
                        Total
                      </td>
                      <td className=" text-sm font-semibold px-3 border-r py-[10px]">
                        <span>
                          {Number(total_allowances || 0).toLocaleString() || 0}
                        </span>
                        <span> FRW</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-5 py-2">
              <h4>
                <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                  Cancelled Orders Report
                </span>
              </h4>
              <div className="border rounded-[3px] overflow-hidden mb-3">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="text-left">
                      <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Order
                      </th>
                      <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Item
                      </th>
                      <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Quantity
                      </th>
                      <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Amount
                      </th>
                      <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Comment
                      </th>
                      {/* <th className="border-b border-r font-semibold text-sm px-3 py-2">
                        Action
                      </th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {data?.cancelations?.map((can, i) => {
                      return (
                        <tr key={i}>
                          <td className="border-b capitalize text-[13px] px-3 border-r py-[10px]">
                            <Link
                              to={`/dashboard/sales/orders/${can?.order?.id}`}
                              className="underline text-blue-500"
                            >
                              {can?.order?.code || "N.A"}
                            </Link>
                          </td>
                          <td className="border-b capitalize text-[13px] px-3 border-r py-[10px]">
                            {can?.item?.expand?.menu?.name}
                          </td>
                          <td className="border-b capitalize text-[13px] px-3 border-r py-[10px]">
                            {can?.quantity}
                          </td>
                          <td
                            className={cn(
                              "border-b text-[13px] px-3 border-r py-[10px]"
                            )}
                          >
                            {Number(can?.amount).toLocaleString()} FRW
                          </td>
                          <td className="border-b text-[13px] px-3 border-r py-[10px]">
                            {can.comment || "N.A"}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td className="text-sm px-3 border-r font-semibold py-[10px]">
                        Total
                      </td>
                      <td className="text-sm px-3 border-r font-semibold py-[10px]"></td>
                      <td className=" text-sm font-semibold px-3 border-r py-[10px]">
                        <span>
                          {Number(total_cancelations || 0).toLocaleString() ||
                            0}
                        </span>
                        <span> FRW</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="max-w-sm px-6 bg-slate-200- w-full space-y-5 pb-4 ml-auto px-5-">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Total credits</h4>
                <span className="text-sm font-medium">
                  <span>{total_credits.toLocaleString()}</span>
                  <span> FRW</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Total payments</h4>
                <span className="text-sm font-medium">
                  <span>{total_payments.toLocaleString()}</span>
                  <span> FRW</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Total Cancelations</h4>
                <span className="text-sm font-medium">
                  <span>{total_cancelations.toLocaleString()}</span>
                  <span> FRW</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Total discounts</h4>
                <span className="text-sm font-medium">
                  <span>-{total_discounts.toLocaleString()}</span>
                  <span> FRW</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Total allowances</h4>
                <span className="text-sm font-medium">
                  <span>{total_allowances.toLocaleString()}</span>
                  <span> FRW</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  Total remanining/balance
                </h4>
                <span className="text-sm font-medium">
                  <span>{total_balance > 0 ? "+" : ""}</span>
                  <span>{total_balance}</span>
                  <span> FRW</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Grand total</h4>
                <span className="text-sm font-bold text-primary">
                  <span>
                    {(
                      total_payments +
                      total_credits +
                      total_cancelations +
                      total_allowances
                    )?.toLocaleString()}
                  </span>
                  <span> FRW</span>
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

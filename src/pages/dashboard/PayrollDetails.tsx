import BreadCrumb from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mkConfig, generateCsv, download } from "export-to-csv";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import pocketbase from "@/lib/pocketbase";
import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { ArrowLeft } from "react-feather";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";

export default function PayrollDetails() {
  const getPayrollReport = async () => {
    const data = await pocketbase.collection("payrolls").getOne(payrollId, {
      expand:
        "employees_payrolls,employees_payrolls.employee,created_by,employees_payrolls.department",
    });
    return data;
  };

  const payrollId = useParams()?.payrollId;

  const { data: payroll } = useQuery(
    ["payrolls", payrollId],
    getPayrollReport,
    {
      enabled: Boolean(payrollId),
    }
  );

  const report_status = useMemo(() => {
    return [
      {
        name: "total_payroll",
        title: "Total Payroll amount",
        value: payroll
          ? payroll?.total_amount?.toLocaleString() + " FRW"
          : "---",
      },

      {
        name: "total_credits",
        title: "Total Credits covered",
        value: payroll
          ? payroll?.credits_covered.toLocaleString() + " FRW"
          : "---",
      },
      {
        name: "created_by",
        title: "Created by",
        value: payroll ? payroll?.expand?.created_by?.name : "---",
      },
      {
        name: "period",
        title: "Period",
        value: payroll ? `${payroll?.month}/${payroll?.year}` : "---",
      },
    ];
  }, [payroll]);

  const navigate = useNavigate();

  const [payrollToShowCredits, setpayrollToShowCredits] = useState(undefined);

  const csvConfig = mkConfig({ useKeysAsHeaders: true });

  const generatePayroll = async () => {
    const report_data = payroll.expand.employees_payrolls.map((e) => {
      return {
        Employee: e.expand.employee.name,
        Role: e.expand?.employee?.expand?.role?.name || "N.A",
        Amount: e.recieved,
      };
    });
    const csv = generateCsv(csvConfig)([
      ...report_data,
      { Employee: "TOTAL", Role: "", Amount: payroll.total_amount },
    ]);
    download(csvConfig)(csv);
  };

  return (
    <>
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Payroll Details
            </h2>
            <BreadCrumb
              items={[{ title: "Payroll Details", link: "/dashboard" }]}
            />
          </div>
        </div>
        <div>
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
                  <span>Go back to payrolls</span>
                </Button>
              </div>
            </div>
            <div className="border-b px-5  border-dashed">
              <div className="grid gap-4  pb-3 grid-cols-2 sm:grid-cols-4">
                {report_status.map((status, i) => (
                  <div key={i}>
                    <h1 className="px-2- capitalize py-1 text-base sm:text-[16px] font-semibold">
                      {status.value}
                    </h1>
                    <div className="px-2- py-1 text-sm text-slate-500">
                      {status.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-dashed">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tr className="text-left">
                    <th className="font-medium px-5 truncate capitalize  text-sm py-2 bg-slate-50 border-b">
                      Employee
                    </th>
                    <th className="font-medium px-5 truncate capitalize  text-sm py-2 bg-slate-50 border-b">
                      Department.
                    </th>
                    <th className="font-medium px-5 truncate capitalize  text-sm py-2 bg-slate-50 border-b">
                      Full Salary
                    </th>
                    <th className="font-medium px-5 truncate capitalize  text-sm py-2 bg-slate-50 border-b">
                      Net Salary
                    </th>
                    <th className="font-medium px-5 truncate capitalize  text-sm py-2 bg-slate-50 border-b">
                      Taxes
                    </th>
                    <th className="font-medium px-5 truncate capitalize  text-sm py-2 bg-slate-50 border-b">
                      Total Credit.
                    </th>
                    <th className="font-medium px-5 truncate capitalize  text-sm py-2 bg-slate-50 border-b">
                      Paid Credit.
                    </th>
                    <th className="font-medium px-5 truncate  capitalize  text-sm py-2 bg-slate-50 border-b">
                      Credit Balance.
                    </th>
                    <th className="font-medium truncate px-5  capitalize  text-sm py-2 bg-slate-50 border-b">
                      Remainig Balance
                    </th>
                  </tr>
                  {payroll?.expand?.employees_payrolls?.map((e) => {
                    return (
                      <tr>
                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-3 border-b">
                          {e?.expand?.employee?.name}
                        </td>
                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-2 border-b">
                          {e?.expand?.department?.name || "N.A"}
                        </td>
                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-2 border-b">
                          {Number(e.salary).toLocaleString()} FRW
                        </td>
                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-2 border-b">
                          {Number(e.net_salary || 0).toLocaleString()} FRW
                        </td>
                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-2 border-b">
                          {Number(e.tax).toLocaleString()} FRW
                        </td>
                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-2 border-b">
                          {Number(e.credits_covered_amount).toLocaleString()}{" "}
                          FRW
                        </td>

                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-2 border-b">
                          {Number(e.credits_covered_amount).toLocaleString()}{" "}
                          FRW
                        </td>
                        <td className="font-medium truncate px-5 text-red-500 capitalize  text-[13px] py-2 border-b">
                          {Number(e.credits_left_amount).toLocaleString()} FRW
                        </td>
                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-2 border-b">
                          {
                            <span className="text-primary">
                              {Number(e.recieved).toLocaleString()} FRW
                            </span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </table>
              </div>
            </div>
            <div className="pb-4 mt-5 px-5">
              <div className="max-w-xl ml-auto flex flex-col justify-end items-end space-y-3">
                {payroll?.notes && (
                  <div className="px-2- max-w-sm  w-full mt-3-">
                    <Label className="text-[13px] mb-2 block text-slate-800">
                      Closing Note (Optional)
                    </Label>
                    <span className="text-[13px] mb-2 block text-slate-500">
                      {payroll?.notes}
                    </span>
                  </div>
                )}

                <div className="max-w-sm bg-slate-200- w-full space-y-5 pb-4 ml-auto px-5-">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Total Credits convered
                    </h4>
                    <span className="text-sm font-medium">
                      {Number(payroll?.credits_covered || 0).toLocaleString()}{" "}
                      FRW
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Total payroll</h4>
                    <span className="text-sm font-medium">
                      <span>
                        {Number(payroll?.total_amount || 0).toLocaleString()}{" "}
                        FRW
                      </span>
                    </span>
                  </div>
                </div>
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full px-3"
                    onClick={() => {
                      generatePayroll();
                    }}
                  >
                    <Download size={16} className="mr-2" />
                    Download Payroll
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <CreditsModal
        setOpen={(e) => {
          if (!e) {
            setpayrollToShowCredits(false);
          }
        }}
        payroll={payrollToShowCredits}
        open={Boolean(payrollToShowCredits)}
      />
    </>
  );
}

function CreditsModal({ open, payroll, setOpen }) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] !gap-[6px]">
        <DialogHeader>
          <DialogTitle className="text-sm mb-1">
            Payroll credits paid
          </DialogTitle>
        </DialogHeader>
        <div>
          <div className="px-1">
            <table className="w-full">
              <tr>
                <td className="text-[12px] py-2 uppercase font-medium text-slate-500">
                  Check
                </td>
                <td className="text-[12px] py-2 uppercase font-medium text-slate-500">
                  Amount
                </td>
                <td className="text-right py-2 text-[12px] uppercase font-medium text-slate-500">
                  Created At
                </td>
              </tr>
              {!payroll?.credits?.length ? (
                <tr>
                  <td colSpan={3} className="py-7">
                    <div className="text-center items-center flex justify-center text-[13px] font-medium text-slate-500">
                      <span>No credits available.</span>
                    </div>
                  </td>
                </tr>
              ) : undefined}
              {payroll?.credits?.map((e) => {
                return (
                  <tr>
                    <td className="px-2-">
                      <Checkbox checked={true} id={`credit-${e.id}`} />
                    </td>
                    <td className="text-[13px]">
                      {Number(e.amount).toLocaleString()} FRW
                    </td>
                    <td className="text-right text-[13px] py-2">
                      {new Date(e.created).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
            </table>

            <div className="border-t space-y-3 py-3 mt-2">
              <div className="flex max-w-[200px] ml-auto items-center justify-between">
                <h4 className="text-[13px] font-medium">Total credit</h4>
                <span className="text-[13px] font-medium">
                  <span>{payroll?.credits_amount} FRW</span>
                </span>
              </div>
              <div className="flex max-w-[200px] ml-auto items-center justify-between">
                <h4 className="text-[13px] font-medium">Credit covered</h4>
                <span className="text-[13px] font-medium">
                  <span>
                    {payroll?.credits_covered_amount?.toLocaleString()} FRW
                  </span>
                </span>
              </div>
              <div className="flex max-w-[200px] ml-auto items-center justify-between">
                <h4 className="text-[13px] font-medium">Credit balance</h4>
                <span className="text-[13px] font-medium">
                  <span>
                    {payroll?.credits_left_amount?.toLocaleString()} FRW
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import BreadCrumb from "@/components/breadcrumb";
import Loader from "@/components/icons/Loader";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { z } from "zod";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth.context";
import pocketbase from "@/lib/pocketbase";
import { AlertCircleIcon, ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AppFormSelect from "@/components/forms/AppFormSelect";
import { Form } from "@/components/ui/form";

// Function to process payroll and loans
function processPayroll(salary, loans) {
  let remainingSalary = salary;
  const updatedLoans = loans.map((loan) => {
    if (remainingSalary >= loan.amount) {
      // Fully pay off the loan
      remainingSalary -= loan.amount;
      return {
        ...loan,
        status: "paid",
        payed_at: new Date().toISOString(),
        transactions: [
          ...loan.transactions,
          { amount: loan.amount, date: new Date().toISOString() },
        ],
      };
    } else if (remainingSalary > 0) {
      // Partially pay off the loan
      const paidAmount = remainingSalary;
      remainingSalary = 0;
      return {
        ...loan,
        amount: loan.amount - paidAmount,
        status: "partial",
        transactions: [
          ...loan.transactions,
          { amount: paidAmount, date: new Date().toISOString() },
        ],
      };
    } else {
      console.log("No money left to pay this loan");
      // No money left to pay this loan
      return loan;
    }
  });

  return {
    remainingSalary: remainingSalary,
    pendingLoans: 0,
    loansPaidAmount: salary - remainingSalary,
    loanRemainingAmount:
      loans.reduce((acc, e) => acc + e.amount, 0) - (salary - remainingSalary),
    totalLoansAmount: loans.reduce((acc, e) => acc + e.amount, 0),
    updatedLoans,
  };
}

export default function NewPayroll() {
  const navigate = useNavigate();

  const payrollsQuery = useQuery({
    queryKey: ["payroll_employees"],
    queryFn: async () => {
      const credits = await pocketbase.collection("credits").getFullList({
        filter: `employee!="" && status!="paid"`,
      });
      return pocketbase
        .collection("users")
        .getFullList({
          expand: "department",
          filter: `status="active"`,
        })
        .then((e) => {
          return (
            e
              ?.map((e) => {
                // get credits which have deduction_month which is like 2024.5 which is equal to the payroll period
                const employeeCredits = credits?.filter(
                  (c) => c.employee === e.id
                );

                const payroll = processPayroll(e.salary, employeeCredits);

                return {
                  id: e.id,
                  name: e.name,
                  avatar: e.avatar,
                  department: e.expand?.department,
                  salary: e.salary || 0,
                  net_salary: e.net_salary || 0,
                  tax: e?.salary - e?.net_salary,
                  credits_amount: payroll.totalLoansAmount || 0,
                  credits_covered: payroll.loansPaidAmount || 0,
                  credits: payroll.updatedLoans,
                  credits_left: payroll.loanRemainingAmount || 0,
                  recievable: e.salary - payroll.loansPaidAmount,
                };
              })
              // sort by department
              .sort((a, b) => {
                if (a.department?.id < b.department?.id) {
                  return -1;
                }
                if (a.department?.id > b.department?.id) {
                  return 1;
                }
                return 0;
              })
          );
        });
    },
    enabled: true,
  });

  const { user } = useAuth();

  const [payslips, setPayslips] = useState(undefined);

  useEffect(() => {
    if (payrollsQuery.data) {
      setPayslips(
        payrollsQuery.data.map((e) => {
          return {
            ...e,
          };
        })
      );
    } else {
      setPayslips([]);
    }
  }, [payrollsQuery.data]);

  const [month, setmonth] = useState(new Date().getMonth() + 1);
  const [year, setyear] = useState(new Date().getFullYear());

  const report_status = useMemo(() => {
    return [
      {
        name: "created_by",
        title: "Created by",
        value: payrollsQuery.data ? user.names : "---",
      },
      {
        name: "period",
        title: (
          <p>
            Period -{" "}
            <a
              onClick={() => {
                setshowUpdatePeriod(true);
              }}
              className="text-[12.5px] cursor-pointer text-blue-500 underline"
            >
              Edit
            </a>
          </p>
        ),
        value: `${month}/${year}`,
      },
    ];
  }, [payrollsQuery.data, month, year]);

  const [closing_notes, setclosing_notes] = useState("");

  const credits_covered = payslips?.reduce(
    (acc, e) => acc + e.credits_covered,
    0
  );

  const total_payroll = payslips?.reduce((acc, e) => acc + e?.recievable, 0);

  const payCredit = async (credit) => {
    const transactions = await Promise.all(
      credit.transactions.map((transaction) =>
        pocketbase.collection("transactions").create({
          date: new Date(),
          amount: transaction.amount,
          bill_to: "staff",
          staff: credit.employee,
          created_by: user.id,
          status: "approved",
          approved_by: user.id,
          type: "income",
        })
      )
    );

    const is_full_paid = credit.credits_left === 0;

    await pocketbase.collection("credits").update(credit.id, {
      status: is_full_paid ? "paid" : "partially_paid",
      "transactions+": transactions.map((e) => e.id),
    });

    return transactions;
  };

  const [error, seterror] = useState(undefined);

  const createEmployeePayroll = async (employee_payroll, payroll) => {
    const transactions = await Promise.all(
      employee_payroll?.credits.map((e) => payCredit(e))
    );

    return pocketbase.collection("employees_payrolls").create({
      employee: employee_payroll.id,
      recieved: employee_payroll.recievable,
      credits_covered_amount: employee_payroll.credits_covered,
      credits_left_amount: employee_payroll.credits_left,
      credits_covered: employee_payroll?.credits?.map((e) => e?.id),
      payroll: payroll.id,
      salary: employee_payroll.salary,
      net_salary: employee_payroll?.net_salary,
      department: employee_payroll?.department?.id,
      tax: employee_payroll.tax,
      credit_transactions: transactions.map((e) => e?.id),
    });
  };

  const createPayrollMutation = useMutation({
    mutationFn: async () => {
      seterror(undefined);
      // check if the period is not yet reached
      if (new Date(year, month - 1) > new Date()) {
        throw new Error("You cannot create a payroll for a future period");
      }
      // check if there is existing payroll existing checking month and year
      const existing_payroll = await pocketbase
        .collection("payrolls")
        .getFullList({
          filter: `month="${month}" && year="${year}"`,
        });

      if (existing_payroll[0]?.id)
        throw new Error("Payroll already exists for this period");

      const payroll_data = {
        total_amount: total_payroll,
        month,
        year,
        date: new Date().getDate(),
        period_cycle: "monthly",
        notes: closing_notes,
        created_by: user.id,
        credits_covered: credits_covered,
        employees_payrolls: [],
      };
      const payroll = await pocketbase
        .collection("payrolls")
        .create(payroll_data);

      const employees_payrolls = await Promise.all(
        payslips.map((e) => createEmployeePayroll(e, payroll))
      );

      return pocketbase.collection("payrolls").update(payroll.id, {
        employees_payrolls: employees_payrolls.map((e) => e.id),
      });
    },
    onSuccess: (e) => {
      console.log(e);
      toast.success("You have successfully generated a payroll.");
      navigate(`/dashboard/hr/payroll/${e.id}`);
    },
    onError: (error: any) => {
      console.log({ error });
      seterror(error.message);
      // toast.error("Failed to generate payroll");
    },
  });

  const [showUpdatePeriod, setshowUpdatePeriod] = useState(false);

  const total_row = {
    name: "Total",
    department: "",
    salary: payslips?.reduce((acc, e) => acc + e.salary, 0),
    net_salary: payslips?.reduce((acc, e) => acc + e.net_salary, 0),
    tax: payslips?.reduce((acc, e) => acc + e.tax, 0),
    credits_amount: payslips?.reduce((acc, e) => acc + e.credits_amount, 0),
    credits_covered: payslips?.reduce((acc, e) => acc + e.credits_covered, 0),
    credits_left: payslips?.reduce((acc, e) => acc + e.credits_left, 0),
    recievable: payslips?.reduce((acc, e) => acc + e.recievable, 0),
  };

  return (
    <>
      {" "}
      <div className="sm:px-4 px-2">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Create a new payroll
            </h2>
            <BreadCrumb
              items={[{ title: "Create a new Payroll", link: "/dashboard" }]}
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
              <div className="grid gap-4  pb-3 grid-cols-2 sm:grid-cols-5">
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
            <div className="border-t   border-dashed">
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <tr className="text-left">
                    <th className="font-medium px-5 truncate capitalize  text-sm py-2 bg-slate-50 border-b">
                      N0
                    </th>
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
                  {payslips?.map((e, i) => {
                    return (
                      <tr>
                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-3 border-b">
                          {i + 1}
                        </td>
                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-3 border-b">
                          {e.name}
                        </td>
                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-2 border-b">
                          {e.department?.name || "N.A"}
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
                          {Number(e.credits_amount).toLocaleString()} FRW
                        </td>

                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-2 border-b">
                          {Number(e.credits_covered).toLocaleString()} FRW
                        </td>
                        <td className="font-medium truncate px-5 text-red-500 capitalize  text-[13px] py-2 border-b">
                          {Number(e.credits_left).toLocaleString()} FRW
                        </td>
                        <td className="font-medium truncate px-5  capitalize  text-[13px] py-2 border-b">
                          {
                            <span className="text-primary">
                              {Number(e.recievable).toLocaleString()} FRW
                            </span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-green-500 text-white">
                    <td className="font-medium px-5 truncate capitalize  text-[13px] py-2 border-b"></td>
                    <td className="font-medium px-5 truncate capitalize  text-[13px] py-2 border-b">
                      {total_row.name}
                    </td>
                    <td className="font-medium px-5 truncate  capitalize  text-[13px] py-2 border-b">
                      ---
                    </td>
                    <td className="font-medium px-5 truncate capitalize  text-[13px] py-2 border-b">
                      {Number(total_row.salary).toLocaleString()} FRW
                    </td>
                    <td className="font-medium px-5 truncate capitalize  text-[13px] py-2 border-b">
                      {Number(total_row.net_salary || 0).toLocaleString()} FRW
                    </td>
                    <td className="font-medium px-5  truncate capitalize  text-[13px] py-2 border-b">
                      {Number(total_row.salary || 0).toLocaleString()} FRW
                    </td>
                    <td className="font-medium px-5 truncate capitalize  text-[13px] py-2 border-b">
                      {Number(total_row.credits_amount).toLocaleString()} FRW
                    </td>
                    <td className="font-medium px-5 truncate capitalize  text-[13px] py-2 border-b">
                      {Number(total_row.credits_covered).toLocaleString()} FRW
                    </td>
                    <td className="font-medium px-5 truncate text-white capitalize  text-[13px] py-2 border-b">
                      {Number(total_row.credits_left).toLocaleString()} FRW
                    </td>
                    <td className="font-medium px-5 truncate capitalize  text-[13px] py-2 border-b">
                      {
                        <span className="text-white">
                          {Number(total_row.recievable).toLocaleString()} FRW
                        </span>
                      }
                    </td>
                  </tr>
                </table>
              </div>
            </div>
            <div className="pb-4 mt-4 px-5">
              <div className="max-w-xl ml-auto flex flex-col justify-end items-end space-y-3">
                <div className="px-2- w-full mt-3-">
                  <Label className="text-[13px] mb-2 block text-slate-500">
                    Closing Note (Optional)
                  </Label>
                  <Textarea
                    rows={2}
                    onChange={(e) => setclosing_notes(e.target?.value)}
                    value={closing_notes}
                    className="w-full"
                    placeholder="Add closing note."
                  />
                </div>

                {error && (
                  <div className="max-w-sm bg-slate-200- w-full space-y-5 pb-4 ml-auto px-5-">
                    <Alert
                      variant="destructive"
                      className="py-2 -mt-2 rounded-[4px] flex items-center"
                    >
                      <AlertCircleIcon className="h-4 -mt-[5px] mr-3 w-4" />
                      <AlertTitle className="text-[13px] font-medium fon !m-0">
                        {error}
                      </AlertTitle>
                    </Alert>
                  </div>
                )}

                <div className="flex items-center gap-2 ">
                  <Button
                    onClick={() => {}}
                    className="w-fit !text-primary"
                    size="sm"
                    variant="secondary"
                  >
                    Reset payroll
                  </Button>

                  <Button
                    onClick={() => createPayrollMutation.mutate()}
                    disabled={createPayrollMutation.isLoading}
                    className="w-fit"
                    size="sm"
                  >
                    {createPayrollMutation.isLoading && (
                      <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                    )}
                    Generate payroll
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <UpdatePeriodModal
        onUpdate={({ month, year }: any) => {
          setmonth(month);
          setyear(year);
          setshowUpdatePeriod(false);
        }}
        setOpen={setshowUpdatePeriod}
        open={showUpdatePeriod}
        month={month}
        year={year}
      />
    </>
  );
}

function UpdatePeriodModal({ open, setOpen, onUpdate, month, year }) {
  const formSchema = z.object({
    month: z.string(),
    year: z.string(),
  });

  const values = {
    month: month.toString(),
    year: year.toString(),
  };
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values,
  });

  useEffect(() => {
    form.reset();
  }, [open]);

  const onSubmit = (values) => {
    return onUpdate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[525px] !gap-[6px]">
        <DialogHeader>
          <DialogTitle className="text-base">Update Period</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2- gap-2">
              <div className="grid gap-2 grid-cols-2">
                <AppFormSelect
                  form={form}
                  label={"Choose month"}
                  placeholder={"Choose month"}
                  name={"month"}
                  options={[
                    { label: "January", value: "1" },
                    { label: "February", value: "2" },
                    { label: "March", value: "3" },
                    { label: "April", value: "4" },
                    { label: "May", value: "5" },
                    { label: "June", value: "6" },
                    { label: "July", value: "7" },
                    { label: "August", value: "8" },
                    { label: "September", value: "9" },
                    { label: "October", value: "10" },
                    { label: "November", value: "11" },
                    { label: "December", value: "12" },
                  ]}
                />
                <AppFormSelect
                  form={form}
                  label={"Choose year"}
                  placeholder={"Choose year"}
                  name={"year"}
                  options={[
                    { label: "2020", value: "2020" },
                    { label: "2021", value: "2021" },
                    { label: "2022", value: "2022" },
                    { label: "2023", value: "2023" },
                    { label: "2024", value: "2024" },
                    { label: "2025", value: "2025" },
                    { label: "2026", value: "2026" },
                    { label: "2027", value: "2027" },
                    { label: "2028", value: "2028" },
                    { label: "2029", value: "2029" },
                    { label: "2030", value: "2030" },
                    { label: "2031", value: "2031" },
                    { label: "2032", value: "2032" },
                    { label: "2033", value: "2033" },
                    { label: "2034", value: "2034" },
                    { label: "2035", value: "2035" },
                  ]}
                />
              </div>
            </div>
            <DialogFooter>
              <div className="mt-6 flex items-center gap-2 px-2 pb-1">
                <Button
                  type="submit"
                  onClick={() => {
                    form.handleSubmit(onSubmit);
                  }}
                  className="w-full"
                  size="sm"
                >
                  Update period
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

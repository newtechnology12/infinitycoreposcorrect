import pocketbase from "@/lib/pocketbase";
import formatBill from "@/utils/formatBill";
import formatSeconds from "@/utils/formatSeconds";
import { differenceInSeconds } from "date-fns";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/context/auth.context";
import Loader from "./icons/Loader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { v4 as uuidv4 } from "uuid";
import AsyncSelectField from "./AsyncSelectField";
import useModalState from "@/hooks/useModalState";
import { NewWorkShiftModal } from "./modals/NewWorkShiftModal";
import ConfirmModal from "./modals/ConfirmModal";
import useConfirmModal from "@/hooks/useConfirmModal";
import { cn } from "@/utils";
import { useRoles } from "@/context/roles.context";

function CreateShiftReport() {
  const shiftId = useParams()?.shiftId;

  const getShiftReport = async () => {
    const orders = await pocketbase.collection("orders").getFullList({
      filter: `work_shift="${shiftId}"`,
      expand:
        "bills.discount,bills,bills.items,bills.transactions,bills.credits,bills.credits.customer,bills.transactions.payment_method,items",
    });

    const shift = await pocketbase.collection("work_shifts").getOne(shiftId, {
      expand:
        "employee,report.credits,report.credits.customer,report.credits.employee,activity",
    });

    const bills = orders
      .map((order) => order?.expand?.bills)
      .flat()
      .map(formatBill);

    const transactions = bills
      .map((bill) => bill?.expand?.transactions)
      .flat()
      .filter((e) => e);

    // flat order items inside orders not in bills
    const flat_order_items = orders
      .map((order) => order?.expand?.items)
      .flat()
      .filter((e) => e)
      .filter((e) => e.status !== "draft")
      .filter((e) => e.status !== "cancelled");

    const total_sales = flat_order_items.reduce((a, b) => a + b?.amount, 0);

    const total_transactions = transactions.reduce((a, b) => a + b.amount, 0);

    const cash_amount = transactions
      .filter((e) => e?.expand?.payment_method?.type === "cash")
      .reduce((a, b) => a + b.amount, 0);

    const amount_owed = total_sales - total_transactions;

    const credits = bills
      .map((bill) => bill?.expand?.credits)
      .flat()
      .filter((e) => e)
      .map((e) => {
        return {
          ...e,
          customer: e.expand.customer,
          employee: e.expand.employee,
          type: e.expand?.customer
            ? "customer"
            : e.expand?.employee
            ? "employee"
            : "",
        };
      });

    const discounts = bills
      .map((bill) => bill?.expand?.discount)
      .filter((e) => e);

    const all_payment_methods = await pocketbase
      .collection("payment_methods")
      .getFullList();

    const all_payment_methods_with_amount = all_payment_methods.map((e) => {
      return {
        id: uuidv4(),
        type: "payment_method",
        amount: transactions
          .filter((i) => i.payment_method === e?.id)
          .reduce((a, b) => a + b.amount, 0),
        payment_method: e,
      };
    });

    return {
      employee: shift?.expand?.employee?.name,
      payment_methods:
        shift?.expand?.report?.payment_methods ||
        all_payment_methods_with_amount,
      date: new Date(shift?.created).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      amount_owed,
      cash_amount,
      activity: shift?.expand?.activity?.name,
      tota_discounts: discounts.reduce((a, b) => a + b?.amount, 0),
      discounts,
      allowances: shift?.expand?.report?.allowances || [],
      cancelations: shift?.expand?.report?.cancelations || [],
      credits:
        shift?.expand?.report?.expand?.credits.map((e) => ({
          ...e,
          customer: e.expand?.customer,
          employee: e.expand?.employee,
          notes: e.description,
          type: e.expand?.customer
            ? "customer"
            : e.expand?.employee
            ? "employee"
            : "",
        })) || credits,
      activity_id: shift?.activity,
      gross_sales: shift?.custom_gross_amount || total_sales,
      closed_bills: bills.filter((e) => e.payment_status === "paid").length,
      pending_bills: bills.filter((e) => e.payment_status === "pending").length,
      all_bills: bills.length,
      orders_count: orders.length,
      shift: shift,
      closing_notes: shift?.closing_notes || "",
      report: shift?.expand?.report,
      duration: formatSeconds(
        differenceInSeconds(
          shift.ended_at ? new Date(shift.ended_at) : new Date(),
          new Date(shift.started_at)
        )
      ),
    };
  };

  const { data, refetch } = useQuery(["work_shifts", shiftId], getShiftReport, {
    enabled: Boolean(shiftId),
  });

  const report_status = useMemo(
    () =>
      [
        {
          name: "names",
          title: "Employee",
          value: data ? data?.employee : "---",
        },
        {
          name: "date",
          title: "Date",
          value: data ? data?.date : "---",
        },
        {
          name: "gross_sales_amount",
          title: "Total Sales Amount",
          value: data
            ? Number(data?.gross_sales).toLocaleString() + " FRW"
            : "---",
        },
        {
          name: "shift_time",
          title: "Shift Time",
          value: data ? data?.duration || "---" : "---",
        },
        {
          name: "total_discounts",
          title: "Discounts",
          value: data
            ? data?.tota_discounts.toLocaleString() + " FRW" || "---"
            : "---",
        },
        {
          name: "total_orders",
          title: "Total Orders",
          value: data ? Number(data?.orders_count) : "---",
        },
        {
          name: "activity",
          title: "Activity",
          value: data ? data?.activity || "N.A" : "---",
        },
      ].filter((e) => e.value !== "N.A"),
    [data]
  );

  const navigate = useNavigate();

  const [closing_notes, setclosing_notes] = useState("");

  const [payments, setpayments] = useState([]);
  const [credits, setcredits] = useState([]);
  const [allowances, setallowances] = useState([]);
  const [cancelations, setCancelations] = useState([]);

  useEffect(() => {
    if (data) {
      setpayments(data?.report?.payment_methods || data?.payment_methods);
      setclosing_notes(data?.report?.cachier_closing_notes);
    } else {
      setpayments([]);
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      setcredits(data?.credits);
    } else {
      setcredits([]);
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      setallowances(data?.allowances || []);
    } else {
      setallowances([]);
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      setCancelations(data?.cancelations || []);
    } else {
      setCancelations([]);
    }
  }, [data]);

  const total = Number(
    payments.reduce((a, b) => a + Number(b?.amount || 0), 0)
  );

  const { user } = useAuth();

  const createOrUpdateWorkShiftReport = useMutation({
    mutationFn: async () => {
      const net_amount = payments.reduce(
        (a, b) => a + Number(b?.amount || 0),
        0
      );

      const owed_amount = data.gross_sales - net_amount;

      const creditsCreatedorUpdated: any = await Promise.all(
        credits
          .filter((e) => e?.amount)
          .map((credit) => {
            if (credit.isNew && !credit.isDeleted) {
              return pocketbase.collection("credits").create({
                employee: credit?.employee?.id,
                customer: credit?.customer?.id,
                amount: credit?.amount,
                description: credit?.notes,
                status: "pending",
                created_by: user.id,
                reason: "loan",
              });
            }

            if (credit.isDeleted && credit.id) {
              console.log(credit, "credit");
              return pocketbase.collection("credits").delete(credit.id);
            }

            return pocketbase.collection("credits").update(credit.id, {
              amount: credit?.amount,
              employee: credit?.employee?.id,
              customer: credit?.customer?.id,
              description: credit?.notes,
              reason: "loan",
            });
          })
      );

      const report_data = {
        cachier: user.id,
        waiter: data.shift.employee,
        date: new Date(),
        gross_amount: data.gross_sales,
        net_amount,
        owed_amount,
        activity: data.activity_id,
        orders_count: data?.orders_count,
        work_shift: shiftId,
        work_period: data.shift.work_period,
        discounts: data?.discounts,
        payment_methods: payments.map(({ isNew: _, ...other }) => {
          return {
            ...other,
          };
        }),
        cachier_closing_notes: closing_notes,
        cancelations: cancelations.filter((e) => !e.isDeleted),
        allowances: allowances
          .filter((e) => !e.isDeleted)
          .map((allowance) => {
            return {
              id: allowance.id,
              amount: allowance.amount,
              employee: {
                name: allowance?.employee?.name,
                id: allowance?.employee?.id,
              },
              limit: allowance?.employee?.expand?.role?.daily_allowance,
            };
          }),
        credits: creditsCreatedorUpdated
          .filter((e) => e?.id)
          .map((credit) => credit.id),
      };

      const q = data.report
        ? pocketbase
            .collection("work_shift_reports")
            .update(data.report.id, report_data)
        : pocketbase.collection("work_shift_reports").create(report_data);

      const report = await q;

      return pocketbase.collection("work_shifts").update(shiftId, {
        report: report.id,
        status: "closed",
        cachier_closing_notes: closing_notes,
      });
    },
    onSuccess: async () => {
      navigate(-1);
      toast.success("You have successfully submited report");
      refetch();
    },
    onError: (error: any) => {
      toast.success(
        "An error occurred while submitting report. Please try again."
      );
      console.log(error);
    },
  });

  const total_credits = credits
    .filter((e) => !e.isDeleted)
    .reduce((a, b) => a + Number(b.amount || 0), 0);

  const total_allowances = allowances
    .filter((e) => !e.isDeleted)
    .reduce((a, b) => a + Number(b.amount || 0), 0);

  const total_cancelations = cancelations
    .filter((e) => !e.isDeleted)
    .reduce((a, b) => a + Number(b?.amount || 0), 0);

  const total_payments = payments.reduce(
    (a, b) => a + Number(b?.amount || 0),
    0
  );

  const total_discounts = data?.discounts.reduce((a, b) => a + b.amount, 0);

  const grand_total =
    total_payments +
    total_credits +
    total_allowances +
    total_discounts +
    total_cancelations;

  const updateShiftModal = useModalState();

  const confirmModal = useConfirmModal();

  const [error, setError] = useState(undefined);

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (data?.report?.credits?.length) {
        throw new Error(
          "You cannot delete a shift report with existing credits"
        );
      }

      return pocketbase.collection("work_shifts").delete(shiftId);
    },
    onSuccess: () => {
      navigate(-1);
      toast.success("You have successfully deleted work period");
      refetch();
    },
    onError: (error: any) => {
      setError(error.message);
      console.log(error);
    },
  });

  const hasExidingAllowance = useMemo(() => {
    return allowances.find(
      (allowance) =>
        allowance?.amount >
        (allowance?.employee?.expand?.role?.daily_allowance || allowance.limit)
    );
  }, [allowances]);

  const { canPerform } = useRoles();

  return (
    <>
      {" "}
      <div>
        <div className="flex items-center justify-between">
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
              <span>Go back to shift history</span>
            </Button>
          </div>
          {data?.shift?.started_by === user?.id &&
          data?.shift?.custom_gross_amount ? (
            <div className="px-5 space-x-2 py-3">
              <Button
                onClick={() => {
                  updateShiftModal.open();
                }}
                size="sm"
                className="gap-3 border-blue-500 hover:text-blue-500 rounded-full- text-blue-500 underline-"
                variant="outline"
              >
                <span>Update Shift</span>
              </Button>
              <Button
                onClick={() => {
                  confirmModal.setisOpen(true);
                }}
                size="sm"
                className="gap-3 border-red-500 hover:text-red-500 rounded-full0 text-red-500 underline-"
                variant="outline"
              >
                <span>Delete Shift</span>
              </Button>
            </div>
          ) : undefined}
        </div>
        <div className="border-b px-5  border-dashed">
          <h4>
            <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
              Shift Summary
            </span>
          </h4>
          <div className="grid gap-4  pb-3 grid-cols-2 sm:grid-cols-6">
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
        <div className="grid gap-4 px-4 grid-cols-7">
          <div className="col-span-5">
            <>
              <div className="px-5- pt-2 pb-0">
                <div className="flex items-center justify-between mb-2-">
                  <h4>
                    <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                      Reconsile payments
                    </span>
                  </h4>
                </div>
                <div className="border rounded-[3px] overflow-hidden- mb-3">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="text-left">
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Payment Method
                        </th>
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Amount
                        </th>

                        <th className="border-b text-right  font-semibold text-[13px] px-3 py-2">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((method, i) => {
                        return (
                          <tr key={i}>
                            <td className="border-b text-[13px] px-3- border-r py-[10px]-">
                              <div>
                                <>
                                  <AsyncSelectField
                                    className="!border-none"
                                    defaultOptions={true}
                                    value={method?.payment_method?.id}
                                    isDisabled={true}
                                    placeholder={"Choose payment method"}
                                    name={method?.type}
                                    onChange={(e) => {
                                      const new_payments = payments.map(
                                        (payment) => {
                                          if (payment?.id === method?.id) {
                                            return {
                                              ...payment,
                                              payment_method: e.original,
                                            };
                                          }
                                          return payment;
                                        }
                                      );
                                      setpayments(new_payments);
                                    }}
                                    loader={({ search }) => {
                                      return pocketbase
                                        .collection("payment_methods")
                                        .getFullList({
                                          filter: search
                                            ? `name~"${search}" || names~"${search}"`
                                            : "",
                                        })
                                        .then((e) =>
                                          e.map((e) => ({
                                            label: e.name || e.names,
                                            value: e.id,
                                            original: e,
                                          }))
                                        );
                                    }}
                                  />
                                </>
                              </div>
                            </td>
                            <td className="border-b relative text-[13px] border-r">
                              <input
                                type="text"
                                className="w-full bg-transparent h-full outline-none px-3"
                                placeholder=""
                                disabled={
                                  method?.type === "customer" && !method?.isNew
                                }
                                value={method?.amount}
                                onChange={(e) => {
                                  const new_payments = payments?.map(
                                    (payment) => {
                                      if (payment?.id === method?.id) {
                                        return {
                                          ...payment,
                                          amount: e.target.value,
                                        };
                                      }
                                      return payment;
                                    }
                                  );
                                  setpayments(new_payments);
                                }}
                              />
                              <span className="absolute right-3 top-2 text-[12px] font-medium text-slate-500">
                                FRW
                              </span>
                            </td>

                            <td className="border-b w-[80px]- text-right text-[13px] px-3 py-[10px]">
                              <div className="flex items-center justify-end gap-3-">
                                {!method?.isNew && (
                                  <Button
                                    onClick={() => {
                                      const new_payments = payments.map((e) => {
                                        if (e?.id === method?.id) {
                                          const original =
                                            data?.payment_methods?.find(
                                              (i) => i?.id === method?.id
                                            );
                                          console.log(original, "original");
                                          return original;
                                        }
                                        return e;
                                      });
                                      setpayments(new_payments);
                                    }}
                                    className="text-blue-500 !h-fit !px-0- !py-0"
                                    size="sm"
                                    variant="link"
                                  >
                                    Reset
                                  </Button>
                                )}
                                {/* <Button
                                  onClick={() => {
                                    const new_payments = payments.filter(
                                      (e) => e?.id !== method?.id
                                    );
                                    setpayments(new_payments);
                                  }}
                                  className="text-red-500 !h-fit !px-0- !py-0"
                                  size="sm"
                                  variant="link"
                                >
                                  Remove
                                </Button> */}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {!payments.length && (
                        <tr>
                          <td className="border-b- py-4 " colSpan={3}>
                            <div className="flex py-4 items-center justify-center">
                              <span className="text-[13px] text-slate-500 text-center">
                                No payment methods available
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {payments.length ? (
                        <tr>
                          <td className="text-sm px-3 border-r font-semibold py-[10px]">
                            Total
                          </td>
                          <td className=" text-sm font-semibold px-3 border-r py-[10px]">
                            <span>{total.toLocaleString()}</span>
                            <span> FRW</span>
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>

            <>
              <div className="px-5- pt-0 py-2">
                <div className="flex items-center justify-between mb-2-">
                  <h4>
                    <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                      Reconsile credits
                    </span>
                  </h4>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <a className="flex cursor-pointer hover:underline items-center gap-2 font-medium text-[13.5px] text-primary">
                        <PlusCircle size={15} className="text-primary" />
                        Add new credit
                      </a>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={() => {
                            setcredits([
                              ...credits,
                              {
                                id: uuidv4(),
                                employee: undefined,
                                type: "employee",
                                amount: 0,
                                isNew: true,
                                notes: "",
                              },
                            ]);
                          }}
                          className="cursor-pointer"
                        >
                          Employee Credit
                          <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setcredits([
                              ...credits,
                              {
                                id: uuidv4(),
                                customer: undefined,
                                type: "customer",
                                amount: 0,
                                isNew: true,
                                notes: "",
                              },
                            ]);
                          }}
                          className="cursor-pointer"
                        >
                          Customer Credit
                          <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="border rounded-[3px] overflow-hidden- mb-3">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="text-left">
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Customer / Employee
                        </th>
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Amount
                        </th>
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Notes
                        </th>
                        <th className="border-b text-right  font-semibold text-[13px] px-3 py-2">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {credits
                        .filter((e) => !e.isDeleted)
                        .map((credit, i) => {
                          return (
                            <tr key={i}>
                              <td className="border-b text-[13px] px-3- border-r py-[10px]-">
                                <div>
                                  <>
                                    <AsyncSelectField
                                      className="!border-none"
                                      defaultOptions={true}
                                      value={credit?.[credit.type]?.id}
                                      // isDisabled={!credit?.isNew}
                                      placeholder={
                                        credit.type === "customer"
                                          ? "Choose customer"
                                          : credit.type === "employee"
                                          ? "Choose employee"
                                          : ""
                                      }
                                      name={credit?.type}
                                      onChange={(e) => {
                                        const new_credits = credits.map(
                                          (existing) => {
                                            if (existing?.id === credit?.id) {
                                              return {
                                                ...existing,
                                                [credit.type]: e.original,
                                              };
                                            }
                                            return existing;
                                          }
                                        );
                                        setcredits(new_credits);
                                      }}
                                      loader={({ search }) => {
                                        return pocketbase
                                          .collection(
                                            credit.type === "customer"
                                              ? "customers"
                                              : credit.type === "employee"
                                              ? "users"
                                              : ""
                                          )
                                          .getFullList({
                                            filter: search
                                              ? `name~"${search}" || name~"${search}" `
                                              : "",
                                          })
                                          .then((e) =>
                                            e.map((e) => ({
                                              label: e.name || e.names,
                                              value: e.id,
                                              original: e,
                                            }))
                                          );
                                      }}
                                    />
                                  </>
                                </div>
                              </td>
                              <td className="border-b relative text-[13px] border-r">
                                <input
                                  type="number"
                                  className="w-full bg-transparent h-full outline-none px-3"
                                  placeholder=""
                                  // disabled={
                                  //   credit?.type === "customer" && !credit?.isNew
                                  // }
                                  value={credit?.amount}
                                  onChange={(e) => {
                                    const new_credits = credits?.map(
                                      (existing) => {
                                        if (existing?.id === credit?.id) {
                                          return {
                                            ...existing,
                                            amount: e.target.value,
                                          };
                                        }
                                        return existing;
                                      }
                                    );
                                    setcredits(new_credits);
                                  }}
                                />
                                <span className="absolute right-3 top-2 text-[12px] font-medium text-slate-500">
                                  FRW
                                </span>
                              </td>
                              <td className="border-b relative text-[13px] border-r">
                                <input
                                  type="text"
                                  className="w-full bg-transparent h-full outline-none px-3"
                                  placeholder="Add Notes"
                                  value={credit?.notes}
                                  onChange={(e) => {
                                    const new_credits = credits?.map(
                                      (existing) => {
                                        if (existing?.id === credit?.id) {
                                          return {
                                            ...existing,
                                            notes: e.target.value,
                                          };
                                        }
                                        return existing;
                                      }
                                    );
                                    setcredits(new_credits);
                                  }}
                                />
                              </td>
                              <td className="border-b w-[80px] text-right text-[13px] px-3 py-[10px]">
                                <div className="flex items-center justify-end gap-3">
                                  {!credit?.isNew && (
                                    <Button
                                      onClick={() => {
                                        const new_credits = credits.map((e) => {
                                          if (e?.id === credit?.id) {
                                            const original =
                                              data?.credits?.find(
                                                (i) => i?.id === credit?.id
                                              );
                                            return original;
                                          }
                                          return e;
                                        });
                                        setcredits(new_credits);
                                      }}
                                      className="text-blue-500 !h-fit !px-0- !py-0"
                                      size="sm"
                                      variant="link"
                                    >
                                      Reset
                                    </Button>
                                  )}
                                  <Button
                                    onClick={() => {
                                      const new_credits = credits.map((e) => {
                                        if (e?.id === credit?.id) {
                                          return { ...e, isDeleted: true };
                                        }
                                        return e;
                                      });
                                      setcredits(new_credits);
                                    }}
                                    className="text-red-500 !h-fit !px-0 !py-0"
                                    size="sm"
                                    variant="link"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                      {!credits.filter((e) => !e.isDeleted).length && (
                        <tr>
                          <td className="border-b- py-4 " colSpan={3}>
                            <div className="flex py-4 items-center justify-center">
                              <span className="text-[13px] text-slate-500 text-center">
                                No credits available
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {credits.filter((e) => !e.isDeleted).length ? (
                        <tr>
                          <td className="text-sm px-3 border-r font-semibold py-[10px]">
                            Total
                          </td>
                          <td className=" text-sm font-semibold px-3 border-r py-[10px]">
                            <span>{total_credits.toLocaleString()}</span>
                            <span> FRW</span>
                          </td>
                          <td className="font-semibold text-right border-r  text-sm px-3 py-[10px]"></td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>

            <>
              <div className="px-5- pt-0 py-2">
                <div className="flex items-center justify-between mb-2-">
                  <h4>
                    <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                      Reconsile Allowance
                    </span>
                  </h4>

                  <a
                    onClick={() => {
                      setallowances([
                        ...allowances,
                        {
                          id: uuidv4(),
                          amount: 0,
                          isNew: true,
                        },
                      ]);
                    }}
                    className="flex cursor-pointer hover:underline items-center gap-2 font-medium text-[13.5px] text-primary"
                  >
                    <PlusCircle size={15} className="text-primary" />
                    Add new Allowance
                  </a>
                </div>
                <div className="border rounded-[3px] overflow-hidden- mb-3">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="text-left">
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Employee
                        </th>
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Amount
                        </th>
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Limit
                        </th>
                        <th className="border-b text-right  font-semibold text-[13px] px-3 py-2">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allowances
                        .filter((e) => !e.isDeleted)
                        .map((allowance, i) => {
                          return (
                            <tr key={i}>
                              <td className="border-b text-[13px] px-3- border-r py-[10px]-">
                                <div>
                                  <>
                                    <AsyncSelectField
                                      className="!border-none"
                                      defaultOptions={true}
                                      value={allowance?.employee?.id}
                                      placeholder={"Choose employee"}
                                      name={"employees-for-allowances"}
                                      onChange={(e) => {
                                        const newAllowances = allowances.map(
                                          (existing) => {
                                            if (
                                              existing?.id === allowance?.id
                                            ) {
                                              return {
                                                ...existing,
                                                employee: e.original,
                                              };
                                            }
                                            return existing;
                                          }
                                        );
                                        setallowances(newAllowances);
                                      }}
                                      loader={({ search }) => {
                                        return pocketbase
                                          .collection("users")
                                          .getFullList({
                                            filter: search
                                              ? `name~"${search}"`
                                              : "",
                                            expand: "role",
                                          })
                                          .then((e) =>
                                            e.map((e) => ({
                                              label: e.name || e.names,
                                              value: e.id,
                                              original: e,
                                            }))
                                          );
                                      }}
                                    />
                                  </>
                                </div>
                              </td>
                              <td className="border-b relative text-[13px] border-r">
                                <input
                                  type="number"
                                  className={cn(
                                    "w-full bg-transparent h-full outline-none px-3",
                                    {
                                      "text-red-500 border-red-500":
                                        allowance?.amount >
                                        (allowance?.employee?.expand?.role
                                          ?.daily_allowance || allowance.limit),
                                    }
                                  )}
                                  placeholder=""
                                  // disabled={
                                  //   credit?.type === "customer" && !credit?.isNew
                                  // }
                                  value={allowance?.amount}
                                  onChange={(e) => {
                                    if (
                                      e.target.value >
                                      (allowance?.employee?.expand?.role
                                        ?.daily_allowance || allowance.limit)
                                    )
                                      return;

                                    const newAllowances = allowances?.map(
                                      (existing) => {
                                        if (existing?.id === allowance?.id) {
                                          return {
                                            ...existing,
                                            amount: e.target.value,
                                          };
                                        }
                                        return existing;
                                      }
                                    );
                                    setallowances(newAllowances);
                                  }}
                                />
                                <span className="absolute right-3 top-2 text-[12px] font-medium text-slate-500">
                                  FRW
                                </span>
                              </td>
                              <td className="border-b px-3 relative text-[13px] border-r">
                                {Number(
                                  allowance?.employee?.expand?.role
                                    ?.daily_allowance ||
                                    allowance.limit ||
                                    0
                                ).toLocaleString()}{" "}
                                FRW
                              </td>
                              <td className="border-b w-[80px] text-right text-[13px] px-3 py-[10px]">
                                <div className="flex items-center justify-end gap-3">
                                  <Button
                                    onClick={() => {
                                      const newAllowances = allowances.map(
                                        (e) => {
                                          if (e?.id === allowance?.id) {
                                            return { ...e, isDeleted: true };
                                          }
                                          return e;
                                        }
                                      );
                                      setallowances(newAllowances);
                                    }}
                                    className="text-red-500 !h-fit !px-0 !py-0"
                                    size="sm"
                                    variant="link"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                      {!allowances.filter((e) => !e.isDeleted).length && (
                        <tr>
                          <td className="border-b- py-4" colSpan={4}>
                            <div className="flex py-4 items-center justify-center">
                              <span className="text-[13px] text-slate-500 text-center">
                                No Allowances available
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {allowances.filter((e) => !e.isDeleted).length ? (
                        <tr>
                          <td className="text-sm px-3 border-r font-semibold py-[10px]">
                            Total
                          </td>
                          <td className=" text-sm font-semibold px-3 border-r py-[10px]">
                            <span>{total_allowances.toLocaleString()}</span>
                            <span> FRW</span>
                          </td>
                          <td className="font-semibold text-right border-r  text-sm px-3 py-[10px]"></td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>

            <>
              <div className="px-5- pt-0 py-2">
                <div className="flex items-center justify-between mb-2-">
                  <h4>
                    <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                      Cancelations
                    </span>
                  </h4>

                  <a
                    onClick={() => {
                      setCancelations([
                        ...cancelations,
                        {
                          id: uuidv4(),
                          item: undefined,
                          isNew: true,
                          comment: "",
                        },
                      ]);
                    }}
                    className="flex cursor-pointer hover:underline items-center gap-2 font-medium text-[13.5px] text-primary"
                  >
                    <PlusCircle size={15} className="text-primary" />
                    Add new Cancelation
                  </a>
                </div>
                <div className="border rounded-[3px] overflow-x-auto- mb-3">
                  <table className="w-full w-[1500px]-  table-fixed  overflow-x-auto">
                    <thead>
                      <tr className="text-left">
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Order
                        </th>
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Item
                        </th>
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Quantity
                        </th>
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Total Price
                        </th>
                        <th className="border-b border-r font-semibold text-[13px] px-3 py-2">
                          Comment
                        </th>
                        <th className="border-b text-right w-[60px] font-semibold text-[13px] px-3 py-2">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelations
                        .filter((e) => !e.isDeleted)
                        .map((cancel, i) => {
                          return (
                            <tr key={i}>
                              <td className="border-b text-[13px] px-3- border-r py-[10px]-">
                                <div>
                                  <>
                                    <AsyncSelectField
                                      className="!border-none"
                                      defaultOptions={true}
                                      value={cancel?.order?.id}
                                      placeholder={"Choose order"}
                                      name={"orders-made"}
                                      onChange={(e) => {
                                        const newCancellations =
                                          cancelations.map((existing) => {
                                            if (existing?.id === cancel?.id) {
                                              return {
                                                ...existing,
                                                order: {
                                                  id: e.original.id,
                                                  code: e.original.code,
                                                },
                                              };
                                            }
                                            return existing;
                                          });
                                        setCancelations(newCancellations);
                                      }}
                                      loader={({ search }) => {
                                        return pocketbase
                                          .collection("orders")
                                          .getFullList({
                                            filter: [
                                              search ? `code~"${search}"` : "",
                                              `work_shift="${shiftId}"`,
                                            ]
                                              .filter((e) => e)
                                              .join(" && "),
                                          })
                                          .then((e) =>
                                            e.map((e) => ({
                                              label: e?.code,
                                              value: e?.id,
                                              original: e,
                                            }))
                                          );
                                      }}
                                    />
                                  </>
                                </div>
                              </td>
                              <td className="border-b text-[13px] px-3- border-r py-[10px]-">
                                <div>
                                  <>
                                    <AsyncSelectField
                                      className="!border-none"
                                      defaultOptions={true}
                                      value={cancel?.item?.id}
                                      placeholder={"Choose item"}
                                      name={`menu-items-${cancel?.order?.id}`}
                                      isDisabled={!cancel?.order}
                                      onChange={(e) => {
                                        const newCancellations =
                                          cancelations.map((existing) => {
                                            if (existing?.id === cancel?.id) {
                                              return {
                                                ...existing,
                                                item: e.original,
                                                quantity: e?.original?.quantity,
                                                amount: e?.original?.amount,
                                              };
                                            }
                                            return existing;
                                          });
                                        setCancelations(newCancellations);
                                      }}
                                      loader={({ search }) => {
                                        console.log(
                                          [
                                            search ? `name~"${search}"` : "",
                                            `order="${cancel?.order?.id}"`,
                                            `(status="pending" || status="completed")`,
                                          ]
                                            .filter((e) => e)
                                            .join(" && ")
                                        );
                                        return pocketbase
                                          .collection("order_items")
                                          .getFullList({
                                            filter: [
                                              search
                                                ? `menu.name~"${search}"`
                                                : "",
                                              `order="${cancel?.order?.id}"`,
                                              `(status="pending" || status="completed")`,
                                            ]
                                              .filter((e) => e)
                                              .join(" && "),
                                            expand: "menu",
                                          })
                                          .then((e) =>
                                            e.map((e) => ({
                                              label: e?.expand?.menu?.name,
                                              value: e.id,
                                              original: e,
                                            }))
                                          );
                                      }}
                                    />
                                  </>
                                </div>
                              </td>
                              <td className="border-b px-3 relative text-[13px] border-r">
                                <input
                                  disabled={!cancel?.order}
                                  type="number"
                                  onChange={(e) => {
                                    const newCancellations = cancelations.map(
                                      (existing) => {
                                        if (existing?.id === cancel?.id) {
                                          return {
                                            ...existing,
                                            quantity: Number(e?.target?.value),
                                            amount:
                                              (existing.item.amount /
                                                existing.item.quantity) *
                                              Number(e?.target?.value || 0),
                                          };
                                        }
                                        return existing;
                                      }
                                    );

                                    setCancelations(newCancellations);
                                  }}
                                  value={cancel?.quantity?.toString()}
                                />
                              </td>
                              <td className="border-b px-3 relative text-[13px] border-r">
                                {cancel?.amount || 0} FRW
                              </td>
                              <td className="border-b px-3- relative text-[13px] border-r">
                                <textarea
                                  className="w-full px-2 h-full"
                                  placeholder="Add comment"
                                  onChange={(e) => {
                                    const newCancellations = cancelations.map(
                                      (existing) => {
                                        if (existing?.id === cancel?.id) {
                                          return {
                                            ...existing,
                                            comment: e.target.value,
                                          };
                                        }
                                        return existing;
                                      }
                                    );
                                    setCancelations(newCancellations);
                                  }}
                                  value={cancel?.comment}
                                ></textarea>
                              </td>
                              <td className="border-b w-[80px] text-right text-[13px] px-3 py-[10px]">
                                <div className="flex items-center justify-end gap-3">
                                  <Button
                                    onClick={() => {
                                      const newCan = cancelations.map((e) => {
                                        if (e?.id === cancel?.id) {
                                          return { ...e, isDeleted: true };
                                        }
                                        return e;
                                      });
                                      setCancelations(newCan);
                                    }}
                                    className="text-red-500 !h-fit !px-0 !py-0"
                                    size="sm"
                                    variant="link"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                      {!cancelations.filter((e) => !e.isDeleted).length && (
                        <tr>
                          <td className="border-b- py-4" colSpan={6}>
                            <div className="flex py-4 items-center justify-center">
                              <span className="text-[13px] text-slate-500 text-center">
                                No Allowances available
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {cancelations.filter((e) => !e.isDeleted).length ? (
                        <tr>
                          <td className="text-sm px-3 border-r font-semibold py-[10px]">
                            Total
                          </td>
                          <td className=" text-sm font-semibold px-3 border-r py-[10px]"></td>
                          <td className=" text-sm font-semibold px-3 border-r py-[10px]">
                            {cancelations
                              .filter((e) => !e.isDeleted)
                              .reduce(
                                (a, b) => a + Number(b?.quantity || 0),
                                0
                              )}
                          </td>
                          <td className=" text-sm font-semibold px-3 border-r py-[10px]">
                            <span>
                              {cancelations
                                .filter((e) => !e.isDeleted)
                                .reduce(
                                  (a, b) => a + Number(b?.amount || 0),
                                  0
                                )}
                            </span>
                            <span> FRW</span>
                          </td>
                          <td className="font-semibold text-right border-r  text-sm px-3 py-[10px]"></td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
            <div className="px-2- w-full pb-4 mt-3-">
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
          </div>
          <div className="col-span-2">
            <div className="pb-4 px-5-">
              <h4 className="py-2">
                <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                  Summary
                </span>
              </h4>
              <div className="max-w-xl py-0 ml-auto flex flex-col justify-end items-end space-y-3">
                <div className="max-w-sm bg-slate-200- w-full space-y-5 pb-4 ml-auto px-5-">
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
                    <h4 className="text-sm font-medium">Total Discounts</h4>
                    <span className="text-sm font-medium">
                      <span>-{total_discounts?.toLocaleString()}</span>
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
                    <h4 className="text-sm font-medium">Total Cancellation</h4>
                    <span className="text-sm font-medium">
                      <span>{total_cancelations.toLocaleString()}</span>
                      <span> FRW</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      Total remaining/balance
                    </h4>
                    <span className="text-sm font-medium">
                      <span>
                        {grand_total - data?.gross_sales > 0 ? "+" : ""}
                      </span>
                      <span>
                        {(grand_total || 0) - (data?.gross_sales || 0)}
                      </span>
                      <span> FRW</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Grand total</h4>
                    <span className="text-sm text-primary font-medium">
                      <span>{grand_total?.toLocaleString()}</span>
                      <span> FRW</span>
                    </span>
                  </div>
                </div>

                <div className="flex w-full items-center gap-2 ">
                  {!data?.report && (
                    <Button
                      disabled={data?.report}
                      onClick={() => {
                        setpayments(
                          data?.payment_methods || data.report?.payment_methods
                        );
                        setcredits(data?.credits || data.report?.credits);
                        setclosing_notes(data?.report?.cachier_closing_notes);
                        setallowances(
                          data?.allowances || data?.report?.allowances
                        );
                      }}
                      className="w-full !text-primary"
                      size="sm"
                      variant="secondary"
                    >
                      Reset report
                    </Button>
                  )}

                  {data?.report ? (
                    <>
                      {canPerform("update_work_period_shift_report") && (
                        <Button
                          disabled={
                            createOrUpdateWorkShiftReport?.isLoading ||
                            grand_total < data.gross_sales ||
                            hasExidingAllowance
                          }
                          onClick={() =>
                            createOrUpdateWorkShiftReport?.mutate()
                          }
                          className="w-full"
                          size="sm"
                        >
                          {createOrUpdateWorkShiftReport?.isLoading && (
                            <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                          )}
                          Update shift report
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      {canPerform("create_work_period_shift_report") && (
                        <Button
                          disabled={
                            createOrUpdateWorkShiftReport?.isLoading ||
                            !data ||
                            grand_total < data.gross_sales ||
                            hasExidingAllowance
                          }
                          onClick={() =>
                            createOrUpdateWorkShiftReport?.mutate()
                          }
                          className="w-full"
                          size="sm"
                        >
                          {createOrUpdateWorkShiftReport?.isLoading && (
                            <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                          )}
                          Save & confirm shift report
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NewWorkShiftModal
        open={updateShiftModal.isOpen}
        setOpen={updateShiftModal.setisOpen}
        record={data?.shift}
        onComplete={() => {
          refetch();
          updateShiftModal.setisOpen(false);
        }}
      />
      <ConfirmModal
        title={"Are you sure you want to delete?"}
        description={`Lorem ipsum dolor sit amet consectetur adipisicing elit. Excepturi, amet
        a! Nihil`}
        error={error}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isLoading}
        open={confirmModal.isOpen}
        onClose={() => confirmModal.close()}
      />
    </>
  );
}

export default CreateShiftReport;

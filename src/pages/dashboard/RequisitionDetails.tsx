import BreadCrumb from "@/components/breadcrumb";
import { Card } from "@/components/ui/card";
import pocketbase from "@/lib/pocketbase";
import { cn } from "@/utils";
import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import AppFormTextArea from "@/components/forms/AppFormTextArea";
import Loader from "@/components/icons/Loader";
import useModalState from "@/hooks/useModalState";
import { PlusCircle } from "react-feather";
import { useAuth } from "@/context/auth.context";
import { useRoles } from "@/context/roles.context";

export default function RequisitionDetails() {
  const { requisitionId } = useParams();

  const { data: data, refetch }: any = useQuery({
    queryKey: ["dashboard", "requisition-details", requisitionId],
    queryFn: async () => {
      const requisition = await pocketbase
        .collection("requisitions")
        .getOne(requisitionId, {
          expand:
            "items,requested_by,department,items.item,items.item.unit,items.supplier,approved_by,items.item.menu",
        });

      const total = requisition?.expand?.items?.reduce((acc, item) => {
        return acc + item?.cost * item?.quantity;
      }, 0);

      return {
        total,
        ...requisition,
        items: requisition?.expand?.items,
      };
    },
    enabled: !!requisitionId,
  });

  const report_status = useMemo(
    () => [
      {
        name: "requisition_date",
        title: "Requisition date",
        value: data?.created
          ? new Date(data?.created).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "N.A",
      },
      {
        name: "requested_by",
        title: "Requested by",
        value: data?.expand?.requested_by?.name || "N.A",
      },
      {
        name: "department",
        title: "Department",
        value: data?.expand?.department?.name || "N.A",
      },
      {
        name: "total",
        title: "Total",
        value: data?.total ? data?.total.toLocaleString() + " FRW" : "N.A",
      },
      // total items
      {
        name: "total_items",
        title: "Total items",
        value: data?.items?.length || 0,
      },
      // aproved by
      {
        name: "approved_by",
        title: "Approved by",
        hidden: !data?.expand?.approved_by,
        value: data?.expand?.approved_by?.name || "N.A",
      },
      // rejected by
      {
        name: "rejected_by",
        title: "Rejected by",
        hidden: !data?.expand?.rejected_by,
        value: data?.expand?.rejected_by?.name || "N.A",
      },
      // Status
      {
        name: "status",
        title: "Status",
        hidden: !data?.status,
        value: data?.status || "N.A",
      },
    ],
    [data]
  );

  const [selected, setSelected] = useState("Requisition Items");

  const approveModal = useModalState();

  const rejectModal = useModalState();

  const navigate = useNavigate();

  const { canPerform } = useRoles();

  return (
    <>
      <div className="px-3">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Requisitions
            </h2>
            <BreadCrumb
              items={[
                {
                  title: "Requisitions",
                  link: `/dashboard/inventory/requisitions`,
                },
                { title: "Details", link: "/dashboard" },
              ]}
            />
          </div>
        </div>
        <Card className="rounded-[4px] px-4 pt-2 mb-3 shadow-none">
          <div className="border-b- pb-2  border-dashed">
            <h4>
              <span className="py-2 uppercase text-[12px] mb-1 block font-medium text-slate-500">
                Requisition details
              </span>
            </h4>
            <div className="grid gap-4  pb-3 grid-cols-2 sm:grid-cols-5">
              {report_status
                .filter((e) => {
                  return !e.hidden;
                })
                .map((status, i) => (
                  <div key={i}>
                    <h1 className="px-2- py-1 text-base sm:text-[16px] font-semibold capitalize">
                      {status.value}
                    </h1>
                    <div className="px-2- py-1 text-sm text-slate-500">
                      {status.title}
                    </div>
                  </div>
                ))}
            </div>
            {data?.notes && (
              <div>
                <div>
                  <h1 className="px-2- py-1 text-base sm:text-[14px] font-semibold capitalize">
                    Notes
                  </h1>
                  <div className="px-2- py-1 text-sm text-slate-500">
                    {data.notes || "N.A"}
                  </div>
                </div>
              </div>
            )}
            {data?.reject_reason && (
              <div>
                <div>
                  <h1 className="px-2- py-1 text-base sm:text-[14px] font-semibold capitalize">
                    Reject reason
                  </h1>
                  <div className="px-2- py-1 text-sm text-slate-500">
                    {data.reject_reason || "N.A"}
                  </div>
                </div>
              </div>
            )}

            {data?.approve_reason && (
              <div>
                <div>
                  <h1 className="px-2- py-1 text-base sm:text-[14px] font-semibold capitalize">
                    Approve reason
                  </h1>
                  <div className="px-2- py-1 text-sm text-slate-500">
                    {data.approve_reason || "N.A"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="border border-slate-200 bg-white rounded-[4px] overflow-hidden">
          <div className="w-full bg-white  border-b ">
            <div className="flex px-2 w-fit bg-white items-center justify-around">
              {[
                {
                  name: "Requisition Items",
                },
              ].map((e, i) => {
                return (
                  <a
                    key={i}
                    onClick={() => {
                      setSelected(e.name);
                    }}
                    className={cn(
                      "cursor-pointer px-8 capitalize text-center relative w-full- text-slate-700 text-[12.5px] sm:text-sm py-3  font-medium",
                      {
                        "text-primary ": selected === e.name,
                      }
                    )}
                  >
                    {selected === e.name && (
                      <div className="h-[3px] left-0 rounded-t-md bg-primary absolute bottom-0 w-full"></div>
                    )}
                    <span className=""> {e.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
          <div>
            {selected === "Requisition Items" && (
              <Items items={data?.items || []} />
            )}
          </div>
          {data?.status === "approved" && (
            <div className="flex p-4 pt-0 items-center gap-3">
              <Button
                onClick={() => {
                  navigate(`/dashboard/inventory/purchases/${data?.purchase}`);
                }}
                size="sm"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                View purchase.
              </Button>
            </div>
          )}
          {data?.status === "pending" &&
            canPerform("approve_reject_requisition") && (
              <div className="flex p-4 pt-0 items-center gap-3">
                <Button onClick={() => approveModal.open()} size="sm">
                  Approve Requisition
                </Button>
                <Button
                  onClick={() => rejectModal.open()}
                  size="sm"
                  variant="destructive"
                >
                  Reject Requisition
                </Button>
              </div>
            )}
        </div>
      </div>
      <ApproveModal
        open={approveModal.isOpen}
        setOpen={approveModal.setisOpen}
        requisition={data}
        onCompleted={() => {
          approveModal.setisOpen(false);
          refetch();
        }}
      />

      <RejectModal
        open={rejectModal.isOpen}
        setOpen={rejectModal.setisOpen}
        order={data}
        onCompleted={() => {
          rejectModal.setisOpen(false);
          refetch();
        }}
      />
    </>
  );
}

function Items({ items = [] }) {
  return (
    <div className="p-4">
      <Table className="border rounded-[4px]">
        <TableHeader>
          <TableRow className="bg-slate-100">
            <TableHead className="!h-10 text-[12px] font-medium uppercase">
              #
            </TableHead>
            <TableHead className="!h-10 text-[12px] font-medium uppercase">
              Name
            </TableHead>
            <TableHead className="!h-10 text-[12px] font-medium uppercase">
              Quantity
            </TableHead>
            <TableHead className="!h-10 text-[12px] font-medium uppercase">
              Cost
            </TableHead>
            <TableHead className="!h-10 text-[12px] font-medium uppercase">
              SubTotal
            </TableHead>
            <TableHead className="!h-10 text-[12px] font-medium uppercase">
              Supplier
            </TableHead>
            <TableHead className="!h-10 text-[12px] font-medium uppercase">
              Comment
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((e, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium w-[50px]">
                {index + 1}
              </TableCell>
              <TableCell className="font-medium capitalize">
                {e?.expand?.item?.name || e?.expand?.item?.expand?.menu?.name}
              </TableCell>
              <TableCell className="!h-11 flex items-center gap-[2px]">
                <div className="w-fit relative">{e?.quantity}</div>
              </TableCell>
              <TableCell className="!h-11">
                {(e?.cost || 0).toLocaleString()} FRW
              </TableCell>
              <TableCell className="!h-11">
                {((e?.cost || 0) * e?.quantity)?.toLocaleString()} FRW
              </TableCell>
              <TableCell className="!h-11">
                {e?.expand?.supplier?.names}
              </TableCell>
              <TableCell className="!h-11">{e?.comment || "N.A"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        {items.length !== 0 && (
          <TableFooter className="bg-slate-50">
            <TableRow>
              <TableCell colSpan={1}>Total</TableCell>
              <TableCell className="text-right"></TableCell>
              <TableCell>
                <span className="font-semibold gap-[2px] text-sm">
                  <span>x </span>
                  {items.reduce((acc, e) => {
                    return acc + e.quantity;
                  }, 0)}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-semibold text-[13px]">
                  {items
                    .reduce((acc, e) => {
                      return acc + Number(e.cost) || 0;
                    }, 0)
                    .toLocaleString()}{" "}
                  FRW
                </span>
              </TableCell>
              <TableCell>
                <span className="font-semibold text-[13px]">
                  {items
                    .reduce((acc, e) => {
                      return acc + Number(e.cost) * e.quantity || 0;
                    }, 0)
                    .toLocaleString()}{" "}
                  FRW
                </span>
              </TableCell>
              <TableCell colSpan={1}></TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}

function generateUniqueId() {
  return Math.floor(Math.random() * 1000000);
}

function ApproveModal({ open, setOpen, requisition, onCompleted }) {
  const formSchema = z.object({
    reason: z.string().min(1, { message: "Please enter a reason" }),
  });

  // const formSchema =
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  const { user } = useAuth();

  const navigate = useNavigate();

  const onSubmit = async (values) => {
    const requisitionItems = requisition?.expand?.items.map(({ id, ...e }) => {
      return e;
    });

    const purchase = await pocketbase.collection("purchases").create({
      created_by: user.id,
      payment_status: "unpaid",
      status: "pending",
      stock: requisition?.stock,
      invoice_number: generateUniqueId(),
      requisition: requisition.id,
      items: [],
    });

    const purchaseItems = await Promise.all(
      requisitionItems?.map((e: any) => {
        return pocketbase
          .autoCancellation(false)
          .collection("purchase_items")
          .create({
            ...e,
            item: e?.expand?.item?.id,
            status: "pending",
            purchase: purchase.id,
          });
      })
    );

    await pocketbase.collection("purchases").update(purchase.id, {
      items: purchaseItems.map((e: any) => e.id).filter((e) => e),
    });

    return pocketbase
      .collection("requisitions")
      .update(requisition.id, {
        status: "approved",
        approve_reason: values?.reason,
        purchase: purchase.id,
        approved_by: user.id,
      })
      .then(() => {
        setOpen(false);
        toast.success(`requisitions approved succesfully`);
        navigate(`/dashboard/inventory/purchases/${purchase?.id}`);
        onCompleted();
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-1 font-semibold py-2">
              Approve Requisistion
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-1 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to approve requisistion.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div>
                <AppFormTextArea
                  form={form}
                  label={"Enter a reason"}
                  placeholder={"Enter reason"}
                  name={"reason"}
                />
              </div>
            </div>
            <DialogFooter>
              <div className="mt-6 flex items-center gap-2 px-2 pb-1">
                <Button
                  type="submit"
                  onClick={() => form.handleSubmit(onSubmit)}
                  disabled={
                    form.formState.disabled || form.formState.isSubmitting
                  }
                  className="w-full"
                  size="sm"
                >
                  {form.formState.isSubmitting && (
                    <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                  )}
                  Approve Requisition.
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function RejectModal({ open, setOpen, order, onCompleted }) {
  const formSchema = z.object({
    reason: z.string().min(1, { message: "Please enter a reason" }),
  });

  // const formSchema =
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  const { user } = useAuth();

  const onSubmit = (values) => {
    return pocketbase
      .collection("requisitions")
      .update(order.id, {
        status: "rejected",
        reject_reason: values?.reason,
        rejected_by: user?.id,
      })
      .then(() => {
        setOpen(false);
        toast.success(`requisitions approved succesfully`);
        onCompleted();
        form.reset();
      })
      .catch((e) => {
        toast.error(e.message);
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-base px-1 font-semibold py-2">
              Reject Requisistion
            </span>
          </DialogTitle>
          <DialogDescription>
            <span className="px-1 py-0 text-sm text-slate-500 leading-7">
              Fill in the fields to reject requisistion.
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid px-2 gap-2">
              <div>
                <AppFormTextArea
                  form={form}
                  label={"Enter a reason"}
                  placeholder={"Enter reason"}
                  name={"reason"}
                />
              </div>
            </div>
            <DialogFooter>
              <div className="mt-6 flex items-center gap-2 px-2 pb-1">
                <Button
                  type="submit"
                  onClick={() => form.handleSubmit(onSubmit)}
                  disabled={
                    form.formState.disabled || form.formState.isSubmitting
                  }
                  className="w-full"
                  size="sm"
                >
                  {form.formState.isSubmitting && (
                    <Loader className="mr-2 h-4 w-4 text-white animate-spin" />
                  )}
                  Reject Requisition.
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

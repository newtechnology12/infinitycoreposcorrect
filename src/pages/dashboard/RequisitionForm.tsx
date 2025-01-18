import BreadCrumb from "@/components/breadcrumb";
import AppFormAsyncSelect from "@/components/forms/AppFormAsyncSelect";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import pocketbase from "@/lib/pocketbase";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, PlusCircle } from "react-feather";
import { useForm, useWatch } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppFormTextArea from "@/components/forms/AppFormTextArea";
import useModalState from "@/hooks/useModalState";
import { useQuery } from "react-query";
import { Trash } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/utils";
import AppFileUpload from "@/components/forms/AppFileUpload";
import { useAuth } from "@/context/auth.context";
import { toast } from "sonner";
import { RawItemsModal } from "@/components/modals/RawItemsModal";

function generateUniqueId() {
  return Math.floor(Math.random() * 1000000);
}

const formSchema = z.object({
  attachment: z.any().optional(),
  items: z.array(z.any()),
  notes: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  stock: z.string().min(1, "Stock is required"),
  requested_by: z.string().min(1, "Requested by is required"),
});

export default function RequisitionForm() {
  // get the requisition id from the url
  const { requisitionId } = useParams();

  const navigate = useNavigate();

  const { data: requisition, refetch } = useQuery({
    queryKey: ["dashboard", "requisitions", requisitionId],
    queryFn: async () => {
      const requisition = await pocketbase
        .collection("requisitions")
        .getOne(requisitionId, {
          expand:
            "items,items.menu_item,items.ingredient,items.ingredient.unit,stock,stock_item,stock_item.ingredient,stock_item.menu_item,payments",
        });
      return requisition;
    },
    enabled: !!requisitionId,
  });
  const { user } = useAuth();

  const values = useMemo(() => {
    return {
      department: requisition?.department || "",
      requested_by: user?.id || "",
      attachment: requisition?.attachment || "",
      items: requisition?.items || [],
      notes: requisition?.notes || "",
      stock: requisition?.stock || "",
    };
  }, [requisition, user]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: values,
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
    };

    const q = !requisition
      ? pocketbase.collection("requisitions").create({
          ...data,
          created_by: user.id,
          status: "pending",
          items: [],
        })
      : pocketbase.collection("requisitions").update(requisition.id, data);

    return q
      .then(async (requisition) => {
        const newItems = await Promise.all(
          items.map((e: any) => {
            return e.id && e.isDeleted
              ? pocketbase
                  .autoCancellation(false)
                  .collection("requisition_items")
                  .delete(e.id)
              : e.id
              ? pocketbase
                  .autoCancellation(false)
                  .collection("requisition_items")
                  .update(e.id, {
                    ...e,
                  })
              : pocketbase
                  .autoCancellation(false)
                  .collection("requisition_items")
                  .create({
                    ...e,
                    requisition: requisition.id,
                    item: e.item.id,
                    code: generateUniqueId(),
                  });
          })
        );

        return pocketbase
          .collection("requisitions")
          .update(requisition.id, {
            items: newItems.map((e: any) => e.id),
          })
          .then(() => {
            toast.error("Requisition saved succesfully");
            form.reset();
            refetch();
            navigate(`/dashboard/inventory/requisitions`);
          });
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function employeesLoader({ search }) {
    return pocketbase
      .collection("users")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  function departmentsLoader({ search }) {
    return pocketbase
      .collection("departments")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  function stocksLoader({ search }) {
    return pocketbase
      .collection("stocks")
      .getFullList({
        filter: [search ? `name~"${search}"` : "", `is_main=true`]
          .filter((e) => e)
          .join("&&"),
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  const stockItemsModal = useModalState();

  const items = useWatch({
    control: form.control,
    name: "items",
  });

  const grand_total = items.reduce((acc, e) => {
    return acc + e.cost * e.quantity;
  }, 0);

  // supplier query
  const { data: suppliers } = useQuery({
    queryKey: ["dashboard", "suppliers"],
    queryFn: async () => {
      return pocketbase.collection("suppliers").getFullList();
    },
  });

  return (
    <>
      <div className="px-3">
        <div className="flex items-start justify-between space-y-2 mb-3">
          <div className="flex items-start gap-2 flex-col">
            <h2 className="text-base font-semibold tracking-tight">
              Create a new requisition
            </h2>
            <BreadCrumb
              items={[{ title: "Create new requisition", link: "/dashboard" }]}
            />
          </div>
        </div>
        <div className="bg-white border">
          <div className="flex- items-center justify-between">
            <div className="px-3 flex items-center justify-between py-3">
              <Button
                onClick={() => {
                  navigate("/dashboard/inventory/requisitions");
                }}
                size="sm"
                className="gap-3 rounded-full text-primary hover:underline"
                variant="secondary"
              >
                <ArrowLeft size={16} />
                <span>Go back to requisition</span>
              </Button>
            </div>
            <div>
              <div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="border-b border-dashed">
                      <div className="grid pb-3 px-4 max-w-5xl gap-2">
                        <div className="grid max-w-3xl gap-3 grid-cols-3">
                          <AppFormAsyncSelect
                            form={form}
                            label={"Requested by"}
                            placeholder={"Choose requested by"}
                            name={"requested_by"}
                            isDisabled={true}
                            loader={employeesLoader}
                          />
                          <AppFormAsyncSelect
                            form={form}
                            label={"Choose department"}
                            placeholder={"Choose department"}
                            name={"department"}
                            loader={departmentsLoader}
                          />
                          <AppFormAsyncSelect
                            form={form}
                            label={"Choose Stock"}
                            placeholder={"Choose Stock"}
                            name={"stock"}
                            loader={stocksLoader}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-3">
                      <div>
                        <h4 className="text-[12px] font-medium text-slate-500 uppercase">
                          Requistions items.
                        </h4>
                      </div>
                      <div className="py-2">
                        <div className="border ">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-100">
                                <TableHead className="!h-10">#</TableHead>
                                <TableHead className="!h-10">Name</TableHead>
                                <TableHead className="!h-10">
                                  Quantity
                                </TableHead>
                                <TableHead className="!h-10">Cost</TableHead>
                                <TableHead className="!h-10">
                                  SubTotal
                                </TableHead>

                                <TableHead className="!h-10">Comment</TableHead>
                                <TableHead className="!h-10">
                                  Supplier
                                </TableHead>
                                <TableHead className="text-right !h-10">
                                  Action
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items
                                .filter((e) => {
                                  return !e.isDeleted;
                                })
                                .map((e, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium w-[50px]">
                                      {index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium truncate capitalize">
                                      {e?.item?.name ||
                                        e?.item?.expand?.menu?.name}
                                    </TableCell>
                                    <TableCell className="!h-11">
                                      <div className="w-fit relative">
                                        <input
                                          type="number"
                                          className="px-3 py-1 border font-normal rounded-[3px]"
                                          placeholder="Quantity"
                                          value={e?.quantity}
                                          onChange={(event) =>
                                            form.setValue(
                                              "items",
                                              items.map((e: any, i) =>
                                                i === index
                                                  ? {
                                                      ...e,
                                                      quantity: event.target
                                                        .value
                                                        ? Number(
                                                            event.target.value
                                                          )
                                                        : null,
                                                    }
                                                  : e
                                              )
                                            )
                                          }
                                        />
                                        <span className="absolute capitalize right-3 top-1">
                                          {e?.item?.expand?.unit?.name}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="!h-11">
                                      <input
                                        type="number"
                                        className="px-3 py-1 border font-normal rounded-[3px]"
                                        placeholder="Quantity"
                                        value={e?.cost}
                                        onChange={(event) =>
                                          form.setValue(
                                            "items",
                                            items.map((e: any, i) =>
                                              i === index
                                                ? {
                                                    ...e,
                                                    cost: event.target.value
                                                      ? Number(
                                                          event.target.value
                                                        )
                                                      : null,
                                                  }
                                                : e
                                            )
                                          )
                                        }
                                      />
                                    </TableCell>

                                    <TableCell className="!h-11 truncate">
                                      {(
                                        (e?.cost || 0) * e?.quantity
                                      ).toLocaleString()}{" "}
                                      FRW
                                    </TableCell>
                                    <TableCell className="!h-11">
                                      <textarea
                                        className="px-3 py-1 border font-normal rounded-[3px]"
                                        placeholder="Quantity"
                                        value={e?.comment}
                                        onChange={(event) =>
                                          form.setValue(
                                            "items",
                                            items.map((e: any, i) =>
                                              i === index
                                                ? {
                                                    ...e,
                                                    comment: event.target.value,
                                                  }
                                                : e
                                            )
                                          )
                                        }
                                      ></textarea>
                                    </TableCell>
                                    <TableCell>
                                      <div className="w-[300px]-">
                                        <select
                                          className="py-2 text-slate-600 border"
                                          value={e?.supplier}
                                          onChange={(event) =>
                                            form.setValue(
                                              "items",
                                              items.map((e: any, i) =>
                                                i === index
                                                  ? {
                                                      ...e,
                                                      supplier:
                                                        event.target.value,
                                                    }
                                                  : e
                                              )
                                            )
                                          }
                                        >
                                          <option selected>
                                            Choose a supplier
                                          </option>
                                          {suppliers.map((e) => (
                                            <option key={e.id} value={e.id}>
                                              {e.names || e.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        type="button"
                                        onClick={() => {
                                          form.setValue(
                                            "items",
                                            items.map((e: any, i) =>
                                              i === index
                                                ? {
                                                    ...e,
                                                    isDeleted: true,
                                                  }
                                                : e
                                            )
                                          );
                                        }}
                                        size="sm"
                                        variant="destructive"
                                        className="!px-2 !h-7 "
                                      >
                                        <Trash size={14} className="" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              {!items.length ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={8}
                                    className="bg-yellow-50-"
                                  >
                                    <div className="flex py-6 justify-center items-center ">
                                      <div className="flex py-6 items-center justify-center gap- flex-col text-center">
                                        <img
                                          className="w-14"
                                          src="/images/packages.png"
                                          alt=""
                                        />
                                        <div className="space-y-2 max-w-xs mt-3">
                                          <h4 className="text-[14px] font-semibold">
                                            No items added yet.
                                          </h4>
                                          <p className="text-slate-500 font-normal leading-7 text-sm">
                                            Add items to the purchase, to keep
                                            track of the quantity.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                <></>
                              )}
                            </TableBody>
                            {items.length !== 0 && (
                              <TableFooter className="bg-slate-50">
                                <TableRow>
                                  <TableCell colSpan={1}>Total</TableCell>
                                  <TableCell className="text-right"></TableCell>
                                  <TableCell>
                                    <span className="font-semibold truncate text-sm">
                                      x
                                      {
                                        // quantity
                                        items.reduce((acc, e) => {
                                          return acc + e.quantity;
                                        }, 0)
                                      }
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-semibold truncate text-[13px]">
                                      {
                                        // total unit price
                                        items
                                          .reduce((acc, e) => {
                                            return acc + Number(e.cost) || 0;
                                          }, 0)
                                          .toLocaleString()
                                      }{" "}
                                      FRW
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-semibold truncate text-[13px]">
                                      {
                                        // total unit price
                                        items
                                          .reduce((acc, e) => {
                                            return (
                                              acc +
                                                Number(e.cost) * e.quantity || 0
                                            );
                                          }, 0)
                                          .toLocaleString()
                                      }{" "}
                                      FRW
                                    </span>
                                  </TableCell>
                                  <TableCell></TableCell>
                                  <TableCell></TableCell>
                                </TableRow>
                              </TableFooter>
                            )}
                          </Table>
                        </div>
                      </div>

                      <a
                        onClick={() => stockItemsModal.open()}
                        className={cn(
                          "border gap-3 text-slate-600 font-medium text-[13px] text-center justify-center hover:bg-slate-100 cursor-pointer border-dashed w-full flex items-center border-slate-300 rounded-[3px] py-2 px-3"
                        )}
                      >
                        <PlusCircle size={16} />
                        <span>Add Item from stock</span>
                      </a>
                      <div className="mt-3">
                        <div className="grid grid-cols-7 gap-3">
                          <div className="col-span-5">
                            <AppFormTextArea
                              form={form}
                              label={"Enter Requisition notes"}
                              placeholder={"Requisition notes"}
                              name={"notes"}
                            />
                            <div className="mt-3 max-w-sm">
                              <AppFileUpload
                                form={form}
                                label={"Upload an attachment"}
                                name={"attachment"}
                                preview={pocketbase.files.getUrl(
                                  requisition,
                                  requisition?.attachment
                                )}
                              />
                            </div>
                          </div>
                          <div className="col-span-2 mt-6">
                            <div className="space-y-3 py-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">
                                  Items Count.
                                </span>
                                <span>
                                  <span className="font-semibold text-[13px]">
                                    {
                                      // total unit price
                                      items.reduce((acc, e) => {
                                        return acc + e.quantity;
                                      }, 0)
                                    }
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span
                                  onClick={() => {
                                    console.log(form.formState.errors);
                                    console.log(form.getValues());
                                  }}
                                  className="text-sm text-slate-500"
                                >
                                  Grand Total
                                </span>
                                <span>
                                  <span className="font-semibold text-sm text-primary">
                                    {grand_total.toLocaleString()} FRW
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div>
                              <Button
                                type="submit"
                                onClick={form.handleSubmit(onSubmit)}
                                disabled={
                                  form.formState.disabled ||
                                  form.formState.isSubmitting ||
                                  !items.length
                                }
                                size="sm"
                                className="w-full"
                              >
                                <PlusCircle size={16} className="mr-2" />
                                {requisition
                                  ? "Update requisitions"
                                  : "Create requisitions"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <RawItemsModal
        open={stockItemsModal.isOpen}
        setOpen={stockItemsModal.setisOpen}
        onSelect={(raw_items) => {
          stockItemsModal.setisOpen(false);
          form.setValue("items", [
            ...items,
            ...raw_items.map((item) => {
              return {
                cost: 0,
                quantity: 1,
                item: item,
              };
            }),
          ]);
        }}
      />
    </>
  );
}

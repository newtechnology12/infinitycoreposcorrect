import BreadCrumb from "@/components/breadcrumb";
import AppFormAsyncSelect from "@/components/forms/AppFormAsyncSelect";
import AppFormField from "@/components/forms/AppFormField";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import pocketbase from "@/lib/pocketbase";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, PlusCircle } from "react-feather";
import { useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import { useQuery } from "react-query";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth.context";
import { toast } from "sonner";
import ConfirmModal from "@/components/modals/ConfirmModal";
import useConfirmModal from "@/hooks/useConfirmModal";
import AppFileUpload from "@/components/forms/AppFileUpload";
import { useDebounce } from "react-use";
import Loader from "@/components/icons/Loader";

const useQueryParams = () => {
  return new URLSearchParams(useLocation().search);
};

const formSchema = z.object({
  requisition: z.string().min(1, "Please choose a requisition"),
  stock: z.string().min(1, "Please choose a stock"),
  attachment: z.any().optional(),
  items: z.array(z.any()),
  notes: z.string().optional(),
});

export default function PurchaseForm() {
  // get the purchase id from the url
  const { purchaseId } = useParams();

  const navigate = useNavigate();

  const { user } = useAuth();

  const { data: purchase, refetch } = useQuery({
    queryKey: ["dashboard", "purchases", purchaseId],
    queryFn: async () => {
      const purchase = await pocketbase
        .collection("purchases")
        .getOne(purchaseId, {
          expand:
            "items,items.menu_item,items.ingredient,items.ingredient.unit,stock,stock_item,stock_item.ingredient,stock_item.menu_item,payments",
        });
      return purchase;
    },
    enabled: !!purchaseId,
  });

  const values = useMemo(() => {
    return {
      invoice_number: purchase?.invoice_number || "",
      purchase_date: purchase?.purchase_date || new Date(),
      stock: purchase?.stock || "",
      attachment: purchase?.attachment || "",
      status: purchase?.status,
      items:
        purchase?.expand?.items?.map((e) => {
          return {
            id: e.id,
            stock_item: e.stock_item,
            quantity: e.quantity,
            unit_price: e.unit_price,
            item: {
              type: e.ingredient
                ? "ingredient"
                : e?.menu_item
                ? "menu_item"
                : "",
              id: e.ingredient || e?.menu_item,
              stock: e.stock,
              name: e.expand?.ingredient?.name || e.expand?.menu_item?.name,
              unit: e.expand?.ingredient?.expand?.unit?.name,
            },
          };
        }) || [],
      notes: purchase?.notes || "",
    };
  }, [purchase]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: values,
  });

  function generateUniqueId() {
    return Math.floor(Math.random() * 1000000);
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const data = {
      ...values,
    };

    const q = !purchase
      ? pocketbase.collection("purchases").create({
          ...data,
          created_by: user.id,
          payment_status: "unpaid",
          status: "pending",
          stock: data?.stock,
          invoice_number: generateUniqueId(),
          items: [],
        })
      : pocketbase.collection("purchases").update(purchase.id, data);

    return q
      .then(async (purchase) => {
        const newItems = await Promise.all(
          purchaseItems.map((e: any) => {
            const q = e.id
              ? pocketbase
                  .autoCancellation(false)
                  .collection("purchase_items")
                  .update(e.id, {
                    ...e,
                    item: e?.expand?.item?.id,
                  })
              : pocketbase
                  .autoCancellation(false)
                  .collection("purchase_items")
                  .create({
                    ...e,
                    item: e?.expand?.item?.id,
                    purchase: purchase.id,
                  });

            return q;
          })
        );

        return pocketbase
          .collection("purchases")
          .update(purchase.id, {
            items: newItems.map((e: any) => e.id).filter((e) => e),
          })
          .then(() => {
            toast.error(
              q
                ? "purchase updated succesfully"
                : "purchase created succesfully"
            );
            form.reset();
            refetch();
            navigate(`/dashboard/inventory/purchases/${purchase.id}`);
          });
      })
      .catch((e) => {
        toast.error(e.message);
      });
  }

  function stocksLoader({ search }) {
    return pocketbase
      .collection("stocks")
      .getFullList({
        filter: search ? `name~"${search}"` : "",
      })
      .then((e) => e.map((e) => ({ label: e.names || e.name, value: e.id })));
  }

  const [debouncedReq, setDebouncedReq] = React.useState("");

  useDebounce(
    () => {
      setDebouncedReq(form.watch("requisition"));
    },
    700,
    [form.watch("requisition")]
  );

  const { data: requisition, isLoading }: any = useQuery({
    queryKey: ["new-purchase", "requisitions", debouncedReq],
    queryFn: async () => {
      const [requisition] = await pocketbase
        .collection("requisitions")
        .getFullList({
          expand: "items,requested_by,department,items.item,items.item.unit",
          filter: `code="${debouncedReq}" && status="approved"`,
        });

      if (requisition) {
        const total = requisition?.expand?.items?.reduce((acc, item) => {
          return acc + item?.cost * item?.quantity;
        }, 0);

        const itemsWithoutId = requisition?.expand?.items.map(
          ({ id, ...e }) => {
            return e;
          }
        );

        return {
          total,
          ...requisition,
          items: itemsWithoutId,
        };
      } else {
        toast.error("Requisition not found");
        return null;
      }
    },
    enabled: !!form.watch("requisition"),
  });

  const [purchaseItems, setPurchaseItems] = useState([]);

  useEffect(() => {
    if (requisition) {
      setPurchaseItems(
        requisition?.items.map((e) => {
          return {
            requested_quantity: e.quantity,
            requested_cost: e.cost,
            ...e,
          };
        })
      );
    } else {
      setPurchaseItems([]);
    }
  }, [requisition]);

  const grand_total = purchaseItems.reduce((acc, e) => {
    return acc + e.cost * e.quantity;
  }, 0);

  const query = useQueryParams();

  const requisitionId = query.get("requisitionId");

  useEffect(() => {
    if (requisitionId) {
      form.setValue("requisition", requisitionId);
    }
  }, [requisitionId]);

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
              Create a new purchase
            </h2>
            <BreadCrumb
              items={[{ title: "All Purchases", link: "/dashboard" }]}
            />
          </div>
        </div>
        <div className="bg-white border">
          <div className="flex- items-center justify-between">
            <div className="px-3 flex items-center justify-between py-3">
              <Button
                onClick={() => {
                  navigate("/dashboard/inventory/purchases");
                }}
                size="sm"
                className="gap-3 rounded-full text-primary hover:underline"
                variant="secondary"
              >
                <ArrowLeft size={16} />
                <span>Go back to purchases</span>
              </Button>
            </div>
            <div>
              <div>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="border-b border-dashed">
                      <div className="grid pb-3 px-4 max-w-5xl gap-2">
                        <div className="grid gap-3 grid-cols-4">
                          <AppFormField
                            form={form}
                            label={"Enter requisition number"}
                            placeholder={"Enter requisition number"}
                            name={"requisition"}
                            type="number"
                          />
                          <AppFormAsyncSelect
                            form={form}
                            label={"Choose stock"}
                            placeholder={"Choose stock"}
                            name={"stock"}
                            loader={stocksLoader}
                            isDisabled={purchase?.payments?.length}
                          />
                        </div>
                      </div>
                    </div>
                    {isLoading && (
                      <div className="w-full flex items-center justify-center h-[400px]">
                        <Loader className="h-5 w-5 text-primary animate-spin" />
                      </div>
                    )}
                    {requisition && (
                      <div className="px-5 py-3">
                        <div>
                          <h4 className="text-[12px] font-medium text-slate-500 uppercase">
                            Purchase items.
                          </h4>
                        </div>

                        <div className="py-2">
                          <div className="border ">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-100">
                                  <TableHead className="!h-10">#</TableHead>
                                  <TableHead className="!h-10 truncate">
                                    Name
                                  </TableHead>
                                  <TableHead className="!h-10 truncate">
                                    Quantity Requested.
                                  </TableHead>
                                  <TableHead className="truncate !h-10">
                                    Quantity Recieved.
                                  </TableHead>
                                  <TableHead className="truncate !h-10">
                                    Cost Requested.
                                  </TableHead>
                                  <TableHead className="truncate !h-10">
                                    Cost Recieved.
                                  </TableHead>
                                  <TableHead className="truncate !h-10">
                                    SubTotal
                                  </TableHead>
                                  <TableHead className="truncate !h-10">
                                    Supplier
                                  </TableHead>
                                  <TableHead className="truncate !h-10">
                                    Comment
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {purchaseItems.map((e, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium w-[50px]">
                                      {index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium truncate capitalize">
                                      {e?.expand?.item?.name ||
                                        e?.item?.expand?.menu?.name}
                                    </TableCell>
                                    <TableCell className="font-medium truncate capitalize">
                                      {e?.requested_quantity}
                                    </TableCell>
                                    <TableCell className="!h-11 truncate">
                                      <div className="w-fit relative">
                                        <input
                                          type="number"
                                          className="px-3 py-1 border font-normal rounded-[3px]"
                                          placeholder="Quantity"
                                          value={e?.quantity}
                                          onChange={(event) =>
                                            setPurchaseItems(
                                              purchaseItems.map((e: any, i) =>
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
                                          {e?.expand?.item?.expand?.unit?.name}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium truncate capitalize">
                                      {e?.requested_cost}
                                    </TableCell>
                                    <TableCell className="!h-11">
                                      <input
                                        type="number"
                                        className="px-3 py-1 border font-normal rounded-[3px]"
                                        placeholder="Quantity"
                                        value={e?.cost}
                                        onChange={(event) =>
                                          setPurchaseItems(
                                            purchaseItems.map((e: any, i) =>
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
                                    <TableCell className="!h-11">
                                      {
                                        // sub total
                                        e?.quantity * e?.cost
                                      }
                                    </TableCell>
                                    <TableCell>
                                      <div className="w-[300px]-">
                                        <select
                                          className="py-2 text-slate-600 border"
                                          value={e?.supplier}
                                          onChange={(event) =>
                                            setPurchaseItems(
                                              purchaseItems.map((e: any, i) =>
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
                                    <TableCell className="!h-11">
                                      <textarea
                                        className="px-3 py-1 border font-normal rounded-[3px]"
                                        placeholder="Comment"
                                        value={e?.comment}
                                        onChange={(event) =>
                                          setPurchaseItems(
                                            purchaseItems.map((e: any, i) =>
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
                                  </TableRow>
                                ))}
                              </TableBody>
                              {purchaseItems.length !== 0 && (
                                <TableFooter className="bg-slate-50">
                                  <TableRow>
                                    <TableCell colSpan={1}>Total</TableCell>
                                    <TableCell className="text-right"></TableCell>
                                    <TableCell>
                                      <span className="font-semibold truncate text-sm">
                                        x
                                        {
                                          // quantity
                                          purchaseItems.reduce((acc, e) => {
                                            return acc + e.requested_quantity;
                                          }, 0)
                                        }
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-semibold truncate text-sm">
                                        x
                                        {
                                          // quantity
                                          purchaseItems.reduce((acc, e) => {
                                            return acc + e.quantity;
                                          }, 0)
                                        }
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-semibold truncate text-[13px]">
                                        {purchaseItems
                                          .reduce((acc, e) => {
                                            return (
                                              acc + Number(e.requested_cost) ||
                                              0
                                            );
                                          }, 0)
                                          .toLocaleString()}{" "}
                                        FRW
                                      </span>
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-semibold truncate text-[13px]">
                                        {
                                          // total unit price
                                          purchaseItems
                                            .reduce((acc, e) => {
                                              return acc + Number(e.cost);
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
                                          purchaseItems
                                            .reduce((acc, e) => {
                                              return (
                                                acc +
                                                Number(e.cost) * e.quantity
                                              );
                                            }, 0)
                                            .toLocaleString()
                                        }{" "}
                                        FRW
                                      </span>
                                    </TableCell>
                                    <TableCell></TableCell>
                                  </TableRow>
                                </TableFooter>
                              )}
                            </Table>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="grid grid-cols-7 gap-3">
                            <div className="col-span-5">
                              <AppFormTextArea
                                form={form}
                                disabled={purchase?.payments?.length}
                                label={"Enter Purchase notes"}
                                placeholder={"Purchase notes"}
                                name={"notes"}
                              />
                              <div className="mt-3 max-w-sm">
                                <AppFileUpload
                                  form={form}
                                  label={"Upload an attachment"}
                                  name={"attachment"}
                                  preview={pocketbase.files.getUrl(
                                    purchase,
                                    purchase?.attachment
                                  )}
                                />
                              </div>
                            </div>
                            <div className="col-span-2 mt-6">
                              <div className="space-y-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-slate-500">
                                    Items Count
                                  </span>
                                  <span>
                                    <span className="font-semibold text-[12px] capitalize">
                                      {
                                        // items count
                                        purchaseItems?.reduce((acc, e) => {
                                          return acc + e.requested_quantity;
                                        }, 0)
                                      }
                                    </span>
                                  </span>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-slate-500">
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
                                    !purchaseItems.length
                                  }
                                  size="sm"
                                  className="w-full"
                                >
                                  <PlusCircle size={16} className="mr-2" />
                                  {purchase
                                    ? "Update purchase"
                                    : "Create purchase"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

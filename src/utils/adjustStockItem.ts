import pocketbase from "@/lib/pocketbase";

const adjustStockItem = async ({
  stock_item,
  quantity,
  type,
  reason,
  created_by,
}) => {
  console.log("going to adjust stock -->" + stock_item.id);
  const adjustment = {
    stock: stock_item.stock,
    quantity_adjusted: quantity,
    type,
    reason,
    stock_item: stock_item.id,
    created_by,
    notes: `Made ${reason}`,
    quantity_before: stock_item?.available_quantity,
    quantity_after:
      type === "addition"
        ? stock_item?.available_quantity + quantity
        : stock_item?.available_quantity - quantity,
  };

  await pocketbase
    .autoCancellation(false)
    .collection("adjustments")
    .create(adjustment);

  return pocketbase
    .autoCancellation(false)
    .collection("stock_items")
    .update(stock_item.id, {
      available_quantity: adjustment.quantity_after,
    });
};

export default adjustStockItem;

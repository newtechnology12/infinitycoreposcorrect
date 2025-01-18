import pocketbase from "@/lib/pocketbase";

const getOrCreateDestinationStockItem = async ({
  sourceStockItem,
  destinationStock,
}) => {
  const destinationItems = await pocketbase
    .collection("stock_items")
    .getList(1, 1, {
      filter: `stock="${destinationStock}" && item="${sourceStockItem}" `,
    });

  const destinationItem = destinationItems.items[0];

  if (destinationItem) {
    return destinationItem;
  } else {
    return pocketbase.collection("stock_items").create({
      stock: destinationStock,
      item: sourceStockItem,
      available_quantity: sourceStockItem.quantity,
      quantity_alert: 0,
    });
  }
};

async function processTransferItem(transfer, transfer_item, values, user) {
  const destinationStockItem = await getOrCreateDestinationStockItem({
    sourceStockItem: transfer_item?.item?.item,
    destinationStock: values.destination,
  });

  const quantity_transfered = Number(transfer_item.quantity);

  const created_transfer = await createTransferItem(
    transfer,
    transfer_item,
    destinationStockItem
  );

  await updateStockItems(
    transfer_item,
    destinationStockItem,
    quantity_transfered
  );

  const source_quantity_after =
    transfer_item?.item?.available_quantity - quantity_transfered;

  const destination_quantity_after =
    destinationStockItem?.available_quantity + quantity_transfered;

  const source_quantity_before = transfer_item?.item?.available_quantity;
  const destination_quantity_before = destinationStockItem.available_quantity;

  console.log({
    source_quantity_after,
    destination_quantity_after,
    source_quantity_before,
    destination_quantity_before,
    destinationStockItem,
  });

  await createAdjustments(
    "reduction",
    transfer_item,
    quantity_transfered,
    values.source,
    values.destination,
    user,
    destinationStockItem,
    source_quantity_after,
    source_quantity_before,
    values.source
  );

  await createAdjustments(
    "addition",
    destinationStockItem.id,
    quantity_transfered,
    values.source,
    values.destination,
    user,
    destinationStockItem,
    destination_quantity_after,
    destination_quantity_before,
    values.destination
  );

  return created_transfer;
}

async function createTransferItem(
  transfer,
  transfer_item,
  destinationStockItem
) {
  console.log(transfer_item);
  const item = await pocketbase.collection("transfer_items").create({
    transfer: transfer.id,
    quantity: transfer_item.quantity,
    source_stock_item: transfer_item?.item?.id,
    destination_stock_item: destinationStockItem.id,
    item: transfer_item?.item?.expand?.item?.id,
  });
  return item;
}

async function updateStockItems(
  sourceStockItem,
  destinationStockItem,
  transfered_quantity
) {
  await Promise.all([
    pocketbase.collection("stock_items").update(sourceStockItem?.item?.id, {
      available_quantity:
        sourceStockItem?.item?.available_quantity - transfered_quantity,
    }),
    pocketbase.collection("stock_items").update(destinationStockItem.id, {
      available_quantity:
        destinationStockItem.available_quantity + transfered_quantity,
    }),
  ]);
}

async function createAdjustments(
  type,
  transfer_item,
  quantity_adjusted,
  source,
  destination,
  user,
  destinationStockItem,
  quantity_after,
  quantity_before,
  stock
) {
  await pocketbase.collection("adjustments").create({
    stock: stock,
    quantity_adjusted: quantity_adjusted,
    type: type,
    reason: "transfer",
    stock_item:
      type === "reduction" ? transfer_item?.item?.id : destinationStockItem.id,
    created_by: user.id,
    notes: "",
    quantity_before: quantity_before,
    quantity_after: quantity_after,
  });
}

async function processTransferItems(items, transfer, values, user) {
  for await (const transfer_item of items) {
    const item = await processTransferItem(
      transfer,
      transfer_item,
      values,
      user
    );
    // update the transfer add add the transfer item
    await pocketbase.collection("transfers").update(transfer.id, {
      "items+": item.id,
    });
  }
}
export { processTransferItems };

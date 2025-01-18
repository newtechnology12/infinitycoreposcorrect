import pocketbase from "@/lib/pocketbase";
import adjustStockItem from "./adjustStockItem";

const adjustStockAfterSale = async ({ order_item_id, order }) => {
  const order_item = await pocketbase
    .collection("order_items")
    .getOne(order_item_id, {
      expand:
        "menu,menu.ingredients,menu.ingredients.ingredient,menu.ingredients.ingredient.stock_items,menu.destination,menu.stock_items",
    });

  if (!order_item.expand) {
    throw new Error("Order item not found");
  }

  const track_inventory = order_item.expand.menu.track_inventory;

  if (track_inventory) {
    if (order_item.expand?.menu?.ingredients?.length) {
      const menu_ingredients = order_item.expand.menu?.expand?.ingredients;
      const destination = order_item.expand.menu?.expand?.destination;

      const trackable_menus = menu_ingredients.filter(
        (e) => e.expand.ingredient.track_inventory
      );

      if (!trackable_menus.length) {
        console.log("No Trackable ingredients found in menu");
        return; // no stock adjustment needed
      }

      const adjustments = trackable_menus.map((menu_ingredient) => {
        const stock_items =
          menu_ingredient.expand.ingredient.expand.stock_items;

        const stock_item_to_use = stock_items?.find(
          (e) => e.stock === destination.stock
        );

        return stock_item_to_use
          ? {
              stock_item: stock_item_to_use,
              type: "reduction",
              reason: "sale",
              created_by: order.waiter,
              quantity: menu_ingredient.quantity * order_item.quantity,
            }
          : null;
      });

      const adjustments_to_use = adjustments.filter((e) => e);

      if (!adjustments_to_use.length) {
        console.log("No stock items found for menu ingredients");
        return;
      }

      return Promise.all(adjustments_to_use.map((e) => adjustStockItem(e)));
    } else {
      const stock_items = order_item.expand?.menu.expand?.stock_items;
      const destination = order_item.expand.menu?.expand?.destination;

      const stock_item_to_use = stock_items?.find(
        (e) => e.stock === destination.stock
      );

      const adjustment = await adjustStockItem({
        stock_item: stock_item_to_use,
        type: "reduction",
        reason: "sale",
        created_by: order.waiter,
        quantity: order_item.quantity,
      });

      console.log("Stock adjusted after sale", adjustment);
      return adjustment;
    }
  } else {
    console.log("Item is not trackable, no stock adjustment needed");
  }
};

export default adjustStockAfterSale;

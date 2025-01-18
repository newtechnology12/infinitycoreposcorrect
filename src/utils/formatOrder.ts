import formatBill from "./formatBill";

const formatOrder = ({ items = [], ...order }: any) => {
  const bills = order?.expand?.bills?.map(formatBill);

  const itemsToUse = items
    ?.filter((e) => e.status !== "draft")
    .filter((e) => e.status !== "cancelled");

  return {
    ...order,
    items: items,
    total_cancelled:
      items
        .filter((item) => item.status === "cancelled")
        .reduce((a, b) => a + b.amount || 0, 0) || 0,
    itemsCount: itemsToUse.reduce((a, b) => a + b.quantity || 0, 0) || 0,
    subTotal: itemsToUse.reduce((a, b) => a + b.amount || 0, 0) || 0,
    total:
      order?.expand?.bills?.map(formatBill).reduce((a, b) => a + b.total, 0) ||
      0,
    balance: bills?.reduce((a, b) => a + b.balance, 0),
    discount_used: bills?.reduce((a, b) => a + b?.discount_used, 0),
    expand: order.expand,
    paidAmount:
      order?.expand?.bills
        ?.map(formatBill)
        .reduce((a, b) => a + b.total_paid, 0) || 0,
  };
};

export default formatOrder;

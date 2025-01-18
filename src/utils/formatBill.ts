const formatBill = (bill) => {
  const transactions = bill?.expand?.transactions || [];
  const credits = bill?.expand?.credits || [];
  const total =
    bill?.expand?.items
      ?.filter((e) => e.status !== "cancelled")
      .filter((e) => e.status !== "draft")
      ?.reduce((a, b) => a + b.amount || 0, 0) || 0;

  const total_paid =
    transactions?.reduce((a, b) => a + b.amount, 0) +
      credits?.reduce((a, b) => a + b.amount, 0) || 0;

  // get payment_status either partially_paid, paid, unpaid
  const payment_status =
    total_paid === total
      ? "paid"
      : total_paid > 0
      ? "partially_paid"
      : "unpaid";

  const discount_used = bill?.expand?.discount?.amount || 0;

  return {
    ...bill,
    total_paid: total_paid,
    balance: total - discount_used - total_paid,
    items: bill?.expand?.items
      ?.filter((e) => e.status !== "draft")
      .filter((e) => e.status !== "cancelled"),
    payment_status: payment_status,
    itemsCount:
      bill?.expand?.items
        ?.filter((e) => e.status !== "draft")
        .filter((e) => e.status !== "cancelled")
        .reduce((a, b) => a + b.quantity || 0, 0) || 0,
    subTotal:
      bill?.expand?.items?.items
        ?.filter((e) => e.status !== "draft")
        .filter((e) => e.status !== "cancelled")
        .reduce((a, b) => a + b.amount * b.quantity || 0, 0) || 0,
    discount_used: discount_used,
    total: total,
  };
};

export default formatBill;

export const invoiceTemplate = (order: any) => {
  const formatDate = (date: any) => new Date(date).toISOString().split("T")[0];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice</title>

  <style>
    body {
      font-family: "Arial", sans-serif;
      padding: 40px;
      color: #333;
      background: #fafafa;
    }

    .header {
      text-align: center;
      padding-bottom: 10px;
      margin-bottom: 15px;
      border-bottom: 3px solid #e0e0e0;
    }

    .logo {
      width: 120px;
      margin-bottom: 5px;
    }

    .title {
      font-size: 32px;
      font-weight: 700;
      color: #222;
      margin-top: 5px;
      letter-spacing: 1px;
    }

    .invoice {
      background-color: #e0e0e0;
      width: 55%;
      margin: 20px auto;
      padding: 20px;
      font-weight: bold;
      border-radius: 8px;
      color: #333;
      text-align: center;
      font-size: large;
    }

    .section-title {
      font-size: 18px;
      margin-top: 30px;
      font-weight: 600;
      color: #333;
      border-left: 4px solid #d00;
      padding-left: 10px;
    }

    .info {
      margin-top: 12px;
      font-size: 15px;
      line-height: 1.6;
      color: #555;
    }

    .full_info {
      display: flex;
      gap: 30px;
      align-items: flex-start;
      margin-top: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background: #fff;
      border-radius: 8px 8px 0 0;
      overflow: hidden;
    }

    th {
      background: #d00;
      padding: 12px;
      color: #fff;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }

    td {
      padding: 12px;
      font-size: 12px;
      color: #333;
    }

    tr {
      text-align: center;
      border-bottom: 1px solid #e0e0e0;
    }

    tr:nth-child(even) { background: #f9f9f9; }
    tr:nth-child(odd) { background: #fff; }

    tr:hover { background: #f1f1f1; }

    .summary {
      margin-top: 30px;
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      color: #222;
    }

    .summary-container {
      page-break-inside: avoid;
    }

    .summery_table {
      width: 40%;
      margin: 20px auto;
      border-collapse: collapse;
      background: #fff;
      border-radius: 6px;
      overflow: hidden;
      font-weight: 600;
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.05);
      page-break-inside: avoid;
    }

    .summery_table td {
      padding: 14px;
      font-size: 14px;
    }

    .summery_table td:first-child {
      text-align: left;
      font-weight: 600;
    }

    .summery_table tr:nth-child(even) { background: #f9f9f9; }
    .summery_table tr:nth-child(odd)  { background: #fff; }

    .total-row {
      background: #d00 !important;
      color: #fff !important;
      font-weight: bold;
    }

    .total-row td { color: #fff !important; }

    @media print {
      body { background: #fff; }
      .summery_table { width: 60%; }
    }
  </style>
</head>


<body>

  <div class="header">
    <img src="${process.env.BASE_URL}/logo.png" class="logo" />
    <div class="title">INVOICE</div>
    <div class="invoice"><b>Invoice #</b> ${order.orderId}</div>
  </div>

  <div class="full_info">
    <div class="info">
      <b style="font-size: 16px;">CELLFASHIONUSA</b><br/>
      1100 Rarig Avenue, Unit-M<br/>
      Columbus, OH 43219<br/>
      Phone: +1 614-726-9526
    </div>

    <div class="info">
      <b>Invoice No:</b> ${order.orderId}<br/>
      <b>Date:</b> ${formatDate(order.createdAt)}<br/>
      <b>Email:</b> info@company.com<br/>
      <b>Phone:</b> +1 614-726-9526<br/>
    </div>
  </div>

  <div class="full_info">

    <div>
      <div class="section-title">Bill To</div>
      <div class="info">
        ${order.shippingAddress.firstName} ${
    order.shippingAddress.lastName
  }<br/>
        ${order.shippingAddress.streetAddress}<br/>
        ${order.shippingAddress.city}, ${order.shippingAddress.country}<br/>
        Phone: ${order.shippingAddress.phoneNumber}
      </div>
    </div>

    <div>
      <div class="section-title">Shipping Address</div>
      <div class="info">
        ${order.shippingAddress.firstName} ${
    order.shippingAddress.lastName
  }<br/>
        ${order.shippingAddress.streetAddress}<br/>
        ${order.shippingAddress.city}, ${order.shippingAddress.country}<br/>
        Phone: ${order.shippingAddress.phoneNumber}
      </div>
    </div>

  </div>

  <div class="section-title">Items</div>

  <table>
    <tr>
      <th>S.NO</th>
      <th>Product</th>
      <th>SKU</th>
      <th>Qty</th>
      <th>Unit Price</th>
      <th>Total Price</th>
      <th>% Discount</th>
      <th>Discount Value</th>
      <th>Final Price</th>
    </tr>

    ${order.items
      .map((it: any, i: number) => {
        const total = it.quantity * it.price;
        const discountPercent = it.discountPercent || 0;
        const discountValue = ((total * discountPercent) / 100).toFixed(2);
        const finalPrice = (total - Number(discountValue)).toFixed(2);

        return `
          <tr>
            <td>${i + 1}</td>
            <td>${it.product.name}</td>
            <td>${it.sku}</td>
            <td>${it.quantity}</td>
            <td>$${it.price}</td>
            <td>$${total}</td>
            <td>${discountPercent}%</td>
            <td>$-${discountValue}</td>
            <td>$${finalPrice}</td>
          </tr>
        `;
      })
      .join("")}
  </table>

  <div class="summary-container">
    <div class="summary">Summary</div>

    <table class="summery_table">
      <tr><td>Total Qty</td><td>${order.items.reduce(
        (a: number, b: any) => a + b.quantity,
        0
      )}</td></tr>
      <tr><td>Subtotal</td><td>$${order.subtotal}</td></tr>
      <tr><td>Tax</td><td>$${order.taxAmount}</td></tr>
      <tr><td>Discount</td><td>$-${order.discount}</td></tr>
      <tr><td>Delivery Charge</td><td>$${order.deliveryCharge}</td></tr>
      <tr><td>Credit Used</td><td>$-${order.creditAmount}</td></tr>
      <tr class="total-row"><td>Grand Total</td><td>$${
        order.grandTotal
      }</td></tr>
    </table>
  </div>

</body>
</html>
`;
};

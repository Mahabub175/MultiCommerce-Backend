export const invoiceTemplate = (order: any) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 30px;
      color: #333;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #ccc;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }

    .logo {
      width: 120px;
      margin-bottom: 10px;
    }

    .title {
      font-size: 28px;
      font-weight: bold;
      color: #4A4A4A;
      margin-top: 5px;
    }

    .section-title {
      font-size: 18px;
      margin-top: 30px;
      font-weight: bold;
      color: #444;
    }

    .info {
      margin-top: 12px;
      font-size: 14px;
      line-height: 1.5;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }

    th {
      background: #f4f4f4;
      padding: 10px;
      border: 1px solid #ddd;
      font-size: 14px;
    }

    td {
      padding: 10px;
      border: 1px solid #ddd;
      font-size: 14px;
    }

    .total-row {
      background: #f4f4f4;
      font-weight: bold;
    }

  </style>
</head>
<body>

  <div class="header">
    <img src="${process.env.BASE_URL}/logo.png" class="logo" />
    <div class="title">Invoice</div>
  </div>

  <div class="section-title">Order Info</div>
  <div class="info">
    <b>Invoice No:</b> ${order.orderId}<br/>
    <b>Date:</b> ${order.createdAt}<br/>
  </div>

  <div class="section-title">Shipping Address</div>
  <div class="info">
    ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br/>
    ${order.shippingAddress.streetAddress}<br/>
    ${order.shippingAddress.city}, ${order.shippingAddress.country}<br/>
    Phone: ${order.shippingAddress.phoneNumber}
  </div>

  <div class="section-title">Items</div>

  <table>
    <tr>
      <th>Product</th>
      <th>SKU</th>
      <th>Qty</th>
      <th>Price</th>
      <th>Total</th>
    </tr>

    ${order.items
      .map(
        (it: any) => `
        <tr>
          <td>${it.product.name}</td>
          <td>${it.sku}</td>
          <td>${it.quantity}</td>
          <td>${it.price}</td>
          <td>${it.quantity * it.price}</td>
        </tr>`
      )
      .join("")}
  </table>

  <div class="section-title">Summary</div>
  <table>
    <tr><td>Subtotal</td><td>${order.subtotal}</td></tr>
    <tr><td>Tax</td><td>${order.taxAmount}</td></tr>
    <tr><td>Discount</td><td>-${order.discount}</td></tr>
    <tr><td>Delivery Charge</td><td>${order.deliveryCharge}</td></tr>
    <tr><td>Credit Used</td><td>-${order.creditAmount}</td></tr>
    <tr class="total-row"><td>Grand Total</td><td>${order.grandTotal}</td></tr>
  </table>

</body>
</html>
`;

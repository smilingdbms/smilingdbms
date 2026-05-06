export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dealAmount, companyName, companyCode, gstNumber } = req.body;

  // 18% GST Calculation Logic
  const subtotal = parseFloat(dealAmount) || 0;
  const gstAmount = (subtotal * 0.18).toFixed(2);
  const total = (subtotal + parseFloat(gstAmount)).toFixed(2);

  // Professional HTML Invoice Template
  const invoiceHtml = `
    <div style="font-family: sans-serif; padding: 40px; border: 1px solid #ddd; max-width: 800px; margin: auto; background: #fff;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #6c8cff; padding-bottom: 20px;">
        <div>
          <h1 style="margin: 0; color: #6c8cff;">TAX INVOICE</h1>
          <p style="margin: 5px 0;"><strong>Code:</strong> ${companyCode}</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0;">${companyName}</h3>
          <p style="margin: 5px 0;">GSTIN: ${gstNumber || 'N/A'}</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
        <thead>
          <tr style="background: #f4f7ff;">
            <th style="padding: 15px; text-align: left; border-bottom: 2px solid #eee;">Description</th>
            <th style="padding: 15px; text-align: right; border-bottom: 2px solid #eee;">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 15px; border-bottom: 1px solid #eee;">Professional Recruitment Charges</td>
            <td style="padding: 15px; text-align: right; border-bottom: 1px solid #eee;">₹${subtotal.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 15px; text-align: right;"><strong>GST (18%)</strong></td>
            <td style="padding: 15px; text-align: right;">₹${gstAmount}</td>
          </tr>
          <tr style="background: #f4f7ff; font-size: 1.4em;">
            <td style="padding: 15px; text-align: right;"><strong>Total Payable</strong></td>
            <td style="padding: 15px; text-align: right; color: #6c8cff;"><strong>₹${parseFloat(total).toLocaleString('en-IN')}</strong></td>
          </tr>
        </tbody>
      </table>
      
      <div style="margin-top: 50px; font-size: 0.9em; color: #666;">
        <p>* This is a computer-generated invoice and does not require a physical signature.</p>
      </div>
    </div>
  `;

  res.status(200).json({ html: invoiceHtml, total: total });
}
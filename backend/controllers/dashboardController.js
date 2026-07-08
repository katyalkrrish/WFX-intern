const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {
    // 1. Get counts
    const countsQuery = pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM buyers) as buyers_count,
        (SELECT COUNT(*) FROM suppliers) as suppliers_count,
        (SELECT COUNT(*) FROM finished_goods) as products_count,
        (SELECT COUNT(*) FROM sales_orders) as orders_count,
        (SELECT COUNT(*) FROM sales_invoices) as invoices_count
    `);

    // 2. Get total revenue (sum of invoice amounts)
    const revenueQuery = pool.query(`
      SELECT SUM(amount) as total_revenue FROM sales_invoices
    `);

    // 3. Get order status distribution
    const orderStatusQuery = pool.query(`
      SELECT status, COUNT(*) as count 
      FROM sales_orders 
      GROUP BY status
    `);

    // 4. Get payment status distribution
    const paymentStatusQuery = pool.query(`
      SELECT payment_status, COUNT(*) as count, SUM(amount) as total_amount 
      FROM sales_invoices 
      GROUP BY payment_status
    `);

    const [countsRes, revenueRes, orderStatusRes, paymentStatusRes] = await Promise.all([
      countsQuery,
      revenueQuery,
      orderStatusQuery,
      paymentStatusQuery
    ]);

    const counts = countsRes.rows[0];
    const totalRevenue = parseFloat(revenueRes.rows[0].total_revenue || 0);

    res.json({
      success: true,
      buyers: parseInt(counts.buyers_count),
      suppliers: parseInt(counts.suppliers_count),
      products: parseInt(counts.products_count),
      orders: parseInt(counts.orders_count),
      invoices: parseInt(counts.invoices_count),
      totalRevenue: totalRevenue,
      orderStatusDistribution: orderStatusRes.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count)
      })),
      paymentStatusDistribution: paymentStatusRes.rows.map(row => ({
        status: row.payment_status,
        count: parseInt(row.count),
        amount: parseFloat(row.total_amount || 0)
      }))
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};
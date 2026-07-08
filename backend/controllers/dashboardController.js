const supabase = require("../config/supabase");

const getDashboardStats = async (req, res) => {
  try {
    const [
      buyers,
      suppliers,
      products,
      orders,
      invoices,
    ] = await Promise.all([
      supabase.from("buyers").select("*", { count: "exact", head: true }),
      supabase.from("suppliers").select("*", { count: "exact", head: true }),
      supabase.from("finished_goods").select("*", { count: "exact", head: true }),
      supabase.from("sales_orders").select("*", { count: "exact", head: true }),
      supabase.from("sales_invoices").select("*", { count: "exact", head: true }),
    ]);

    res.json({
      buyers: buyers.count,
      suppliers: suppliers.count,
      products: products.count,
      orders: orders.count,
      invoices: invoices.count,
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
const supabase = require("../config/supabase");

const getOrders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("sales_orders")
      .select("*");

    if (error) throw error;

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getOrders,
};
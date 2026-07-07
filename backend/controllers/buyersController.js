const supabase = require("../config/supabase");

const getBuyers = async (req, res) => {
  const { data, error } = await supabase
    .from("buyers")
    .select("*");

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
};

module.exports = { getBuyers };
const Order = require('../models/Order');

module.exports = {
  findAll: async () => await Order.find(),
  findById: async (id) => {
    try { return await Order.findById(id); } catch(e) { return null; }
  },
  findByUserId: async (userId) => await Order.find({ userId }),
  create: async (data) => {
    const order = new Order(data);
    await order.save();
    return order;
  },
  updateStatus: async (id, status) => {
    try {
      return await Order.findByIdAndUpdate(id, { status }, { new: true });
    } catch (e) {
      return null;
    }
  }
};

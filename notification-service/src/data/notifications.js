const Notification = require('../models/Notification');
module.exports = {
  findAll: async () => await Notification.find(),
  findByUserId: async (userId) => await Notification.find({ userId }),
  create: async (data) => {
    const n = new Notification(data);
    await n.save();
    return n;
  },
  markRead: async (id) => {
    try {
      return await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    } catch (e) {
      return null;
    }
  }
};

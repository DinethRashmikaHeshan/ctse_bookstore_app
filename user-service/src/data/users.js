const User = require('../models/User');

module.exports = {
  findAll: async () => {
    return await User.find();
  },
  findById: async (id) => {
    try {
      return await User.findById(id);
    } catch (e) {
      return null;
    }
  },
  findByEmail: async (email) => {
    return await User.findOne({ email });
  },
  create: async (userData) => {
    const user = new User(userData);
    await user.save();
    return user;
  },
  toPublic: (user) => {
    const userObj = user.toObject ? user.toObject() : user;
    const { password, ...publicUser } = userObj;
    if (publicUser._id) {
       publicUser.id = publicUser._id.toString();
       delete publicUser._id;
    }
    delete publicUser.__v;
    return publicUser;
  }
};

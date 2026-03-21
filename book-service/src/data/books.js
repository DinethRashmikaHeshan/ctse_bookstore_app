const Book = require('../models/Book');

module.exports = {
  findAll: async (query = {}) => {
    const mongoQuery = {};
    if (query.category) mongoQuery.category = new RegExp(`^${query.category}$`, 'i');
    if (query.search) {
      mongoQuery.$or = [
        { title: new RegExp(query.search, 'i') },
        { author: new RegExp(query.search, 'i') }
      ];
    }
    return await Book.find(mongoQuery);
  },
  findById: async (id) => {
    try {
      return await Book.findById(id);
    } catch (e) {
      return null;
    }
  },
  create: async (data) => {
    const book = new Book(data);
    await book.save();
    return book;
  },
  update: async (id, data) => {
    try {
      return await Book.findByIdAndUpdate(id, data, { new: true });
    } catch (e) {
      return null;
    }
  },
  reduceStock: async (id, qty) => {
    try {
      const book = await Book.findById(id);
      if (!book || book.stock < qty) return null;
      book.stock -= qty;
      await book.save();
      return book;
    } catch (e) {
      return null;
    }
  }
};

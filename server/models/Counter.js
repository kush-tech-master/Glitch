const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: 'bill_number',
  },
  seq: {
    type: Number,
    default: 0,
  },
  prefix: {
    type: String,
    default: 'GL-',
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear(),
  },
});

// Helper function to get next unique sequence number atomically
counterSchema.statics.getNextBillNumber = async function (counterId = 'bill_number', prefix = 'GL-') {
  const counter = await this.findOneAndUpdate(
    { id: counterId },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  // Formats to 5 digits: GL-00001, GL-00002, etc.
  const paddedSeq = String(counter.seq).padStart(5, '0');
  return `${prefix}${paddedSeq}`;
};

// Helper function to peek at the next upcoming bill number without incrementing
counterSchema.statics.peekNextBillNumber = async function (counterId = 'bill_number', prefix = 'GL-') {
  const counter = await this.findOne({ id: counterId });
  const currentSeq = counter ? counter.seq : 0;
  const nextSeq = currentSeq + 1;
  const paddedSeq = String(nextSeq).padStart(5, '0');
  return `${prefix}${paddedSeq}`;
};

module.exports = mongoose.model('Counter', counterSchema);

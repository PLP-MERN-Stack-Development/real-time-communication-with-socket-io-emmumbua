const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      default: '',
      maxlength: 160,
    },
    isDirect: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    avatarEmoji: {
      type: String,
      default: '☕️',
    },
  },
  {
    timestamps: true,
  }
);

roomSchema.index({ participants: 1 });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;


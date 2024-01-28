import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    userId: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "userId boş bırakılamaz."],
    },
    roomId: {
      type: Schema.ObjectId,
      ref: "Room",
      required: [true, "roomId boş bırakılamaz."],
    },
    type: {
      type: String,
      enum: ["text", "media"],
      default: "public",
    },
    text: {
      type: String,
    },
    mediaUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);

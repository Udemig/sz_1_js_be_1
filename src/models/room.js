import mongoose, { Schema } from "mongoose";

const roomSchema = new Schema(
  {
    userId: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "userId boş bırakılamaz."],
    },
    name: {
      type: String,
      required: [true, "Oda ismi boş bırakılamaz."],
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    maxClient: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Room = mongoose.model("Room", roomSchema);

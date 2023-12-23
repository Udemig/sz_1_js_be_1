import mongoose, { Schema } from "mongoose";

const roomSchema = new Schema({
  userId: {
    type: Schema.ObjectId,
    ref: "User",
    required: [true, "userId boş bırakılamaz."],
  },
  name: {
    type: String,
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
});

export default mongoose.model("Room", roomSchema);

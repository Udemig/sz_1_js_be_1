import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  username: {
    type: String,
    required: [true, "Lütfen kullanıcı adınızı belirtiniz."],
  },
  password: {
    type: String,
    required: [true, "Lütfen şifrenizi belirtiniz."],
  },
  email: {
    type: String,
    required: [true, "Lütfen e-posta belirtiniz."],
  },
  gender: {
    type: String,
    enum: ["male", "female", "prefer_not_to_say"],
    default: "prefer_not_to_say",
  },
});

export default mongoose.model("User", userSchema);

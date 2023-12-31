import Joi from "joi";

const createRoomValidator = Joi.object({
  name: Joi.string()
    .pattern(new RegExp("^[a-zA-Z0-9 -_çöşüğıÖÇŞİĞÜ]$"))
    .min(3)
    .max(30)
    .required(),
  visibility: Joi.string(),
  maxClient: Joi.number().integer().min(0).max(100),
});

export default createRoomValidator;

import Joi from "joi";

export const registerRequestValidator = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).required(),
  email: Joi.string().email().required(),
  firstname: Joi.string(),
  lastname: Joi.string(),
  gender: Joi.string().valid("male", "female", "prefer_not_to_say"),
});

export default registerRequestValidator;

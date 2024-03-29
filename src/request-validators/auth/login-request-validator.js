import Joi from "joi";

export const loginRequestValidator = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).required(),
});

export default loginRequestValidator;

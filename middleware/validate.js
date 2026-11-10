import { ValidationError } from "../apiError.js";

export const validate = (schema, reqProp = "body") => {
  return function (req, res, next) {
    const reqPropsValues = ["body", "params", "query"];
    if (!schema) throw new Error("Schema is not defined");
    if (!reqProp) throw new Error("The request property is not defined");
    if (typeof reqProp !== "string")
      throw new Error("The request property must be a string");
    if (!reqPropsValues.includes(reqProp))
      throw new Error(
        `The request property can only be one of ${reqPropsValues.map(
          (props) => `${props},`
        )}`
      );

    const { error, value } = schema.validate(req[reqProp], {
      abortEarly: false,
    });

    if (error) {
      const errorsArray = error.details.map((error) => {
        return {
          detail: error.message,
          pointer: error.path[0],
          code: error.type,
        };
      });

      next(
        new ValidationError(
          `The request ${reqProp} contained ${errorsArray.length} validation ${
            errorsArray.length === 1 ? "error" : "errors"
          }`,
          errorsArray
        )
      );
    }

    if (reqProp === "query") {
      Object.defineProperty(req, "query", {
        value,
        writable: true,
        configurable: true,
      });
    } else {
      req[reqProp] = value;
    }

    next();
  };
};

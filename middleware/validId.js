import { ObjectId } from "mongodb";

const validId = (paramName) => {
  return (req, res, next) => {
    try {
      req.params[paramName] = new ObjectId(req.params[paramName]);
      return next();
    } catch (error) {
      return res.status(404).json({error: `ID ${req.params[paramName]} is not a valid ObjectId`});
    }
  }
}

export { validId };
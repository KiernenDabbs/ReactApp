const validBody = (schema) => {
  return async (req, res, next) => {
    const validationsResult = schema.validate(req.body, {abortEarly: false});
    if(validationsResult.error) {
      res.status(400).json({error: validationsResult.error});
    } else {
      req.body = validationsResult.value;
      next();
    }
  };
};

export { validBody };
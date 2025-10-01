import { NextFunction, Request, Response } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Aux function to catch async errors
 * @param fn original async function
 * @returns wrapped async function
 */
const catchAsync = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;

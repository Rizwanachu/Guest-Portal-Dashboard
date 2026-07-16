import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import guestsRouter from "./guests";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bookingsRouter);
router.use(guestsRouter);

export default router;

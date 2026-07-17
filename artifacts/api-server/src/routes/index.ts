import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bookingsRouter from "./bookings";
import guestsRouter from "./guests";
import authRouter from "./auth";
import hotelsRouter from "./hotels";
import roomsRouter from "./rooms";
import staffRouter from "./staff";
import reportsRouter from "./reports";

const router: IRouter = Router();

// Public
router.use(authRouter);
router.use(healthRouter);

// Protected (each router applies requireAuth internally)
router.use(hotelsRouter);
router.use(roomsRouter);
router.use(staffRouter);
router.use(reportsRouter);
router.use(bookingsRouter);
router.use(guestsRouter);

export default router;

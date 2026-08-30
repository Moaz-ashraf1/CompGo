import express from "express";
import routes from "./routes/index.js";
import globalErrorHandler from "./middlewares/globalErrorHandling.js";
import clienRouter from "./modules/client/client.route.js";
import captainRouter from "./modules/captain/captain.routes.js";
import adminRouter from "./modules/admin/admin.route.js";
const app = express();
app.use(express.json());

app.use("/api/v1", routes);
app.use("/clientapi/v1", clienRouter);
app.use("/captainapi/v1", captainRouter);
app.use("/adminapi/v1", adminRouter);
app.use(globalErrorHandler);

export default app;

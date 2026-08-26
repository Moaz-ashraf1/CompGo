import express from "express";
import routes from "./routes/index.js";
import globalErrorHandler from "./middlewares/globalErrorHandling.js";
import clienRouter from "./modules/client/client.route.js";
const app = express();
app.use(express.json());

app.use("/api/v1", routes);
app.use("/clientapi/v1", clienRouter);
app.use(globalErrorHandler);

export default app;

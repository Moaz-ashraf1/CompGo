import path from "node:path";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import globalErrorHandler from "./middlewares/globalErrorHandling.js";
import clienRouter from "./modules/client/client.route.js";
import captainRouter from "./modules/captain/captain.routes.js";
import adminRouter from "./modules/admin/admin.route.js";
const app = express();
app.use(
  cors({
    origin: ["https://ingateapp.tech", "http://localhost:5173"],
  }),
);
app.use(express.json());

// Serves whatever `captainDocumentsUpload` (src/config/upload.ts) saves to
// disk, e.g. `/uploads/captains/<uuid>.jpg`. The nationalIdImage/
// licenseImage values stored on a Captain are exactly this kind of path,
// and without this route nothing (not even the admin dashboard) could
// ever load them. Filenames are random UUIDs, not the captain's id, so
// this is unlisted-by-obscurity rather than access-controlled - fine for
// now, but revisit if these documents need real access control later.
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/v1", routes);
app.use("/clientapi/v1", clienRouter);
app.use("/captainapi/v1", captainRouter);
app.use("/adminapi/v1", adminRouter);
app.use(globalErrorHandler);

export default app;

const app = require("./app");
const verifyToken = require("./middlewares/verifyJWT");
const rateLimit = require("express-rate-limit");

// Import associations
require("./associations/associations");

// Rate limiter for public endpoints (no authentication required)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per 15 minutes
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests, please try again later" },
});

// Routes
const userRoute = require("./routes/userRoute");
const authRoute = require("./routes/authRoute");
const projectRoute = require("./routes/projectRoute");
const deviceRoute = require("./routes/deviceRoute");
const dataConfigRoute = require("./routes/dataConfigRoute");
const dataTableHandlingRoute = require("./routes/dataTableHandlingRoute");
const columnRoute = require("./routes/columnRoute");
const dataGatheringRoute = require("./routes/dataGatheringRoute");
const dataSendingRoute = require("./routes/dataSendingRoute");
const widgetRoute = require("./routes/widgetRoute");
const analyticWidgetRoute = require("./routes/analyticWidgetRoute");
const accessKeyRoute = require("./routes/accessKeyRoute");
const sharedDashboardRoute = require("./routes/sharedDashboardRoute");
const publicDashboardRoute = require("./routes/publicDashboardRoute");

// Initialize MQTT client
const mqttClient = require('./utils/mqttClient');

const PORT = process.env.PORT || 3001;

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is healthy" });
});

app.use("/api/user", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/project", verifyToken, projectRoute);
app.use("/api/device", verifyToken, deviceRoute);
app.use("/api/data/tbl", verifyToken, dataTableHandlingRoute);
app.use("/api/data/clm", verifyToken, columnRoute);
app.use("/api/data/config", verifyToken, dataConfigRoute);
app.use("/api/data/feed", dataGatheringRoute); // JWT middleware is not needed because data sent through this route is public
app.use("/api/data/get", verifyToken, dataSendingRoute);
app.use("/api/widget", verifyToken, widgetRoute);
app.use("/api/analytic_widget", analyticWidgetRoute);
app.use("/api/access-key", verifyToken, accessKeyRoute);
app.use("/api/share", verifyToken, sharedDashboardRoute);
app.use("/api/public", publicLimiter, publicDashboardRoute); // Public routes - rate limited, no authentication required

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
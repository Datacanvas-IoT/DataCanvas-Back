const app = require("./app");
const verifyToken = require("./middlewares/verifyJWT");

// Import associations
require("./associations/associations");

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
app.use("/api/access-keys", verifyToken, accessKeyRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
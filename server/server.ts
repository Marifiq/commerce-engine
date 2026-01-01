import dotenv from "dotenv";
import app from "./app.js";

process.on("uncaughtException", (err: Error) => {
  console.error(`${err.name} and ${err.message}`);
  console.log("Uncaught Exception : Shutting Down");
  process.exit(1);
});

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`App Running on port ${PORT}`);
});

process.on("unhandledRejection", (err: any) => {
  console.error(err.name + " " + err.message);
  console.log("Unhandled Rejection : Shutting Down");
  server.close(() => {
    process.exit(1);
  });
});

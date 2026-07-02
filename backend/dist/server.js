import { app } from "./app.js";
import { env } from "./config/env.js";
app.listen(env.port, "0.0.0.0", () => {
    console.log(`FoodSave API escuchando en http://0.0.0.0:${env.port}`);
    console.log(`Health check local: http://localhost:${env.port}/health`);
});

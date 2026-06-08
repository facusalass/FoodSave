import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`FoodSave API escuchando en http://localhost:${env.port}`);
});

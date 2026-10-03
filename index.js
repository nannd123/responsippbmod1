import app from "./src/app.js";

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Library Loan API berjalan di http://localhost:${PORT}`);
  });
}

export default app;

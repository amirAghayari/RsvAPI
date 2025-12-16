import { Router, Request, Response } from "express";
import AuthService from "../services/auth.service";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;
    const user = await AuthService.register(email, name, password);
    return res.status(201).json(user);
  } catch (err: any) {
    return res.status(400).json({ message: err.message || "Bad Request" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tokens = await AuthService.login(email, password);
    return res.json(tokens);
  } catch (err: any) {
    return res.status(400).json({ message: err.message || "Bad Request" });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "refreshToken required" });
    const tokens = await AuthService.refresh(refreshToken);
    return res.json(tokens);
  } catch (err: any) {
    return res.status(401).json({ message: err.message || "Unauthorized" });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required" });
    await AuthService.revokeRefreshToken(userId);
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(400).json({ message: err.message || "Bad Request" });
  }
});

export default router;

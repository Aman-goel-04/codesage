import dotenv from "dotenv";
import path from "path";
const result = dotenv.config({
	path: path.resolve(process.cwd(), "../../.env"),
});
import express, { type Request, type Response } from "express";
import axios from "axios";
import { prisma } from "@repo/db";
import cookieParser from "cookie-parser";
import crypto from "crypto";

const app = express();

app.use(cookieParser());
app.use(express.json());

async function start() {
	await prisma.$connect();
	console.log("connected");

	app.listen(3001, () => {
		console.log("server running on 3001");
	});
}

start();

app.get("/user", (req: Request, res: Response) => {
	res.send("heyy");
});

app.get("/auth/github", (req: Request, res: Response) => {
	const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo`;
	res.redirect(url);
});

app.get("/api/auth/callback", async (req: Request, res: Response) => {
	const code = req.query.code as string;

	if (!code) {
		return res.status(400).send("Missing code");
	}

	// console.log("hey0");
	try {
		const response1 = await axios.post(
			"https://github.com/login/oauth/access_token",
			new URLSearchParams({
				client_id: process.env.GITHUB_CLIENT_ID!,
				client_secret: process.env.GITHUB_CLIENT_SECRET!,
				code: code as string,
			}),
			{
				headers: { Accept: "application/json" },
			},
		);
		// reponse obj
		// "access_token=...&scope=repo&token_type=bearer" (string)

		const accessToken = response1.data.access_token;
		if (!accessToken) {
			throw new Error("GitHub OAuth failed: no access token");
		}

		// console.log("hey1");
		// console.log(response1.data);
		// console.log(typeof response1.data);
		// console.log("hey2");

		interface response2Type {
			id: string;
			login: string;
			name: string;
		}
		const githubUser = await axios.get<response2Type>(
			"https://api.github.com/user",
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			},
		);
		// console.log("hey3");

		// response obj
		// {
		//     "id": "...",
		//     "login": "...",
		//     "name": "...",
		//     ...
		// }

		// console.log(githubUser.data);

		const { id, login, name } = githubUser.data;

		const user = await prisma.user.upsert({
			where: {
				githubId: id.toString(),
			},
			update: {
				name: name ?? login,
				gh_access_token: accessToken,
			},
			create: {
				githubId: id.toString(),
				name: name ?? login,
				gh_access_token: accessToken,
			},
		});

		const sessionToken = crypto.randomUUID();

		await prisma.session.create({
			data: {
				token: sessionToken,
				userId: user.id,
			},
		});

		res.cookie("session", sessionToken, {
			httpOnly: true,
			secure: false, // true in production (HTTPS)
			sameSite: "lax",
		});

		// console.log("yay!!");
		res.redirect("http://localhost:3000/dashboard");
	} catch (error: any) {
		console.log(error ? "true" : "eh");
		console.log(error);
		console.log(error.response?.status);
		console.log(error.response?.config?.url);
		console.log(error.response?.data?.message);
		console.log(error.response?.data?.error);
	}
});

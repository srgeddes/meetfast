#!/usr/bin/env node
const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const util = require("util");
const dotenv = require("dotenv");
const esbuild = require("esbuild");

const execFileAsync = util.promisify(execFile);

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const srcDir = path.join(rootDir, "src");
const stylesDir = path.join(srcDir, "styles");

const { error: dotenvError } = dotenv.config({ path: path.join(rootDir, ".env") });
if (dotenvError) {
	console.warn("[build] .env not found, relying on process environment");
}

const requiredEnvVars = [
	"GOOGLE_OAUTH_CLIENT_ID",
	"GOOGLE_OAUTH_CLIENT_SECRET",
	"GOOGLE_OAUTH_CALLBACK_URL",
];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
	console.error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
	console.error("Create a .env file based on .env.example before building.");
	process.exit(1);
}

const templateFiles = [
	{
		source: path.join(rootDir, "manifest.template.json"),
		destination: path.join(distDir, "manifest.json"),
	},
	{
		source: path.join(srcDir, "lib", "config.template.json"),
		destination: path.join(distDir, "lib", "config.json"),
	},
];

const staticFiles = [
	{
		source: path.join(srcDir, "popup.html"),
		destination: path.join(distDir, "popup.html"),
	},
];

const envValues = new Proxy(process.env, {
	get(target, prop) {
		if (!(prop in target)) {
			throw new Error(`Missing value for template variable ${String(prop)}`);
		}
		return target[prop];
	},
});

async function ensureDir(dirPath) {
	await fs.mkdir(dirPath, { recursive: true });
}

async function cleanDist() {
	await fs.rm(distDir, { recursive: true, force: true });
	await ensureDir(distDir);
}

function applyTemplate(text) {
	return text.replace(/{{\s*([A-Z0-9_]+)\s*}}/g, (_, key) => {
		const value = envValues[key];
		if (typeof value !== "string" || value.length === 0) {
			throw new Error(`Template variable ${key} is empty.`);
		}
		return value;
	});
}

async function processTemplates() {
	for (const { source, destination } of templateFiles) {
		const template = await fs.readFile(source, "utf8");
		const compiled = applyTemplate(template);
		await ensureDir(path.dirname(destination));
		await fs.writeFile(destination, compiled, "utf8");
	}
}

async function copyStaticAssets() {
	for (const { source, destination } of staticFiles) {
		await ensureDir(path.dirname(destination));
		await fs.copyFile(source, destination);
	}
}

async function buildStyles() {
	const tailwindCli = require.resolve("tailwindcss/lib/cli.js");
	const inputCss = path.join(stylesDir, "tailwind.css");
	const outputCss = path.join(distDir, "styles", "popup.css");
	await ensureDir(path.dirname(outputCss));

	const args = [
		tailwindCli,
		"--input",
		inputCss,
		"--output",
		outputCss,
		"--config",
		path.join(rootDir, "tailwind.config.js"),
		"--minify",
	];

	await execFileAsync(process.execPath, args, {
		cwd: rootDir,
	});
}

async function buildScripts() {
	await esbuild.build({
		entryPoints: {
			background: path.join(srcDir, "background", "index.js"),
			popup: path.join(srcDir, "popup", "index.jsx"),
		},
		outdir: distDir,
		bundle: true,
		minify: true,
		format: "esm",
		target: ["chrome117"],
		platform: "browser",
		sourcemap: false,
		jsx: "automatic",
		loader: {
			".jsx": "jsx",
		},
		define: {
			"process.env.NODE_ENV": '"production"',
		},
		logLevel: "info",
	});
}

(async function main() {
	await cleanDist();
	await Promise.all([processTemplates(), copyStaticAssets()]);
	await Promise.all([buildScripts(), buildStyles()]);
	console.log("Build complete. Output available in dist/.");
})().catch((error) => {
	console.error("[build] failed:", error);
	process.exit(1);
});

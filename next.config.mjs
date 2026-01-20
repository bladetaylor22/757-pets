import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        optimizePackageImports: ["@untitledui/icons"],
    },
    turbopack: {
        // Prevent Next from inferring the wrong workspace root when multiple lockfiles exist.
        root: projectRoot,
    },
};

export default nextConfig;

import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [TanStackRouterVite({ routesDirectory: "./src/routes" }), react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("node_modules")) {
						if (id.includes("react-dom") || id.includes("/react/")) return "vendor-react";
						if (id.includes("@tanstack/react-router") || id.includes("@tanstack/router"))
							return "vendor-router";
						if (id.includes("@tanstack/react-table") || id.includes("@tanstack/table"))
							return "vendor-table";
						if (id.includes("@supabase")) return "vendor-supabase";
						if (id.includes("react-day-picker") || id.includes("date-fns")) return "vendor-date";
						if (id.includes("lucide-react")) return "vendor-icons";
						if (id.includes("xlsx")) return "vendor-xlsx";
					}
				},
			},
		},
	},
});

import { createRouter, RouterProvider } from "@tanstack/react-router";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { routeTree } from "./routeTree.gen";

dayjs.locale("ko");

const router = createRouter({ routeTree });

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("#root element not found");

ReactDOM.createRoot(rootElement).render(
	<React.StrictMode>
		<RouterProvider router={router} />
	</React.StrictMode>,
);

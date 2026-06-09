import React from "react";

import ReactDOM from "react-dom/client";

import {
  RouterProvider,
} from "react-router-dom";

import { Toaster }
from "sonner";

import { appRouter }
from "./app/router/app-router";

import { ThemeProvider }
from "./app/providers/theme-provider";

import "./shared/styles/main.scss";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(

  <React.StrictMode>

    <ThemeProvider>

      <RouterProvider
        router={appRouter}
      />

      <Toaster
        position="bottom-right"
        richColors
        closeButton
      />

    </ThemeProvider>

  </React.StrictMode>
);
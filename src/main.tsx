import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./tailwind.config.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GlobalContextProvider } from "@/stores/global.store";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <GlobalContextProvider>
                <App />
            </GlobalContextProvider>
        </QueryClientProvider>
    </StrictMode>
);

import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const baseUrl = process.env.EXPO_BASE_URL?.replace(/\/$/, "") ?? "";

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <script src={`${baseUrl}/env.js`} />
      </head>
      <body>{children}</body>
    </html>
  );
}

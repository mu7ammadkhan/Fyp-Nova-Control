import { Suspense, useEffect } from "react";
import { matchRoutes, Outlet, useLocation, useNavigationType } from "react-router-dom";
import { routeTree } from "../routes/routeTree";
import RouteErrorBoundary from "../routes/RouteErrorBoundary";
import RoutePending from "../components/common/RoutePending";

export default function RootLayout() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    const title = matchRoutes(routeTree, pathname)?.at(-1)?.route.handle?.title;
    document.title = title ? `${title} | Nova Control` : "Nova Control | Smart Home";
    if (!hash && navigationType !== "POP") window.scrollTo(0, 0);
  }, [pathname, hash, navigationType]);
  return <RouteErrorBoundary resetKey={pathname}><Suspense fallback={<RoutePending />}><Outlet /></Suspense></RouteErrorBoundary>;
}

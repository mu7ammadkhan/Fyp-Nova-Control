import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import RouteErrorBoundary from "../routes/RouteErrorBoundary";
import RoutePending from "../components/common/RoutePending";

export default function AppLayout() {
  const { pathname } = useLocation();
  return <>
    <a className="skip-navigation" href="#workspace-content">Skip to content</a>
    <Navbar />
    <div id="workspace-content" tabIndex={-1}>
      <RouteErrorBoundary resetKey={pathname}><Suspense fallback={<RoutePending message="Opening page..." />}><Outlet /></Suspense></RouteErrorBoundary>
    </div>
  </>;
}

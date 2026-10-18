import { Component } from "react";
import { Link } from "react-router-dom";
import { paths } from "./paths";

export default class RouteErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(previous) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="route-message"><span className="workspace-eyebrow">LET’S TRY THAT AGAIN</span><h1>This page couldn’t open.</h1><p>Refresh to load the latest version, or return to your dashboard.</p><div><button className="route-primary-link" onClick={() => window.location.reload()}>Refresh page</button><Link to={paths.dashboard}>Go to dashboard</Link></div></main>;
  }
}

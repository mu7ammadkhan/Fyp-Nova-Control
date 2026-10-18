import { Link } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuth";
import { paths } from "../routes/paths";

export default function NotFound() {
  const { user } = useAuthContext();
  return <main className="route-message"><span className="route-not-found-code">404</span><h1>That page isn’t here.</h1><p>The link may have changed. Let’s get you back to your home controls.</p><Link className="route-primary-link" to={user ? paths.dashboard : paths.login}>{user ? "Back to dashboard" : "Go to sign in"}</Link></main>;
}

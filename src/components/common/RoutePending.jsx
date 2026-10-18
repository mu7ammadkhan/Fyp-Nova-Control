export default function RoutePending({ message = "Opening your workspace..." }) {
  return <div className="route-pending" role="status"><span className="route-loading-mark" aria-hidden="true" /><span>{message}</span></div>;
}

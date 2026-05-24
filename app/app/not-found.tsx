import Link from 'next/link';
import { Button } from '@/src/components/shared/ui';

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__container">
        <div className="not-found__content">
          <div className="not-found__code">404</div>
          <h1 className="not-found__title">Page Not Found</h1>
          <p className="not-found__description">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
          </p>
          <div className="not-found__actions">
            <Link href="/home">
              <Button variant="primary" size="lg">
                Go to Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

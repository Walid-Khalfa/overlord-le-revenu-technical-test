import { FeedSkeleton, LoadingFrame } from '@/components/states';

/** Instant loading UI for the home feed (streams while data resolves). */
export default function HomeLoading() {
  return (
    <LoadingFrame>
      <FeedSkeleton />
    </LoadingFrame>
  );
}

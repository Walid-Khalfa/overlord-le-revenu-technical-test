import { FormSkeleton, LoadingFrame } from '@/components/states';

/** Instant loading UI for the creation form route. */
export default function NewDiscussionLoading() {
  return (
    <LoadingFrame>
      <FormSkeleton />
    </LoadingFrame>
  );
}

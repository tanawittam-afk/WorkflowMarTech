import { Suspense } from "react";

import { ConfirmForm } from "./confirm-form";

export default function BookConfirmPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 font-heading text-2xl font-semibold text-ink">Confirm your booking</h1>
      <Suspense fallback={null}>
        <ConfirmForm />
      </Suspense>
    </div>
  );
}

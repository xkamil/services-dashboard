import { toaster } from "~/app/_components/toaster";

// Success and info toasts are short-lived by default.
const DEFAULT_DURATION = 3000;
// Error toasts linger so the user has time to expand and read the details.
const ERROR_DURATION = 15000;

type ToastOptions = {
  description?: string;
  duration?: number;
};

export function showSuccessToast(title: string, options?: ToastOptions) {
  return toaster.create({
    type: "success",
    title,
    description: options?.description,
    duration: options?.duration ?? DEFAULT_DURATION,
    closable: true,
  });
}

export function showInfoToast(title: string, options?: ToastOptions) {
  return toaster.create({
    type: "info",
    title,
    description: options?.description,
    duration: options?.duration ?? DEFAULT_DURATION,
    closable: true,
  });
}

export function showErrorToast(
  title: string,
  options?: ToastOptions & { details?: string },
) {
  return toaster.create({
    type: "error",
    title,
    description: options?.description,
    duration: options?.duration ?? ERROR_DURATION,
    closable: true,
    meta: options?.details ? { details: options.details } : undefined,
  });
}

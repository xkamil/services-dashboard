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

type ToastMutationConfig<TData, TVariables> = {
  successTitle: string;
  /** Built from the mutation result and variables at success time. */
  successDescription?: (
    data: TData,
    variables: TVariables,
  ) => string | undefined;
  errorTitle: string;
  /** Static text, or derived from the error (e.g. to map server codes). */
  errorDescription: string | ((error: { message: string }) => string);
  /** Runs before the success toast — invalidate caches, close dialogs. */
  onDone?: (data: TData, variables: TVariables) => void | Promise<void>;
};

/**
 * Builds the `onSuccess` / `onError` options shared by every mutation that
 * reports through toasts: run cleanup (`onDone`), then show a success toast;
 * on failure show an error toast carrying the raw message as details.
 */
export function toastMutationOptions<TData = unknown, TVariables = unknown>(
  config: ToastMutationConfig<TData, TVariables>,
) {
  return {
    onSuccess: async (data: TData, variables: TVariables) => {
      await config.onDone?.(data, variables);
      showSuccessToast(config.successTitle, {
        description: config.successDescription?.(data, variables),
      });
    },
    onError: (error: { message: string }) => {
      showErrorToast(config.errorTitle, {
        description:
          typeof config.errorDescription === "string"
            ? config.errorDescription
            : config.errorDescription(error),
        details: error.message,
      });
    },
  };
}

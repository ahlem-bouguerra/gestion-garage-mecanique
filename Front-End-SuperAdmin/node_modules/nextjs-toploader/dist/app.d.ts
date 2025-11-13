import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Custom useRouter hook to work with NextTopLoader
 * Compatible with app router only.
 * Solution Provided by @sho-pb
 * @returns {AppRouterInstance}
 */
declare const useRouter: () => AppRouterInstance;

export { useRouter };

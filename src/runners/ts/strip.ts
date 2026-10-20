import { transform } from 'sucrase';

// Type-only removal; sucrase preserves line numbers, so error lines still match the learner's code.
export const stripTypes = (code: string) => transform(code, { transforms: ['typescript'], disableESTransforms: true }).code;

import ts from 'typescript-eslint';
export default ts.config({ ignores: ['dist', 'node_modules', 'playwright-report', 'test-results'] }, ...ts.configs.recommended, { rules: { '@typescript-eslint/no-explicit-any': 'off' } });

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'src/game/platform/river-sdk.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);

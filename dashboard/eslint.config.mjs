import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * ESLint 설정
 * 
 * Next.js 기본 설정에 추가 규칙을 적용하여 코드 품질을 향상시킵니다.
 * - TypeScript 타입 안전성 강화
 * - React Hooks 규칙 강화
 * - 코드 스타일 일관성 유지
 * - 미사용 코드 경고
 */
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // 콘솔 로그 규칙
      // console.error와 console.warn은 허용 (디버깅 및 에러 로깅용)
      // console.log는 경고로 처리
      "no-console": [
        "warn",
        {
          allow: ["error", "warn"],
        },
      ],

      // TypeScript 규칙
      // any 타입 사용 경고 (포트폴리오에서 타입 안전성 강조)
      "@typescript-eslint/no-explicit-any": "warn",
      
      // 미사용 변수 에러
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // React Hooks 규칙
      // 의존성 배열 누락 경고
      "react-hooks/exhaustive-deps": "warn",
      
      // React 관련 규칙
      // 불필요한 Fragment 제거
      "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
      
      // 일관된 화살표 함수 사용 (컴포넌트는 함수 선언식 허용)
      "react/function-component-definition": "off",
      
      // 코드 스타일 규칙
      // 변수 선언 전 사용 금지
      "no-use-before-define": "off",
      "@typescript-eslint/no-use-before-define": ["error"],
      
      // 일관된 반환값 (함수가 항상 값을 반환하도록)
      "consistent-return": ["warn", { treatUndefinedAsUnspecified: true }],
      
      // 중복 키 금지
      "no-dupe-keys": "error",
      
      // 중복 케이스 금지
      "no-duplicate-case": "error",
      
      // 빈 블록 경고 (빈 catch는 _ 변수 사용 허용)
      "no-empty": ["warn", { allowEmptyCatch: true }],
      
      // 불필요한 else 제거 (코드 가독성 향상)
      "no-else-return": "warn",
      
      // 미사용 변수 경고
      "no-unused-vars": "off", // TypeScript 규칙 사용
      
      // import 정렬 (선택 사항)
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
  {
    // 특정 파일/폴더에 대한 규칙 예외
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "*.config.{js,mjs,ts}",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;

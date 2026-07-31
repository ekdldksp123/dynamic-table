/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: 'jsdom',
  // 기본값은 __tests__ 안의 모든 파일을 테스트로 본다. fixture 를 나란히
  // 두려면 *.test.* 만 테스트로 잡아야 한다.
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transform: {
    // 소스가 .tsx 이므로 jsx/commonjs 설정을 넘겨준다.
    // 루트 tsconfig.json 은 프로젝트 참조용이라 jsx 를 정의하지 않는다.
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowImportingTsExtensions: false,
          strict: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^.+\\.svg$': 'jest-svg-transformer',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

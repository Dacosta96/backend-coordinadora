module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        es6: true,
    },
    extends: ['airbnb-base', 'prettier', 'plugin:node/recommended'],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
    },
    parserOptions: {
        ecmaVersion: 2021,
    },
    plugins: ['prettier'],
    rules: {
        'prettier/prettier': [
            'error',
            {
                endOfLine: 'auto',
            },
        ],
        'no-unused-vars': 'warn',
        'no-console': 'off',
        'func-names': 'off',
        'no-plusplus': 'off',
        'no-process-exit': 'off',
        'class-methods-use-this': 'off',
        'no-underscore-dangle': 'off',
        'import/no-extraneous-dependencies': 'off',
        'prefer-destructuring': 'off',
        'consistent-return': 'off',
    },
};

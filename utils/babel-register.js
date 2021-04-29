require('@babel/register')({
  extensions: ['.js', '.ts'],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
});

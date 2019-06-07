const path = require('path');
const sass = require('node-sass');
const fibers = require('fibers');
const postcssPresetEnv = require('postcss-preset-env');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const WebpackDeleteAfterEmit = require('webpack-delete-after-emit');

const devMode = process.env.NODE_ENV !== 'production';

const { webpackBundles } = require('./config');

const cssPackageBundler = () =>
  webpackBundles.packagesList.map(pkg => {
    const pkgPath = pkg.startsWith('and')
      ? `./packages/${pkg}`
      : `./packages/and-${pkg}`;
    const filename = `and.${pkg}`;

    return {
      mode: 'production',
      entry: {
        [filename]: path.resolve(__dirname, `${pkgPath}/${pkg}.scss`)
      },
      output: {
        path: path.resolve(__dirname, `${pkgPath}/dist/`)
      },
      devtool: 'source-map',
      module: {
        rules: [
          {
            test: /\.scss$/,
            use: [
              MiniCssExtractPlugin.loader,
              {
                loader: 'css-loader',
                options: {
                  sourceMap: true
                }
              },
              {
                loader: 'postcss-loader',
                options: {
                  ident: 'postcss',
                  plugins: () => [postcssPresetEnv()],
                  sourceMap: true
                }
              },
              {
                loader: 'sass-loader',
                options: {
                  includePaths: [
                    path.join(__dirname, 'node_modules/normalize-scss/sass')
                  ],
                  implementation: sass,
                  fiber: fibers,
                  sourceMap: true,
                  functions: {
                    'get($keys)': mapJsVarsToSass
                  }
                }
              }
            ]
          }
        ]
      },
      plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
          filename: devMode ? '[name].css' : '[name].css',
          chunkFilename: devMode ? '[id].css' : '[name].css'
        }),
        // new OptimizeCSSAssetsPlugin({
        //   cssProcessorOptions: {
        //     map: { inline: false } // generate sourcemap use an external file
        //   }
        // })
        new WebpackDeleteAfterEmit({ globs: ['*.js*'] })
      ]
    };
  });

const componentPackageBundler = () =>
  webpackBundles.componentsList.map(pkg => {
    const pkgPath = `./components/${pkg}`;
    const pkgName = pkg.charAt(0).toUpperCase() + pkg.slice(1);
    const libName = `And${pkgName}`;
    return {
      mode: 'production',
      entry: {
        [libName]: `${pkgPath}/index.jsx`
      },
      output: {
        path: path.resolve(__dirname, `${pkgPath}/dist/`),
        filename: '[name].js',
        library: libName,
        libraryTarget: 'umd',
        publicPath: '/dist/',
        umdNamedDefine: true
      },
      devtool: 'source-map',
      module: {
        rules: [
          {
            test: /\.(js|jsx)$/,
            exclude: /(node_modules|bower_components)/,
            use: {
              loader: 'babel-loader',
              options: {
                rootMode: 'upward',
                sourceMaps: true
              }
            }
          },
          {
            test: /\.(scss|css)$/,
            use: ['style-loader', 'css-loader']
          }
        ]
      },
      plugins: [new CleanWebpackPlugin()],
      resolve: {
        // these alias are only used by the packages side the components folder.
        // don't include packages in next-client folder.
        alias: {
          $config: path.resolve(__dirname, 'config'),
          $packages: path.resolve(__dirname, 'packages'),
          '@dl': path.resolve(__dirname, './node_modules/@dl'),
          react: path.resolve(__dirname, './node_modules/react'),
          'react-dom': path.resolve(__dirname, './node_modules/react-dom')
        }
      },
      externals: {
        React: {
          commonjs: 'react',
          commonjs2: 'react',
          amd: 'React',
          root: 'React'
        },
        'react-dom': {
          commonjs: 'react-dom',
          commonjs2: 'react-dom',
          amd: 'ReactDOM',
          root: 'ReactDOM'
        },
        [`@dl/${pkg}`]: {
          commonjs: `@dl/${pkg}`,
          commonjs2: `@dl/${pkg}`,
          amd: `@dl/${pkg}`,
          root: `@dl/${pkg}`
        }
      }
    };
  });

module.exports = [...cssPackageBundler(), ...componentPackageBundler()];

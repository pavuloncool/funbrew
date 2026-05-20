const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Pin expo-router for Metro when pnpm’s layout leaves the resolver on a weak path
// (e.g. UnableToResolveError from route-group files under app/).
try {
  const expoRouterRoot = path.dirname(
    require.resolve('expo-router/package.json', { paths: [projectRoot] })
  );
  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules ?? {}),
    'expo-router': expoRouterRoot,
  };
} catch {
  // Fall back to default resolution if the package is missing.
}

module.exports = config;


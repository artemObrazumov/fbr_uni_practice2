export function resolveApiOrigin({
  nodeEnv,
  configuredOrigin,
  allowDirectApi,
}) {
  if (nodeEnv === 'development' && !allowDirectApi) {
    return '';
  }
  return configuredOrigin || '';
}

export function getApiOriginFromEnv(env = process.env) {
  return resolveApiOrigin({
    nodeEnv: env.NODE_ENV,
    configuredOrigin: env.REACT_APP_API_ORIGIN,
    allowDirectApi: String(env.REACT_APP_USE_DIRECT_API || '').trim() === '1',
  });
}

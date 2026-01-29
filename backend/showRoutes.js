const app = require('./index');
const mounts = app._mountedRouters || [];
const mount = mounts.find(m => m.basePath === '/api/websites');
if (!mount) {
  console.error('no /api/websites mount');
  process.exit(1);
}
console.log('ROUTES for /api/websites:');
(mount.router.stack || []).forEach(layer => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
    console.log(methods, layer.route.path);
  } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
    layer.handle.stack.forEach(l => {
      if (l.route) {
        const methods = Object.keys(l.route.methods).join(',').toUpperCase();
        console.log(methods, l.route.path);
      }
    });
  }
});

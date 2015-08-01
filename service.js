var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'Node.js: Ciclos da Vida',
  description: 'App Ciclos da Vida',
  script: 'C:\\GitHub\\ciclosdavida\\server.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall',function(){
  console.log('Uninstall complete.');
  console.log('The service exists: ',svc.exists);
});

svc.install();
// svc.uninstall();

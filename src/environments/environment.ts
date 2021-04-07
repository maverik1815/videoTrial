// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  SERVER_URI: 'http://localhost:3000',
  SUBTITLE_TIME: 3,
  CHUNK_SIZE:  1 * 1024 * 1024, // 1 MB = 1024 * 1024
  refreshCheckInterval: 120, // time interval in seconds when token will be refreshed before expiry time
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.

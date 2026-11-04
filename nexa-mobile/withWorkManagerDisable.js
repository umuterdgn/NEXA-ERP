const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withWorkManagerDisable(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Ensure xmlns:tools namespace is defined on manifest
    if (!manifest.$) {
      manifest.$ = {};
    }
    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    const application = manifest.application?.[0];
    if (application) {
      if (!application.provider) {
        application.provider = [];
      }

      // Find or create androidx.startup.InitializationProvider
      let provider = application.provider.find(
        (p) => p.$ && p.$["android:name"] === "androidx.startup.InitializationProvider"
      );

      if (!provider) {
        provider = {
          $: {
            "android:name": "androidx.startup.InitializationProvider",
            "android:authorities": "${applicationId}.androidx-startup",
            "android:exported": "false",
            "tools:node": "merge",
          },
          "meta-data": [],
        };
        application.provider.push(provider);
      } else {
        provider.$["tools:node"] = "merge";
        if (!provider["meta-data"]) {
          provider["meta-data"] = [];
        }
      }

      // Ensure WorkManagerInitializer is removed via tools:node="remove"
      const metaData = provider["meta-data"];
      const hasWorkManagerInit = metaData.some(
        (m) => m.$ && m.$["android:name"] === "androidx.work.WorkManagerInitializer"
      );

      if (!hasWorkManagerInit) {
        metaData.push({
          $: {
            "android:name": "androidx.work.WorkManagerInitializer",
            "android:value": "androidx.startup",
            "tools:node": "remove",
          },
        });
      }
    }

    return config;
  });
};

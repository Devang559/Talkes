#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const nodeModules = path.join(__dirname, '..', 'node_modules');

const patches = [
  {
    name: '@react-native-async-storage/async-storage',
    file: 'android/build.gradle',
    fixes: [
      [/compileSdkVersion project\.ext\.AsyncStorageConfig\.compileSdkVersion/,
       'compileSdk project.ext.AsyncStorageConfig.compileSdkVersion'],
      [/lintOptions \{/, 'lint {'],
      [/namespace "com\.reactnativecommunity\.asyncstorage"/,
       'namespace = "com.reactnativecommunity.asyncstorage"'],
      [/buildConfig true/, 'buildConfig = true'],
      [/ndkPath rootProject\.ext\.ndkPath/, 'ndkPath = rootProject.ext.ndkPath'],
      [/ndkVersion rootProject\.ext\.ndkVersion/, 'ndkVersion = rootProject.ext.ndkVersion'],
      [/minSdkVersion project\.ext\.AsyncStorageConfig\.minSdkVersion/,
       'minSdkVersion = project.ext.AsyncStorageConfig.minSdkVersion'],
      [/targetSdkVersion project\.ext\.AsyncStorageConfig\.targetSdkVersion/,
       'targetSdkVersion = project.ext.AsyncStorageConfig.targetSdkVersion'],
      [/abortOnError false/, 'abortOnError = false'],
      [/url "\$\{project\.ext\.resolveModulePath\("react-native"\)\}\/android"/,
       'url = "${project.ext.resolveModulePath("react-native")}/android"'],
    ],
  },
  {
    name: 'react-native-ble-plx',
    file: 'android/build.gradle',
    fixes: [
      [/compileSdkVersion getExtOrIntegerDefault\("compileSdkVersion"\)/,
       'compileSdk getExtOrIntegerDefault("compileSdkVersion")'],
      [/lintOptions \{/, 'lint {'],
      [/namespace "com\.bleplx"/, 'namespace = "com.bleplx"'],
      [/minSdkVersion getExtOrIntegerDefault\("minSdkVersion"\)/,
       'minSdkVersion = getExtOrIntegerDefault("minSdkVersion")'],
      [/targetSdkVersion getExtOrIntegerDefault\("targetSdkVersion"\)/,
       'targetSdkVersion = getExtOrIntegerDefault("targetSdkVersion")'],
    ],
  },
  {
    name: 'react-native-document-picker',
    file: 'android/build.gradle',
    fixes: [
      [/compileSdkVersion getExtOrIntegerDefault\('compileSdkVersion'\)/,
       'compileSdk getExtOrIntegerDefault(\'compileSdkVersion\')'],
      [/namespace "com\.reactnativedocumentpicker"/,
       'namespace = "com.reactnativedocumentpicker"'],
      [/ndkPath rootProject\.ext\.ndkPath/, 'ndkPath = rootProject.ext.ndkPath'],
      [/ndkVersion rootProject\.ext\.ndkVersion/, 'ndkVersion = rootProject.ext.ndkVersion'],
      [/minSdkVersion getExtOrIntegerDefault\('minSdkVersion'\)/,
       'minSdkVersion = getExtOrIntegerDefault(\'minSdkVersion\')'],
      [/targetSdkVersion getExtOrIntegerDefault\('targetSdkVersion'\)/,
       'targetSdkVersion = getExtOrIntegerDefault(\'targetSdkVersion\')'],
    ],
  },
  {
    name: 'react-native-safe-area-context',
    file: 'android/build.gradle',
    fixes: [
      [/compileSdkVersion getExtOrDefault\('compileSdkVersion', 30\)/,
       'compileSdk getExtOrDefault(\'compileSdkVersion\', 30)'],
      [/lintOptions\{/, 'lint {'],
      [/namespace "com\.th3rdwave\.safeareacontext"/,
       'namespace = "com.th3rdwave.safeareacontext"'],
      [/buildConfig true/, 'buildConfig = true'],
      [/ndkPath rootProject\.ext\.ndkPath/, 'ndkPath = rootProject.ext.ndkPath'],
      [/ndkVersion rootProject\.ext\.ndkVersion/, 'ndkVersion = rootProject.ext.ndkVersion'],
      [/minSdkVersion getExtOrDefault\('minSdkVersion', 16\)/,
       'minSdkVersion = getExtOrDefault(\'minSdkVersion\', 16)'],
      [/targetSdkVersion getExtOrDefault\('targetSdkVersion', 28\)/,
       'targetSdkVersion = getExtOrDefault(\'targetSdkVersion\', 28)'],
      [/abortOnError false/, 'abortOnError = false'],
      [/url "\$rootDir\/\.\.\/node_modules\/react-native\/android"/,
       'url = "$rootDir/../node_modules/react-native/android"'],
    ],
  },
];

let anyPatched = false;

for (const { name, file, fixes } of patches) {
  const filePath = path.join(nodeModules, name, file);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  for (const [pattern, replacement] of fixes) {
    content = content.replace(pattern, replacement);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Patched ${name} build.gradle`);
    anyPatched = true;
  }
}

// Add Room dependencies to AsyncStorage outside the useNextStorage guard
// so that StorageSupplier.kt (which is in src/main/java and always compiled)
// can resolve Room and SQLite imports on Gradle 10 / AGP 9+.
const asyncStorageGradlePath = path.join(
  nodeModules,
  '@react-native-async-storage',
  'async-storage',
  'android',
  'build.gradle'
);

if (fs.existsSync(asyncStorageGradlePath)) {
  let gradle = fs.readFileSync(asyncStorageGradlePath, 'utf8');
  const originalGradle = gradle;

  if (!gradle.includes('androidx.room:room-runtime:2.6.1"')) {
    gradle = gradle.replace(
      /dependencies \{\n    if \(useNextStorage\)/,
      'dependencies {\n' +
        '    implementation "androidx.room:room-runtime:2.6.1"\n' +
        '    implementation "androidx.room:room-ktx:2.6.1"\n' +
        '\n    if (useNextStorage)'
    );
    console.log('Added Room dependencies to async-storage build.gradle');
    anyPatched = true;
  }

  if (gradle !== originalGradle) {
    fs.writeFileSync(asyncStorageGradlePath, gradle, 'utf8');
  }
}

if (!anyPatched) {
  console.log('No patches needed');
}

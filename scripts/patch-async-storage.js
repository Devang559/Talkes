#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const asyncStorageBuildGradle = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-async-storage',
  'async-storage',
  'android',
  'build.gradle'
);

if (fs.existsSync(asyncStorageBuildGradle)) {
  let content = fs.readFileSync(asyncStorageBuildGradle, 'utf8');
  const original = content;

  // Remove explicit kotlin-android plugin application (conflicts with RN Gradle Plugin which
  // already applies Kotlin from the root classpath)
  content = content.replace(/\n[\s\t]*apply plugin: ["']kotlin-android["']\n/g, '\n');

  // Keep a valid AGP classpath version for the AsyncStorage Gradle buildscript.
  // React Native 0.87 uses Android Gradle Plugin 8.7.2.
  content = content.replace(
    /classpath\s+["']com\.android\.tools\.build:gradle(?::[\d.]+)?["']/g,
    'classpath "com.android.tools.build:gradle:8.7.2"'
  );

  // Fix compileSdk to use rootProject.ext (more reliable than project.ext.AsyncStorage)
  content = content.replace(
    /compileSdk\s*=\s*project\.ext\.AsyncStorage\.compileSdk/g,
    "compileSdk = rootProject.ext.has('compileSdkVersion') ? rootProject.ext.compileSdkVersion : 35"
  );

  if (content !== original) {
    fs.writeFileSync(asyncStorageBuildGradle, content, 'utf8');
    console.log('Patched @react-native-async-storage/async-storage android/build.gradle');
  }
}

const gradlePropertiesPath = path.join(__dirname, '..', 'android', 'gradle.properties');

if (fs.existsSync(gradlePropertiesPath)) {
  let content = fs.readFileSync(gradlePropertiesPath, 'utf8');
  const original = content;

  // Ensure android.builtInKotlin and android.newDsl are present with proper = syntax
  if (!content.includes('android.builtInKotlin')) {
    content += '\nandroid.builtInKotlin = false\n';
  }
  if (!content.includes('android.newDsl')) {
    content += '\nandroid.newDsl = false\n';
  }

  // Fix any space-assignment syntax to proper = syntax
  content = content.replace(/android\.builtInKotlin\s+false/g, 'android.builtInKotlin = false');
  content = content.replace(/android\.newDsl\s+false/g, 'android.newDsl = false');

  if (content !== original) {
    fs.writeFileSync(gradlePropertiesPath, content, 'utf8');
    console.log('Patched android/gradle.properties');
  }
}

const gradleWrapperProperties = path.join(__dirname, '..', 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');

if (fs.existsSync(gradleWrapperProperties)) {
  let content = fs.readFileSync(gradleWrapperProperties, 'utf8');

  if (!content.includes('distributionUrl=https\\://services.gradle.org')) {
    content = content.replace(
      /distributionUrl=.*/g,
      'distributionUrl=https\\://services.gradle.org/gradle-8.13-all.zip'
    );
    fs.writeFileSync(gradleWrapperProperties, content, 'utf8');
    console.log('Updated Gradle wrapper to 8.13');
  }
}

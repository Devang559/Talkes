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

  // Fix deprecated Groovy space-assignment syntax (propName value -> propName = value)
  content = content.replace(/\n\s*android\.builtInKotlin\s*\n/g, '\n');
  content = content.replace(/\n\s*android\.newDsl\s*\n/g, '\n');

  // Align AGP classpath version to avoid conflicts with root project
  content = content.replace(
    /classpath\s+["']com\.android\.tools\.build:gradle:[\d.]+["']/g,
    'classpath "com.android.tools.build:gradle"'
  );

  if (content !== original) {
    fs.writeFileSync(asyncStorageBuildGradle, content, 'utf8');
    console.log('Patched @react-native-async-storage/async-storage android/build.gradle');
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

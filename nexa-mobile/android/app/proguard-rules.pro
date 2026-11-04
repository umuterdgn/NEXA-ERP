# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# WorkManager ve Room (Veritabanı) sınıflarını kesinlikle koru
-keep class androidx.work.** { *; }
-keep class androidx.room.** { *; }
-keep class androidx.sqlite.** { *; }
-keep class androidx.startup.** { *; }

# WorkManager'ın başlatıcı (Initializer) sınıflarını şifreleme
-keep class androidx.work.impl.WorkDatabase { *; }
-keep class androidx.work.WorkManagerInitializer { *; }
-keep class androidx.startup.InitializationProvider { *; }

# Gerekli uyarıları gizle
-dontwarn androidx.work.**
-dontwarn androidx.room.**
-dontwarn androidx.sqlite.**

# Add any project specific keep options here:

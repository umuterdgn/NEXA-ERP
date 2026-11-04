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

package com.hiteshjoshi.tracker

import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.*
import java.util.*

class ScreenTimeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ScreenTime"
    }

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val calendar = Calendar.getInstance()
            val endTime = calendar.timeInMillis
            val startTime = endTime - (24 * 60 * 60 * 1000) // 24 hours ago
            
            val queryUsageStats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)
            val hasPermission = queryUsageStats.isNotEmpty()
            
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestUsageStatsPermission() {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        } catch (e: Exception) {
            // Handle error silently
        }
    }

    @ReactMethod
    fun getScreenTimeData(promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            
            // Today's data
            val calendar = Calendar.getInstance()
            calendar.set(Calendar.HOUR_OF_DAY, 0)
            calendar.set(Calendar.MINUTE, 0)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            val startToday = calendar.timeInMillis
            val endToday = System.currentTimeMillis()
            
            // This week's data
            val weekCalendar = Calendar.getInstance()
            weekCalendar.add(Calendar.DAY_OF_YEAR, -7)
            val startWeek = weekCalendar.timeInMillis
            
            val todayStats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startToday, endToday)
            val weekStats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startWeek, endToday)
            
            var todayScreenTime = 0L
            var weekScreenTime = 0L
            var firstUseToday = Long.MAX_VALUE
            var lastUseYesterday = 0L
            
            // Calculate today's screen time and first use
            for (usageStats in todayStats) {
                if (usageStats.totalTimeInForeground > 0) {
                    todayScreenTime += usageStats.totalTimeInForeground
                    if (usageStats.firstTimeStamp in startToday..endToday && usageStats.firstTimeStamp < firstUseToday) {
                        firstUseToday = usageStats.firstTimeStamp
                    }
                }
            }
            
            // Calculate week's screen time
            for (usageStats in weekStats) {
                weekScreenTime += usageStats.totalTimeInForeground
            }
            
            // Get yesterday's last use
            val yesterdayCalendar = Calendar.getInstance()
            yesterdayCalendar.add(Calendar.DAY_OF_YEAR, -1)
            yesterdayCalendar.set(Calendar.HOUR_OF_DAY, 0)
            yesterdayCalendar.set(Calendar.MINUTE, 0)
            yesterdayCalendar.set(Calendar.SECOND, 0)
            yesterdayCalendar.set(Calendar.MILLISECOND, 0)
            val startYesterday = yesterdayCalendar.timeInMillis
            
            yesterdayCalendar.set(Calendar.HOUR_OF_DAY, 23)
            yesterdayCalendar.set(Calendar.MINUTE, 59)
            yesterdayCalendar.set(Calendar.SECOND, 59)
            val endYesterday = yesterdayCalendar.timeInMillis
            
            val yesterdayStats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startYesterday, endYesterday)
            for (usageStats in yesterdayStats) {
                if (usageStats.lastTimeUsed in startYesterday..endYesterday && usageStats.lastTimeUsed > lastUseYesterday) {
                    lastUseYesterday = usageStats.lastTimeUsed
                }
            }
            
            val result = WritableNativeMap().apply {
                putDouble("todayScreenTime", (todayScreenTime / (1000 * 60)).toDouble()) // Convert to minutes
                putDouble("weekScreenTime", (weekScreenTime / (1000 * 60)).toDouble()) // Convert to minutes
                putDouble("firstUseToday", if (firstUseToday == Long.MAX_VALUE) 0.0 else firstUseToday.toDouble())
                putDouble("lastUseYesterday", lastUseYesterday.toDouble())
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}
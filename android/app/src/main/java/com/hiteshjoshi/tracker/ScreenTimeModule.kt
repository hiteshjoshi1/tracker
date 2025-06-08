package com.hiteshjoshi.tracker

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*
import java.util.*

class ScreenTimeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    companion object {
        private const val TAG = "ScreenTimeModule"
    }

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
            Log.e(TAG, "Error checking permission", e)
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
            Log.e(TAG, "Error opening settings", e)
        }
    }

    @ReactMethod
    fun getScreenTimeData(promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            
            // Today's data - from midnight to now
            val calendarToday = Calendar.getInstance()
            calendarToday.set(Calendar.HOUR_OF_DAY, 0)
            calendarToday.set(Calendar.MINUTE, 0)
            calendarToday.set(Calendar.SECOND, 0)
            calendarToday.set(Calendar.MILLISECOND, 0)
            val startToday = calendarToday.timeInMillis
            val endToday = System.currentTimeMillis()
            
            // Yesterday's data - full day
            val calendarYesterday = Calendar.getInstance()
            calendarYesterday.add(Calendar.DAY_OF_YEAR, -1)
            calendarYesterday.set(Calendar.HOUR_OF_DAY, 0)
            calendarYesterday.set(Calendar.MINUTE, 0)
            calendarYesterday.set(Calendar.SECOND, 0)
            calendarYesterday.set(Calendar.MILLISECOND, 0)
            val startYesterday = calendarYesterday.timeInMillis
            
            calendarYesterday.add(Calendar.DAY_OF_YEAR, 1) // Move back to end of yesterday
            val endYesterday = calendarYesterday.timeInMillis
            
            // This week's data
            val calendarWeek = Calendar.getInstance()
            calendarWeek.add(Calendar.DAY_OF_YEAR, -7)
            calendarWeek.set(Calendar.HOUR_OF_DAY, 0)
            calendarWeek.set(Calendar.MINUTE, 0)
            calendarWeek.set(Calendar.SECOND, 0)
            calendarWeek.set(Calendar.MILLISECOND, 0)
            val startWeek = calendarWeek.timeInMillis
            
            // Get usage stats
            val todayStats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_BEST, startToday, endToday)
            val yesterdayStats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_BEST, startYesterday, endYesterday)
            val weekStats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_WEEKLY, startWeek, endToday)
            
            var todayScreenTime = 0L
            var yesterdayScreenTime = 0L
            var weekScreenTime = 0L
            
            // Calculate today's screen time
            for (usageStats in todayStats) {
                if (usageStats.totalTimeInForeground > 0) {
                    todayScreenTime += usageStats.totalTimeInForeground
                }
            }
            
            // Calculate yesterday's screen time
            for (usageStats in yesterdayStats) {
                if (usageStats.totalTimeInForeground > 0) {
                    yesterdayScreenTime += usageStats.totalTimeInForeground
                }
            }
            
            // Calculate week's screen time
            for (usageStats in weekStats) {
                if (usageStats.totalTimeInForeground > 0) {
                    weekScreenTime += usageStats.totalTimeInForeground
                }
            }
            
            // Get first use today using UsageEvents
            var firstUseToday = 0L
            val todayEvents = usageStatsManager.queryEvents(startToday, endToday)
            
            while (todayEvents.hasNextEvent()) {
                val event = UsageEvents.Event()
                todayEvents.getNextEvent(event)
                
                // Look for first MOVE_TO_FOREGROUND or ACTIVITY_RESUMED event
                if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND || 
                    event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                    if (firstUseToday == 0L || event.timeStamp < firstUseToday) {
                        firstUseToday = event.timeStamp
                    }
                }
            }
            
            // If no events found, check usage stats
            if (firstUseToday == 0L) {
                for (usageStats in todayStats) {
                    if (usageStats.firstTimeStamp in startToday..endToday && 
                        (firstUseToday == 0L || usageStats.firstTimeStamp < firstUseToday)) {
                        firstUseToday = usageStats.firstTimeStamp
                    }
                }
            }
            
            // Get last use yesterday using UsageEvents
            var lastUseYesterday = 0L
            val yesterdayEvents = usageStatsManager.queryEvents(startYesterday, endYesterday)
            
            while (yesterdayEvents.hasNextEvent()) {
                val event = UsageEvents.Event()
                yesterdayEvents.getNextEvent(event)
                
                // Look for last MOVE_TO_BACKGROUND or ACTIVITY_PAUSED event
                if (event.eventType == UsageEvents.Event.MOVE_TO_BACKGROUND || 
                    event.eventType == UsageEvents.Event.ACTIVITY_PAUSED) {
                    if (event.timeStamp > lastUseYesterday) {
                        lastUseYesterday = event.timeStamp
                    }
                }
            }
            
            // Fallback: use stats if no events found
            if (lastUseYesterday == 0L) {
                for (usageStats in yesterdayStats) {
                    if (usageStats.lastTimeUsed > lastUseYesterday && 
                        usageStats.totalTimeInForeground > 0 &&
                        usageStats.lastTimeUsed in startYesterday..endYesterday) {
                        lastUseYesterday = usageStats.lastTimeUsed
                    }
                }
            }
            
            val result = WritableNativeMap().apply {
                putDouble("todayScreenTime", (todayScreenTime / (1000 * 60)).toDouble()) // Convert to minutes
                putDouble("yesterdayScreenTime", (yesterdayScreenTime / (1000 * 60)).toDouble()) // Convert to minutes
                putDouble("weekScreenTime", (weekScreenTime / (1000 * 60)).toDouble()) // Convert to minutes
                putDouble("firstUseToday", firstUseToday.toDouble())
                putDouble("lastUseYesterday", lastUseYesterday.toDouble())
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Error getting screen time data", e)
            promise.reject("ERROR", e.message)
        }
    }
}
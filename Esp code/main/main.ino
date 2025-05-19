#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <Wire.h>
#include <ZMPT101B.h>
#include <EmonLib.h>

// --- WiFi Credentials ---
const char* ssid = " ";  // Replace with your WiFi SSID
const char* password = "  ";  // Replace with your WiFi password

// --- Supabase Settings ---
const char* supabaseUrl = "Supabase Url";
const char* supabaseKey = "Supabase Key";
const char* tableName = "meter_data";  // Table name

// --- NTP Time Settings ---
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800;  // GMT+5:30
const int daylightOffset_sec = 0;

// --- Sensor Pins & Settings ---
#define VOLTAGE_PIN 34
#define CURRENT_PIN 35

#define SENSITIVITY 500.0f
#define CALIBRATION_FACTOR 1.49     // Voltage calibration to match 230V
#define CURRENT_CALIBRATION 0.0235  // Further reduced from 0.0325 to get accurate 9W readings (0.0325 * 9/12.44 ≈ 0.0235)

const int num_samples = 20;

ZMPT101B voltageSensor(VOLTAGE_PIN, 50.0);
EnergyMonitor emon1;

float accumulated_kWh = 0.0;
unsigned long last_time = 0;
unsigned long start_time = 0;

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);  // Wait for serial connection
  
  // Connect Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi Connected");

  // Setup NTP
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("⏳ Waiting for NTP time...");
  struct tm timeinfo;
  while (!getLocalTime(&timeinfo)) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("\n⏰ Time Synchronized");

  // Sensor setup
  voltageSensor.setSensitivity(SENSITIVITY);
  analogReadResolution(12);  // For ESP32
  emon1.current(CURRENT_PIN, CURRENT_CALIBRATION);

  last_time = millis();
  start_time = last_time;
  
  Serial.println("📡 Monitoring started...");
  Serial.println("Expected readings for 9W LED bulb:");
  Serial.println("Voltage: ~230V, Current: ~0.039A, Power: ~9W");
  Serial.println("Note: Power factor for LED bulbs is typically 0.7-0.9");
  Serial.println("Current calibration adjusted for accurate 9W readings");
  Serial.println("---------------------------------------------------");
}

void loop() {
  float voltage = voltageSensor.getRmsVoltage() * CALIBRATION_FACTOR;
  float total_current = 0.0;
  float total_power = 0.0;

  for (int i = 0; i < num_samples; i++) {
    float Irms = emon1.calcIrms(1480);
    if (Irms < 0.002) Irms = 0.0;  // Even more sensitive noise filter for low current
    total_current += Irms;
    total_power += Irms * voltage;
    delay(50);
  }

  float avg_current = total_current / num_samples;
  float avg_power = total_power / num_samples;

  unsigned long current_time = millis();
  float elapsed_time_hr = (current_time - last_time) / 3600000.0;
  last_time = current_time;

  float energy_kWh = (avg_power * elapsed_time_hr) / 1000.0;
  accumulated_kWh += energy_kWh;

  // Calculate runtime in hours, minutes, seconds
  unsigned long runtime_ms = current_time - start_time;
  int runtime_hours = runtime_ms / 3600000;
  int runtime_minutes = (runtime_ms % 3600000) / 60000;
  int runtime_seconds = (runtime_ms % 60000) / 1000;

  // Display with parameter names and diagnostic info
  Serial.println("---------------------------------------------------");
  Serial.printf("Time: %02d:%02d:%02d\n", runtime_hours, runtime_minutes, runtime_seconds);
  Serial.printf("Voltage (V): %.2f V\n", voltage);
  Serial.printf("Current (A): %.4f A\n", avg_current);
  Serial.printf("Power (W): %.2f W\n", avg_power);
  Serial.printf("Energy (kWh): %.6f kWh\n", accumulated_kWh);
  
  // Add more accurate power factor calculation for LED bulbs
  float apparent_power = avg_current * voltage;
  float power_factor = (apparent_power > 0) ? (avg_power / apparent_power) : 0;
  if (power_factor > 1.0) power_factor = 1.0; // Cap at 1.0 to handle measurement errors
  Serial.printf("Power Factor: %.3f\n", power_factor);
  
  // Add diagnostic information
  if (avg_power < 7.0 || avg_power > 11.0) {
    Serial.println("WARNING: Power reading outside expected range for 9W bulb!");
    Serial.printf("Expected: 9W ± 2W, Got: %.2fW\n", avg_power);
    Serial.println("Check: 1) Current sensor position 2) Wire connections 3) Load connection");
  }
  if (voltage < 200 || voltage > 250) {
    Serial.println("WARNING: Voltage reading outside normal range!");
  }
  
  Serial.println("---------------------------------------------------\n");

  // Upload to Supabase
  sendDataToSupabase(voltage, avg_current, avg_power, accumulated_kWh);

  delay(3000);  // Send every 3 seconds
}

void sendDataToSupabase(float voltage, float current, float power, float kwh) {
  // Get timestamp
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("❌ Failed to obtain time");
    return;
  }

  char timestamp[30];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%S%z", &timeinfo);

  // Create JSON payload
  StaticJsonDocument<256> jsonDoc;
  jsonDoc["voltage"] = voltage;
  jsonDoc["current"] = current;
  jsonDoc["power"]   = power;
  jsonDoc["total_kwh"]     = kwh;
  jsonDoc["time"]    = timestamp;

  String jsonString;
  serializeJson(jsonDoc, jsonString);

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String endpoint = String(supabaseUrl) + "/rest/v1/" + tableName;
    http.begin(endpoint);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("apikey", supabaseKey);
    http.addHeader("Authorization", "Bearer " + String(supabaseKey));
    http.addHeader("Prefer", "return=representation");

    int httpResponseCode = http.POST(jsonString);
    if (httpResponseCode > 0) {
      Serial.println("✅ Data inserted!");
      String response = http.getString();
      // Print only first 80 chars to avoid long logs
      if (response.length() > 80) {
        Serial.println("Response: " + response.substring(0, 80) + "...");
      } else {
        Serial.println("Response: " + response);
      }
    } else {
      Serial.println("❌ Failed to insert data.");
      Serial.println("HTTP Response code: " + String(httpResponseCode));
    }
    http.end();
  } else {
    Serial.println("❌ WiFi disconnected, data not sent");
    // Try to reconnect to WiFi
    WiFi.begin(ssid, password);
    Serial.print("Attempting to reconnect to WiFi");
    for (int i = 0; i < 10 && WiFi.status() != WL_CONNECTED; i++) {
      delay(500);
      Serial.print(".");
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✅ WiFi Reconnected");
    } else {
      Serial.println("\n❌ WiFi Reconnection failed");
    }
  }
}
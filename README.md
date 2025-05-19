
---

# ⚡ Project Title: Smart-Electricity-Meter

## 📌 Overview

This system is a **Smart Electricity Monitoring and Billing Solution**. It tracks real-time electricity usage data such as voltage, current, power, and energy (kWh), and stores it in **Supabase**. A Python-based server predicts **future electricity bills and usage trends**, helping users monitor and manage their consumption efficiently.

---

## 🧠 Key Features

✅ Real-time data tracking

✅ Web App Dashboard (Next.js)

✅ Supabase Cloud Database

✅ AI-based Bill Prediction (Python)

✅ IoT Integration with ESP32

✅ Historical usage analytics

---

## 🛠️ Technologies Used

### 💻 Frontend

* Next.js
* TypeScript
* Tailwind CSS

### 🧩 Backend

* Node.js
* Python (for AI predictions)

### 🗄️ Database

* Supabase (PostgreSQL)

### ⚙️ Hardware

* ESP32
* Voltage Sensor (e.g., ZMPT101B)
* Current Sensor (e.g., SCT-013)

---

## 💡 Real-Time Data Example

```cpp

Time: 14:32:45
Voltage (V): 229.75 V
Current (A): 0.1245 A
Power (W): 28.55 W
Energy (kWh): 0.000125 kWh

```

---

## 🌐 Available Platforms

* 🌐 Web Dashboard
* 🚀 Embedded IoT (ESP32)

---

## ⚙️ System Architecture

 
![Screenshot 2025-05-20 003538](https://github.com/user-attachments/assets/15bd098d-8716-49c3-a85b-337d808c7819)



---

## 📸 Screenshots / Demo

📊 Dashboard

📈 Real-time graphs

⚡ Predicted bill info

📅 Daily / Weekly / Monthly usage trends


![Screenshot 2025-05-19 181709](https://github.com/user-attachments/assets/8b160fee-08d3-4628-a269-be02449328a9)

![WhatsApp Image 2025-05-19 at 18 21 30 (1)](https://github.com/user-attachments/assets/72482f25-bba6-4da3-b3ca-dc38d2647abc)

---


---

## 📱 Installation & Setup

### 🔧 Prerequisites

* Node.js (v18.x or above)
* Python 3.9+
* ESP32 microcontroller
* Visual Studio Code

---

### 🚀 Setup Steps

```bash
# Clone the repository
git clone https://github.com/Ganeshan1829/Smart-Electicity-Meter.git
cd smart-electricity-meter

# Frontend Setup
npm install
npm run dev   # Starts the Next.js frontend

# Backend AI Server
cd backend
pip install -r requirements.txt
python app.py   # Starts Python Flask server for bill prediction

# Flash ESP32 with Arduino or PlatformIO
# Ensure correct sensor connections and WiFi/Supabase credentials
```
## 📚 References & Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [ESP32 Getting Started](https://randomnerdtutorials.com/getting-started-with-esp32/)
- [Pandas for AI Models](https://pandas.pydata.org/docs/)
- [Voltage sensor ZMPT101B ](https://diyprojectslabs.com/interfacing-zmpt101b-voltage-sensor-with-esp32/)
- [Current sensor SCT-013-000](https://forum.arduino.cc/t/current-sensor-sct-013-000/462305)

---

## 🔒 License

This project is licensed under the **MIT License**.
Feel free to use, modify, and distribute with attribution.

---



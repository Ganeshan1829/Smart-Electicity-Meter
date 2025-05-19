import numpy as np
import pandas as pd
import datetime
import time
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from supabase import create_client, Client
import warnings

warnings.filterwarnings('ignore')

# ---------- Supabase Configuration ----------
SUPABASE_URL = "Supabase url"
SUPABASE_KEY = "supabase key"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Generate a synthetic dataset based on typical Indian electricity tariffs
def generate_electricity_dataset(n_samples=100, seed=42):
    np.random.seed(seed)
    kwh = np.random.uniform(10, 800, n_samples)
    bill = np.zeros_like(kwh)
    
    for i, consumption in enumerate(kwh):
        if consumption <= 100:
            rate = np.random.uniform(3, 4)
            bill[i] = consumption * rate
        elif consumption <= 300:
            rate = np.random.uniform(5, 7)
            bill[i] = 100 * np.random.uniform(3, 4) + (consumption - 100) * rate
        elif consumption <= 500:
            rate = np.random.uniform(7, 9)
            bill[i] = 100 * np.random.uniform(3, 4) + 200 * np.random.uniform(5, 7) + (consumption - 300) * rate
        else:
            rate = np.random.uniform(9, 11)
            bill[i] = 100 * np.random.uniform(3, 4) + 200 * np.random.uniform(5, 7) + 200 * np.random.uniform(7, 9) + (consumption - 500) * rate
    
    for i, consumption in enumerate(kwh):
        if consumption < 50:
            fixed_charges = np.random.uniform(20, 50)
        else:
            fixed_charges = np.random.uniform(50, 150)
        bill[i] += fixed_charges
    
    bill += np.random.normal(0, bill * 0.03)
    
    data = pd.DataFrame({
        'kwh_consumption': kwh,
        'bill_amount': bill
    })
    
    return data

# Prepare dataset and train model
def train_model():
    print("Training prediction model...")
    # Prepare dataset
    data = generate_electricity_dataset(n_samples=200)

    low_consumption_data = pd.DataFrame({
        'kwh_consumption': [1, 3, 5, 7, 10],
        'bill_amount': [50, 55, 60, 65, 70]
    })

    data = pd.concat([data, low_consumption_data], ignore_index=True)

    X = data[['kwh_consumption']]
    y = data['bill_amount']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = LinearRegression()
    model.fit(X_train, y_train)
    
    print("Model trained successfully")
    return model

# Prediction function
def predict_bill(model, kwh):
    prediction = model.predict([[kwh]])[0]
    if prediction < 40:
        return 40.0
    return prediction

# Fetch meter data from Supabase
def fetch_meter_data():
    try:
        response = supabase.table('meter_data').select('current, voltage, power, total_kwh, time').order('time', desc=True).limit(1).execute()
        if response.data and len(response.data) > 0:
            meter = response.data[0]
            print(f"Fetched meter data: Voltage={meter['voltage']}V, Current={meter['current']}A, Power={meter['power']}W, kWh={meter['total_kwh']}")
            return meter
        else:
            print("No meter data found.")
            return None
    except Exception as e:
        print(f"Error fetching meter data: {e}")
        return None

# Insert prediction into Supabase
def insert_prediction(predicted_kwh, predicted_bill):
    created_at = datetime.datetime.utcnow().isoformat()
    
    # Convert to string with full precision to avoid any type conversion issues
    predicted_kwh_str = str(predicted_kwh)
    
    data = {
        "created_at": created_at,
        "predicted_kwh": predicted_kwh_str,  # Store as string to preserve full precision
        "predicted_bill": round(predicted_bill, 2)
    }
    
    try:
        # Inserting data without the 'id' column since it's auto-generated
        response = supabase.table('predictions').insert(data).execute()
        
        # Check if there's data in the response or if there's an error
        if hasattr(response, 'data') and response.data:
            print(f"Inserted prediction into database: kWh={predicted_kwh_str}, Bill=Rs {predicted_bill:.2f}")
        else:
            print(f"Error inserting data: {response}")
    except Exception as e:
        print(f"Exception during database insertion: {e}")
# Main loop function - runs continuously
def prediction_loop(model):
    while True:
        try:
            print("\n--- Running Prediction Update ---")
            meter_data = fetch_meter_data()
            
            if meter_data:
                total_kwh = meter_data['total_kwh']
                predicted_bill = predict_bill(model, total_kwh)
                
                print(f"Total kWh from meter: {total_kwh}")
                print(f"Predicted Bill: Rs {predicted_bill:.2f}")
                
                insert_prediction(predicted_kwh=total_kwh, predicted_bill=predicted_bill)
            else:
                print("Skipping prediction. No meter data available.")
                
            # Wait for 3 seconds before the next update
            print(f"Waiting 3 seconds until next update...")
            time.sleep(3)
            
        except KeyboardInterrupt:
            print("\nPrediction loop stopped by user.")
            break
        except Exception as e:
            print(f"Error in prediction loop: {e}")
            print("Continuing after error...")
            time.sleep(3)

# Main entry point
if __name__ == "__main__":
    print("Starting Electricity Prediction Service...")
    
    # Train the model once at startup
    model = train_model()
    
    print("\nBeginning continuous prediction updates...")
     
     # press cntrl+c to stop the loop
    
    # Start the continuous prediction loop
    prediction_loop(model)

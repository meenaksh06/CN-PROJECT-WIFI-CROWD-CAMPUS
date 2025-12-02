
import argparse
import pandas as pd
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np
import math

def aggregate(df):
    df['timestamp'] = pd.to_datetime(df['timestamp']) 
    df['minute'] = df['timestamp'].dt.floor('min')
    agg = df.groupby(['minute','ap_id']).agg(
        probes=('device', 'nunique'),
        mean_rssi=('rssi', 'mean'),
        std_rssi=('rssi', 'std'),
        median_rssi=('rssi', 'median'),
        ground_truth=('ground_truth', 'median')
    ).reset_index()
    agg['std_rssi'] = agg['std_rssi'].fillna(0)
    return agg

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument('--data', default='data/sample_probes.csv')
    p.add_argument('--model', choices=['linear','tree','rf'], default='rf')
    p.add_argument('--out', default='ml/crowd_model.pkl')
    args = p.parse_args()

    df = pd.read_csv(args.data)
    agg = aggregate(df)
    X = agg[['probes','mean_rssi','std_rssi','median_rssi']].fillna(0)
    y = agg['ground_truth']

    X_train,X_test,y_train,y_test = train_test_split(X,y,test_size=0.2,random_state=42)

    if args.model == 'linear':
        model = LinearRegression()
    elif args.model == 'tree':
        model = DecisionTreeRegressor(max_depth=6, random_state=42)
    else:
        model = RandomForestRegressor(n_estimators=50, random_state=42)

    model.fit(X_train,y_train)
    preds = model.predict(X_test)
    mse = mean_squared_error(y_test, preds)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test,preds)
    print(f"Model: {args.model} MAE: {mae:.2f} RMSE: {rmse:.2f}")

    joblib.dump(model, args.out)
    print("Saved model to", args.out)

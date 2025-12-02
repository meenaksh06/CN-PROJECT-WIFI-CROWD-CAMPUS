import csv
import random
import hashlib
from datetime import datetime, timedelta

AP_IDS = ['AP-101', 'AP-102', 'AP-103', 'AP-104']

def hash_mac(i):
    return hashlib.sha256(f"device-{i}".encode()).hexdigest()[:12]

def generate(out='data/sample_probes.csv', rows=2000):
    start = datetime.utcnow()
    with open(out, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['timestamp', 'ap_id', 'device', 'rssi', 'ground_truth'])
        for i in range(rows):
            ts = (start + timedelta(seconds=i)).isoformat()
            ap = random.choice(AP_IDS)
            # ground truth crowd at that AP at that time (0..50)
            crowd = max(0, int(random.gauss(12 if '101' in ap else 8, 5)))
            # generate between 1 and crowd*1.5 probes
            device_count = max(1, min(60, crowd + random.randint(-3, 5)))
            for d in range(device_count):
                device = hash_mac(i*100 + d)
                rssi = int(random.gauss(-45 if d < crowd/2 else -70, 6))
                w.writerow([ts, ap, device, rssi, crowd])
    print(f"Wrote simulated data to {out}")

if __name__ == "__main__":
    generate()


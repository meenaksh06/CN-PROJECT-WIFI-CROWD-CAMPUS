
from scapy.all import sniff, Dot11, RadioTap
import requests, os, time, hashlib

BACKEND_URL = os.environ.get('BACKEND_URL', 'http://127.0.0.1:8000/ingest')
SALT = os.environ.get('SALT', 'campus_salt_v1')
BATCH_INTERVAL = 5
BUFFER = []
LAST = time.time()

def hash_mac(mac):
    return hashlib.sha256((mac + SALT).encode()).hexdigest()[:12]

def handle(pkt):
    global BUFFER, LAST
    if pkt.haslayer(Dot11) and pkt.type == 0 and pkt.subtype == 4:
        src = pkt.addr2
        rssi = None
        try:
            if pkt.haslayer(RadioTap) and hasattr(pkt[RadioTap], 'dBm_AntSignal'):
                rssi = pkt[RadioTap].dBm_AntSignal
        except: pass
        rec = {'ts': time.time(), 'ap_iface': '', 'device': hash_mac(src), 'rssi': int(rssi) if rssi else None}
        BUFFER.append(rec)
    if time.time() - LAST >= BATCH_INTERVAL and BUFFER:
        try:
            res = requests.post(BACKEND_URL, json=BUFFER, timeout=5)
            if res.status_code == 200:
                BUFFER = []
        except Exception as e:
            print("Send err", e)
        LAST = time.time()

if __name__ == "__main__":
    iface = os.environ.get('MON_IFACE','wlan0mon')
    sniff(iface=iface, prn=handle, store=0)


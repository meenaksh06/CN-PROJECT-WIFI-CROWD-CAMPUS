# eval/latency_throughput.py
import requests, time, argparse, csv

def load_rows(csvfile, limit=None):
    rows=[]
    with open(csvfile) as f:
        r=csv.DictReader(f)
        for i,row in enumerate(r):
            if limit and i>=limit: break
            rows.append({'ts':row['timestamp'],'ap_iface':row['ap_id'],'device':row['device'],'rssi':int(row['rssi'])})
    return rows

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--csv',default='data/sample_probes.csv')
    p.add_argument('--url',default='http://localhost:8000/ingest')
    p.add_argument('--batch',type=int,default=50)
    p.add_argument('--batches',type=int,default=20)
    args=p.parse_args()

    rows=load_rows(args.csv, limit=args.batch*args.batches)
    latencies=[]
    sent=0
    for i in range(args.batches):
        batch=rows[i*args.batch:(i+1)*args.batch]
        t0=time.time()
        try:
            r=requests.post(args.url, json=batch, timeout=5)
            t1=time.time()
            latencies.append((t1-t0))
            sent+=len(batch)
        except Exception as e:
            print("err",e)
            latencies.append(None)
        time.sleep(0.05)

    good=[l for l in latencies if l]
    print("Requests sent:",sent)
    if good:
        import statistics
        print("Latency ms -> mean:",statistics.mean(good)*1000,"median:",statistics.median(good)*1000,"min:",min(good)*1000,"max:",max(good)*1000)
        print("Throughput req/sec:", round(len(good)/sum(good),2))
    else:
        print("No successful requests")

#!/usr/bin/env python3
import json, socket, sys, time
from concurrent.futures import ThreadPoolExecutor

HOST, PORT = '13.206.57.188', 10023

class Oracle:
    def __init__(self):
        self.s = None; self.f = None
        self.info = self._connect()
        self.n, self.e = self.info['N'], self.info['e']
        self.k = (self.n.bit_length()+7)//8
        self.q = 0
        self.pool=[]
    def _connect(self):
        self.s = socket.create_connection((HOST, PORT), timeout=15)
        self.f = self.s.makefile('rwb', buffering=0)
        line = self.f.readline()
        if not line: raise RuntimeError('no banner')
        return json.loads(line)
    def reconnect(self):
        info=self._connect()
        if info['N'] != self.n or info['e'] != self.e or info['c'] != self.info['c']:
            raise RuntimeError('instance changed after reconnect')
    def open_pool(self):
        for _ in range(8):
            ss=socket.create_connection((HOST,PORT),timeout=15)
            ff=ss.makefile('rwb',buffering=0)
            inf=json.loads(ff.readline())
            assert inf['N']==self.n and inf['e']==self.e and inf['c']==self.info['c']
            self.pool.append((ss,ff))
    def ask(self, x):
        self.q += 1
        try:
            self.f.write((x.to_bytes(self.k, 'big').hex()+'\n').encode())
            ans = self.f.readline().decode(errors='replace').strip().lower()
            if not ans: raise BrokenPipeError
        except (BrokenPipeError, OSError, TimeoutError):
            self.reconnect()
            self.f.write((x.to_bytes(self.k, 'big').hex()+'\n').encode())
            ans = self.f.readline().decode(errors='replace').strip().lower()
        if self.q % 1000 == 0: print(f'queries={self.q}', file=sys.stderr, flush=True)
        return ans == 'valid'
    def ask_many(self, xs):
        xs=list(xs)
        self.q += len(xs)
        wire=(''.join(x.to_bytes(self.k,'big').hex()+'\n' for x in xs)).encode()
        try:
            self.f.write(wire)
            out=[self.f.readline().decode(errors='replace').strip().lower() == 'valid' for _ in xs]
        except (BrokenPipeError, OSError, TimeoutError):
            self.reconnect()
            self.f.write(wire)
            out=[self.f.readline().decode(errors='replace').strip().lower() == 'valid' for _ in xs]
        if self.q % 1000 < len(xs): print(f'queries={self.q}',file=sys.stderr,flush=True)
        return out
    def close(self): self.s.close()

def ceildiv(a,b): return -(-a//b)

def main():
    o=Oracle(); n,e,k=o.n,o.e,o.k
    B=1 << (8*(k-2))
    print('N=',n, 'k=',k, file=sys.stderr)
    # Find the non-standard type byte using chosen RSA plaintexts.
    xx=None
    for t in range(256):
        m=t*B
        if o.ask(pow(m,e,n)):
            xx=t; print('type byte:', hex(t), file=sys.stderr); break
    if xx is None: raise RuntimeError('type byte not found')
    # Open parallel query sockets only after the byte-discovery phase so they
    # do not sit idle while the rate-limited probes run.
    lo,hi=xx*B,(xx+1)*B-1
    # The target ciphertext is nonzero, hence its RSA plaintext is nonzero;
    # use 1 as the mathematical lower bound even though the oracle accepts 0.
    lo=max(1, lo)
    c=int(o.info['c'],16)
    # Standard interval attack generalized from [2B,3B) to [xx B,(xx+1)B).
    # First find a multiplier yielding a conforming plaintext.
    # Search by the quotient r in m*s-r*n.  Unlike a blind linear s scan,
    # these are exactly the multipliers which could map some m in the known
    # starting interval back into [lo, hi].
    seen=set(); found=False; r=1
    while not found:
        smin=ceildiv(lo+r*n,hi)
        smax=(hi+r*n)//lo
        vals=[x for x in range(max(2,smin),smax+1) if x not in seen]
        seen.update(vals)
        for j in range(0,len(vals),64):
            chunk=vals[j:j+64]
            ok=o.ask_many((c*pow(x,e,n))%n for x in chunk)
            if True in ok:
                s=chunk[ok.index(True)]; found=True; break
        r+=1
    print('s1=',s, file=sys.stderr)
    M=[(lo,hi)]
    i=1
    while True:
        # Intersect every current interval with all possible [lo+r*n, hi+r*n]/s.
        new=[]
        for a,b in M:
            rmin=ceildiv(a*s-hi,n)
            rmax=(b*s-lo)//n
            for r in range(max(0,rmin),rmax+1):
                aa=max(a,ceildiv(lo+r*n,s))
                bb=min(b,(hi+r*n)//s)
                if aa<=bb: new.append((aa,bb))
        M=[]
        for x in sorted(new):
            if M and x[0] <= M[-1][1]+1: M[-1]=(M[-1][0],max(M[-1][1],x[1]))
            else: M.append(x)
        with open('scratch/interval_state.json','w') as sf:
            json.dump({'N':n,'e':e,'c':o.info['c'],'type':xx,'s':s,'iteration':i,
                       'intervals':[[str(a),str(b)] for a,b in M]},sf)
        if i % 25 == 0 or len(M)==1 and M[0][0]==M[0][1]:
            print(f'iter={i} s={s} intervals={len(M)} width={M[0][1]-M[0][0]}',file=sys.stderr,flush=True)
        if len(M)==1 and M[0][0]==M[0][1]:
            m=M[0][0]
            raw=m.to_bytes(k,'big')
            print('plaintext hex:',raw.hex())
            print('plaintext:',repr(raw))
            print('queries:',o.q,file=sys.stderr)
            o.close(); return
        if len(M)>=2:
            # Search upward from previous s.
            while True:
                vals=list(range(s+1,s+65))
                ok=o.ask_many((c*pow(x,e,n))%n for x in vals)
                if True in ok:
                    s=vals[ok.index(True)]; break
                s=vals[-1]
        else:
            # With one interval, choose candidate s values grouped by r.
            a,b=M[0]
            r=ceildiv(2*(b*s-lo),n) # safe starting bound; generalized single-interval search
            if r<1:r=1
            found=False
            while not found:
                smin=ceildiv(lo+r*n,b)
                smax=(hi+r*n)//a
                start=max(s+1,smin)
                if start<=smax:
                    for j in range(start,smax+1,64):
                        vals=list(range(j,min(j+64,smax+1)))
                        ok=o.ask_many((c*pow(x,e,n))%n for x in vals)
                        if True in ok:
                            s=vals[ok.index(True)]; found=True; break
                r+=1
        i+=1

if __name__=='__main__': main()

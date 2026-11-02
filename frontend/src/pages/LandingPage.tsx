// LandingPage.tsx
// Preserves the original ocean WebGL environment, fish canvas animations,
// glassmorphism, typography, and all scroll behaviors from aquanet-x-v2.html
// The GLSL shader and fish boid logic are ported 1:1.

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const seaRef = useRef<HTMLCanvasElement>(null);
  const fishRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const dpRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already logged in, clicking Get Started goes straight to dashboard
  const handleGetStarted = () => {
    if (user) { navigate('/dashboard'); return; }
    navigate('/register');
  };

  const handleLogin = () => {
    if (user) { navigate('/dashboard'); return; }
    navigate('/login');
  };

  const handleExplore = () => {
    const el = document.getElementById('challenge');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cv = seaRef.current!;
    const fc = fishRef.current!;
    const fcx = fc.getContext('2d')!;
    let gl: WebGLRenderingContext | null = null;
    const U: Record<string, WebGLUniformLocation | null> = {};
    let W = 0, H = 0, q = 0, t = 0, sy = 0, P = 0, boost = 0;
    let small = innerWidth < 760;
    let animId = 0;

    // ======================================================
    // FRAGMENT SHADER — identical to aquanet-x-v2.html
    // ======================================================
    const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 R;uniform float T,S,K,Dk,B,D;
float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+1.),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+17.;a*=.5;}return s;}
vec3 sky(float x,float e){
 vec3 c=mix(vec3(.96,.98,.99),vec3(.72,.87,.91),smoothstep(0.,.3,e));
 c=mix(c,vec3(.45,.67,.77),smoothstep(.25,1.,e)*.9);
 float cl=smoothstep(.5,.85,fbm(vec2(x*.9+T*.012,e*4.)+vec2(3.,T*.004)));
 c=mix(c,vec3(1.),cl*smoothstep(.02,.3,e)*.7);
 float sx=x-.2*R.x/R.y;
 return c+vec3(.95,.88,.7)*exp(-(sx*sx*6.+(e-.12)*(e-.12)*60.))*.35;}
void main(){
 vec2 p=gl_FragCoord.xy/R;float A=R.x/R.y,x2=(p.x-.5)*A;
 float hz=.40+S*.75,d=hz-p.y;vec3 col;
 if(d<=0.){
  float e=clamp((p.y-hz)/max(1.-hz,.25),0.,1.);
  col=sky(x2,e);
  float side=abs(p.x-.5)*1.8;
  float r1=hz+(.02+.12*fbm(vec2(x2*1.5+2.,.7)))*smoothstep(.1,.6,side);
  float r2=hz+(.008+.07*fbm(vec2(x2*2.7+9.,3.3)))*smoothstep(.3,.8,side);
  vec3 hc=vec3(.74,.87,.91);
  if(p.y<r1)col=mix(vec3(.5,.58,.62),hc,.6);
  if(p.y<r2){float tt=clamp((p.y-hz)/max(r2-hz,.004),0.,1.);col=mix(mix(vec3(.78,.72,.6),hc,.25),mix(vec3(.47,.5,.52),hc,.25),smoothstep(0.,.45,tt));}
  col=mix(col,vec3(.96,.98,.99),exp(-(p.y-hz)*14.)*.6);
 }else{
  float dd=max(d,.003),fo=smoothstep(0.,.25,dd);
  vec2 w=vec2(x2/dd,1./dd)*.6+vec2(0.,T*.5);vec2 sl=vec2(0.);
  for(int i=0;i<4;i++){float fi=float(i),an=.5+fi*1.1+.3*sin(T*.05+fi),fr=1.6+fi*1.35;vec2 dr=vec2(cos(an),sin(an));sl+=dr*fr*cos(dot(dr,w)*fr+T*(.9+fi*.35))*(.16/(1.+fi*.9));}
  sl+=(vec2(fbm(w*1.4+T*.15),fbm(w*1.4+7.-T*.12))-.5)*.5;
  sl*=mix(.2,1.,fo);
  vec3 N=normalize(vec3(-sl.x,1.,-sl.y)),V=normalize(vec3(-x2,dd*1.4+.03,-1.));
  float F=.03+.97*pow(1.-max(dot(N,V),0.),5.);
  vec3 Rf=reflect(-V,N);
  vec3 base=mix(vec3(.29,.61,.71),vec3(.09,.3,.39),smoothstep(0.,.5,dd));
  base=mix(base,vec3(.39,.81,.8),clamp(length(sl)*.3,0.,.3));
  col=mix(base,sky(x2+Rf.x*.5,clamp(Rf.y*1.3,0.,1.)),F);
  vec3 L=normalize(vec3(.2*A,.17,1.)),Hh=normalize(L+V);float nh=max(dot(N,Hh),0.);
  col+=vec3(.95,.88,.7)*(pow(nh,140.)*1.6+pow(nh,18.)*.1);
  col=mix(col,vec3(.94,.98,.99),smoothstep(.5,.85,fbm(w*2.2+vec2(0.,T*.4)))*smoothstep(.15,.5,length(sl))*fo*.28);
  col+=vec3(.6,.85,.82)*(1.-smoothstep(0.,.07,abs(n(w*.9+T*.2)-n(w*.8-T*.18))))*.07*smoothstep(.1,.5,S)*fo;
 col=mix(col,vec3(.96,.98,.99),exp(-dd*8.)*.9);
 }
 col*=mix(1.,.45,Dk);
 float uw=smoothstep(.38,.92,S);
 if(uw>0.){
  vec3 uc=mix(vec3(.19,.5,.58),vec3(.035,.14,.21),smoothstep(0.,1.,D*1.1));
  uc=mix(uc,vec3(.1,.3,.37),pow(p.y,2.2)*(.6-.15*D));
  float rays=pow(.5+.5*sin(x2*5.+sin(T*.2+p.y*2.5)*1.4+T*.12),5.)*pow(p.y,1.5)*mix(.22,.2,D);
  vec2 cw=vec2(x2,p.y)*5.;float c=abs(n(cw+vec2(T*.25,T*.18))-n(cw*1.3-vec2(T*.2,-T*.22)));
  float cau=(1.-smoothstep(0.,.07,c))*.14*smoothstep(.2,1.,p.y)*(1.-D);
  uc+=vec3(.7,.9,.88)*(rays*(1.-.3*D)+cau);
  uc=mix(uc,vec3(.04,.15,.22),(1.-p.y)*.25*D);
  col=mix(col,uc,uw);
 }
 col*=1.-.5*dot(p-.5,p-.5);
 col+=vec3(.5,.8,.8)*B*exp(-length(p-.5)*2.5);
 gl_FragColor=vec4(clamp(col,0.,1.),1.);}`;

    // ======================================================
    // WEBGL SETUP
    // ======================================================
    try {
      gl = cv.getContext('webgl', { antialias: false, alpha: false });
      if (!gl) throw new Error('WebGL not available');
      const mk = (ty: number, src: string) => {
        const sh = gl!.createShader(ty)!;
        gl!.shaderSource(sh, src);
        gl!.compileShader(sh);
        if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(sh) ?? '');
        return sh;
      };
      const pg = gl.createProgram()!;
      gl.attachShader(pg, mk(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
      gl.attachShader(pg, mk(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(pg);
      gl.useProgram(pg);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const la = gl.getAttribLocation(pg, 'a');
      gl.enableVertexAttribArray(la);
      gl.vertexAttribPointer(la, 2, gl.FLOAT, false, 0, 0);
      ['R', 'T', 'S', 'K', 'Dk', 'B', 'D'].forEach((k) => { U[k] = gl!.getUniformLocation(pg, k); });
    } catch (e) {
      gl = null;
      console.warn('[AQUANET X] WebGL ocean unavailable, using fallback', e);
      document.body.style.background = 'linear-gradient(#b8dde8,#4a9cb4 55%,#0b2e42)';
    }

    // ======================================================
    // RESIZE (Must run before fish init so W & H are set!)
    // ======================================================
    function rs() {
      W = innerWidth; H = innerHeight; small = W < 760;
      q = small ? 0.5 : 0.7;
      cv.width = Math.ceil(W * q); cv.height = Math.ceil(H * q);
      fc.width = W; fc.height = H;
      if (gl) gl.viewport(0, 0, cv.width, cv.height);
    }
    rs();
    addEventListener('resize', rs);

    // ======================================================
    // CAMERA PATH & DEPTH CURVE (identical to original)
    // ======================================================
    const CP: [number, number][] = [[0,0],[0.12,0.15],[0.27,0.55],[0.42,0.85],[0.58,1],[1,1]];
    const DP: [number, number][] = [[0,0],[0.2,0.2],[0.45,0.5],[0.7,0.8],[1,1]];

    function interp(T: [number,number][], p: number): number {
      for (let i = 1; i < T.length; i++) {
        if (p <= T[i][0]) {
          const a = T[i-1], b = T[i], k0 = (p - a[0]) / (b[0] - a[0]);
          const k = k0 * k0 * (3 - 2 * k0);
          return a[1] + (b[1] - a[1]) * k;
        }
      }
      return T[T.length-1][1];
    }

    const curve = (p: number) => interp(CP, p);

    // ======================================================
    // FISH BOIDS (identical to original)
    // ======================================================
    type School = { n: number; z: number; sp: number; dir: number; y: number; ph: number; };
    type Fish = { si: number; x: number; y: number; vx: number; vy: number; ox: number; oy: number; sf: number; ph: number; z: number; ang: number; vis: number; };
    type Mote = { x: number; y: number; r: number; s: number; p: number; };
    type Ld = { x: number; };

    const SCH: School[] = [
      { n:6, z:0.85, sp:30, dir:1,  y:0.84, ph:0 },
      { n:5, z:0.55, sp:20, dir:-1, y:0.62, ph:2 },
      { n:4, z:0.72, sp:36, dir:1,  y:0.44, ph:4 },
      { n:3, z:0.4,  sp:16, dir:-1, y:0.74, ph:1 },
    ];
    const FL: Fish[] = [];
    const LD: Ld[] = [];
    const MS: Mote[] = [];
    let TR: number[][] = [];

    function mr() {
      TR = [];
      document.querySelectorAll('.hd, #hero .lead, .cta p, #offline .lead').forEach((e) => {
        const r = (e as HTMLElement).getBoundingClientRect();
        TR.push([r.left - 30, r.right + 30, r.top + scrollY - 24, r.bottom + scrollY + 24]);
      });
    }

    (function init() {
      const initHzy = (1 - 0.40) * H;
      SCH.forEach((sc, si) => {
        const c = small ? Math.ceil(sc.n * 0.55) : sc.n;
        const lx = Math.random() * W;
        LD.push({ x: lx });
        for (let i = 0; i < c; i++) {
          FL.push({
            si,
            x: lx - sc.dir * Math.random() * 100,
            y: initHzy + 40 + Math.random() * Math.max(60, H * 0.28),
            vx: sc.dir * sc.sp,
            vy: 0,
            ox: -sc.dir * (10 + Math.random() * 90),
            oy: (Math.random() - 0.5) * 50,
            sf: 0.88 + Math.random() * 0.24,
            ph: Math.random() * 6,
            z: Math.max(0.3, Math.min(0.95, sc.z + (Math.random() - 0.5) * 0.12)),
            ang: 0,
            vis: 1,
          });
        }
      });
      for (let j = 0; j < (small ? 16 : 30); j++) {
        MS.push({ x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 1.4, s: 0.3 + Math.random() * 0.8, p: Math.random() * 6 });
      }
    })();

    mr();
    addEventListener('resize', mr);
    addEventListener('load', mr);
    setTimeout(mr, 1200);

    function updFish(S: number) {
      const dt = reduce ? 0 : 0.016;
      const hzy = (1 - (0.40 + S * 0.75)) * H;
      const y0 = Math.max(hzy + H * 0.07, H * 0.15);
      const hg = Math.max(60, H * 0.95 - y0);
      const st: { n: number; x: number; y: number; vx: number; vy: number; }[] = [];
      SCH.forEach(() => st.push({ n: 0, x: 0, y: 0, vx: 0, vy: 0 }));
      FL.forEach((f) => { const a = st[f.si]; a.n++; a.x += f.x; a.y += f.y; a.vx += f.vx; a.vy += f.vy; });
      SCH.forEach((sc, si) => {
        const ld = LD[si]; let sh = 0;
        ld.x += sc.dir * sc.sp * dt * (1 + 0.2 * Math.sin(t * 0.2 + si * 2));
        if (sc.dir > 0 && ld.x > W + 220) sh = -(W + 440);
        else if (sc.dir < 0 && ld.x < -220) sh = W + 440;
        if (sh) { ld.x += sh; FL.forEach((f) => { if (f.si === si) f.x += sh; }); }
      });
      FL.forEach((f) => {
        const sc = SCH[f.si], a = st[f.si], ld = LD[f.si];
        const BL = (14 + f.z * 38) * (small ? 0.8 : 1);
        const ty = y0 + hg * sc.y + Math.sin(t * 0.13 + sc.ph) * hg * 0.07 + f.oy + Math.sin(t * 0.5 + f.ph) * 6;
        let dx = sc.dir * sc.sp * f.sf + (ld.x + f.ox - f.x) * 0.8 + (a.x / a.n - f.x) * 0.12 + (a.vx / a.n - f.vx) * 0.25;
        let dy = (ty - f.y) * 0.8 + (a.y / a.n - f.y) * 0.05 + (a.vy / a.n - f.vy) * 0.2;
        FL.forEach((g) => {
          if (g !== f && g.si === f.si) {
            const ex = f.x - g.x, ey = f.y - g.y, d2 = ex * ex + ey * ey, r = BL * 1.1;
            if (d2 < r * r && d2 > 0.01) { const d = Math.sqrt(d2), k = (r - d) / r; dx += ex / d * k * 60; dy += ey / d * k * 60; }
          }
        });
        const kk = 1 - Math.exp(-dt * 1.5);
        f.vx += (dx - f.vx) * kk;
        f.vy += (Math.max(-16, Math.min(16, dy)) - f.vy) * kk;
        f.x += f.vx * dt; f.y += f.vy * dt;
        // Keep fish inside water: never cross above the water horizon into the sky
        const waterSurface = hzy + 20;
        if (f.y < waterSurface) {
          f.y = waterSurface;
          if (f.vy < 0) f.vy = 0;
        }
        f.ph += dt * (3 + Math.abs(f.vx) * 0.09);
        f.ang += (Math.atan2(f.vy, Math.abs(f.vx) + 1) - f.ang) * 0.05;
        let tg = 1;
        const Y = f.y + scrollY;
        for (let i = 0; i < TR.length; i++) {
          const r = TR[i];
          if (f.x > r[0] && f.x < r[1] && Y > r[2] && Y < r[3]) { tg = 0.1; break; }
        }
        f.vis += (tg - f.vis) * 0.06;
      });
    }

    function drawFish(S: number, uw: number, D: number) {
      fcx.clearRect(0, 0, W, H);
      // Fish appear strictly from 8m onward (P >= 0.20)
      if (P < 0.20) return;
      const depthFade = Math.min(1, (P - 0.20) / 0.05);
      fcx.clearRect(0, 0, W, H);
      const dv = 1 - 0.6 * D, v0 = 0.7 + 0.3 * uw;
      const hzy = (1 - (0.40 + S * 0.75)) * H;
      FL.forEach((f) => {
        // Physical water surface boundary: fish are underwater and never render in the sky
        const depth = f.y - hzy;
        if (depth <= 15) return;
        const surfaceFade = Math.min(1, (depth - 15) / 25);
        const BL = (14 + f.z * 38) * (small ? 0.8 : 1), bw = BL * 0.2;
        const a = (0.12 + 0.6 * f.z * f.z) * f.vis * dv * v0 * surfaceFade * depthFade;
        if (a < 0.015) return;
        const N = f.z > 0.5 ? 9 : 6;
        const xs: [number, number, number][] = [];
        for (let k = 0; k <= N; k++) {
          const s = k / N;
          xs.push([BL * (0.5 - s), Math.sin(f.ph - s * 3.2) * bw * (0.1 + 0.55 * s * s), bw * Math.pow(Math.sin(Math.PI * (0.06 + 0.9 * s)), 0.7) * (1 - 0.55 * s * s)]);
        }
        fcx.save(); fcx.translate(f.x, f.y); fcx.scale(f.vx < 0 ? -1 : 1, 1); fcx.rotate(f.ang);
        fcx.fillStyle = `rgba(${Math.round(52 - 22 * D)},${Math.round(92 - 24 * D)},${Math.round(105 - 18 * D)},${a})`;
        fcx.beginPath();
        for (let k = 0; k <= N; k++) { if (k) fcx.lineTo(xs[k][0], xs[k][1] - xs[k][2]); else fcx.moveTo(xs[k][0], xs[k][1] - xs[k][2]); }
        for (let k = N; k >= 0; k--) fcx.lineTo(xs[k][0], xs[k][1] + xs[k][2] * 0.9);
        fcx.fill();
        const e = xs[N], tw = Math.sin(f.ph - 3.8) * bw * 0.8;
        fcx.beginPath(); fcx.moveTo(e[0] + 1, e[1]); fcx.lineTo(e[0] - BL * 0.22, e[1] - BL * 0.19 + tw); fcx.lineTo(e[0] - BL * 0.15, e[1] + tw * 0.6); fcx.lineTo(e[0] - BL * 0.22, e[1] + BL * 0.19 + tw); fcx.fill();
        if (N > 6) {
          const d3 = xs[3], d4 = xs[4], p2 = xs[2];
          fcx.beginPath(); fcx.moveTo(d3[0] + BL * 0.1, d3[1] - d3[2]); fcx.lineTo(d3[0] - BL * 0.02, d3[1] - d3[2] - bw * 0.7); fcx.lineTo(d4[0] - BL * 0.08, d4[1] - d4[2]); fcx.fill();
          fcx.beginPath(); fcx.moveTo(p2[0], p2[1] + p2[2] * 0.7); fcx.lineTo(p2[0] - BL * 0.12, p2[1] + p2[2] + bw * 0.5 + Math.sin(f.ph * 1.3) * bw * 0.2); fcx.lineTo(p2[0] - BL * 0.04, p2[1] + p2[2] * 0.8); fcx.fill();
        }
        fcx.fillStyle = `rgba(205,228,230,${a * 0.5})`; fcx.beginPath();
        for (let k = 1; k <= N - 2; k++) { if (k > 1) fcx.lineTo(xs[k][0], xs[k][1] + xs[k][2] * 0.2); else fcx.moveTo(xs[k][0], xs[k][1] + xs[k][2] * 0.2); }
        for (let k = N - 2; k >= 1; k--) fcx.lineTo(xs[k][0], xs[k][1] + xs[k][2] * 0.85); fcx.fill();
        if (f.z > 0.6) { fcx.fillStyle = `rgba(10,25,32,${a * 0.9})`; fcx.beginPath(); fcx.arc(xs[1][0], xs[1][1] - xs[1][2] * 0.2, Math.max(0.8, BL * 0.025), 0, 6.3); fcx.fill(); }
        fcx.restore();
      });
      const pv = (Math.max(0, Math.min(1, (S - 0.15) / 0.5)) * 0.6 + uw * 0.4) * (1 + D * 0.4) * depthFade;
      if (pv > 0.05) {
        for (let j = 0; j < MS.length; j++) {
          const m = MS[j];
          const px = m.x * W + Math.sin(t * 0.5 + m.p) * 18;
          const py = (((m.y * H - t * 9 * m.s - sy * 0.3) % H) + H) % H;
          fcx.fillStyle = `rgba(220,240,240,${0.22 * pv * (0.5 + 0.5 * Math.sin(t + m.p))})`;
          fcx.beginPath(); fcx.arc(px, py, m.r, 0, 6.3); fcx.fill();
        }
      }
    }

    // ======================================================
    // ANIMATION LOOP
    // ======================================================
    function frame() {
      t += reduce ? 0 : 0.016;
      sy += (scrollY - sy) * (reduce ? 1 : 0.1);
      const mx = Math.max(1, document.documentElement.scrollHeight - H);
      P = Math.min(1, Math.max(0, sy / mx));
      const S = curve(P);
      const Dd = interp(DP, P);
      const dk = Math.min(1, Math.max(0, (sy - H * 0.12) / (H * 0.6)));
      const uw = Math.min(1, Math.max(0, (S - 0.38) / 0.54));
      if (gl) {
        gl.uniform2f(U['R'], cv.width, cv.height);
        gl.uniform1f(U['T'], t);
        gl.uniform1f(U['S'], S);
        gl.uniform1f(U['K'], P);
        gl.uniform1f(U['Dk'], dk * (1 - boost));
        gl.uniform1f(U['B'], boost);
        gl.uniform1f(U['D'], Dd);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      updFish(S);
      drawFish(S, uw, Dd);
      document.body.style.setProperty('--dp', Dd.toFixed(3));
      document.body.classList.toggle('sky', dk < 0.3);
      animId = requestAnimationFrame(frame);
    }
    animId = requestAnimationFrame(frame);

    // ======================================================
    // SCROLL HANDLER
    // ======================================================
    const nav = navRef.current;
    const bar = barRef.current;
    const rail = railRef.current;
    const steps = stepsRef.current;
    const heroContent = heroContentRef.current;
    const stepEls = Array.from(document.querySelectorAll('.step'));

    function onS() {
      const mxs = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const p = Math.min(1, scrollY / mxs);
      nav?.classList.toggle('s', scrollY > 40);
      if (bar) bar.style.transform = `scaleX(${p})`;
      if (rail) rail.style.setProperty('--P', String(p));
      if (dpRef.current) dpRef.current.textContent = `${Math.round(p * 40)} m`;
      const hf = Math.max(0, 1 - scrollY / (innerHeight * 0.45));
      if (heroContent) { heroContent.style.opacity = String(hf); heroContent.style.visibility = hf <= 0 ? 'hidden' : 'visible'; }
      if (steps) {
        const r = steps.getBoundingClientRect();
        const pr = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.05)));
        steps.style.setProperty('--pr', String(pr));
        stepEls.forEach((s, i) => s.classList.toggle('on', pr >= i / 3.4));
      }
    }
    addEventListener('scroll', onS, { passive: true });
    addEventListener('resize', onS);
    onS();

    // ======================================================
    // INTERSECTION OBSERVER (reveal animations)
    // ======================================================
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          if (e.target.classList.contains('rv')) {
            setTimeout(() => e.target.classList.add('done'), 1500);
          }
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });

    document.querySelectorAll('.rv, .hd, .fade').forEach((e) => {
      if (e.id !== 'h1' && !e.closest('#hero')) io.observe(e);
    });

    setTimeout(() => {
      document.querySelectorAll('#hero .hd, #hero .fade').forEach((e) => e.classList.add('in'));
    }, 200);

    // ======================================================
    // POINTER LIGHTING (glass elements)
    // ======================================================
    const glassEls = document.querySelectorAll('.glass');
    const pointerHandlers: { el: Element; move: (e: Event) => void; leave: (e: Event) => void }[] = [];
    glassEls.forEach((c) => {
      const move = (e: Event) => {
        const pe = e as PointerEvent;
        const r = (c as HTMLElement).getBoundingClientRect();
        const x = (pe.clientX - r.left) / r.width;
        const y = (pe.clientY - r.top) / r.height;
        (c as HTMLElement).style.setProperty('--mx', `${x * 100}%`);
        (c as HTMLElement).style.setProperty('--my', `${y * 100}%`);
      };
      const leave = () => {
        (c as HTMLElement).style.setProperty('--rx', '0deg');
        (c as HTMLElement).style.setProperty('--ry', '0deg');
      };
      c.addEventListener('pointermove', move);
      c.addEventListener('pointerleave', leave);
      pointerHandlers.push({ el: c, move, leave });
    });

    return () => {
      cancelAnimationFrame(animId);
      removeEventListener('resize', rs);
      removeEventListener('resize', mr);
      removeEventListener('scroll', onS);
      removeEventListener('load', mr);
      io.disconnect();
      pointerHandlers.forEach(({ el, move, leave }) => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', leave);
      });
      document.body.classList.remove('sky');
      document.body.style.removeProperty('--dp');
    };
  }, []);

  const toggleMenu = () => {
    menuRef.current?.classList.toggle('o');
  };

  const closeMenu = () => {
    menuRef.current?.classList.remove('o');
  };

  return (
    <>
      <canvas id="sea" ref={seaRef} aria-hidden="true" />
      <canvas id="fish" ref={fishRef} aria-hidden="true" />
      <div id="bar" ref={barRef} />
      <div className="rail" aria-hidden="true">
        <i />
        <b id="dp" ref={dpRef as React.RefObject<HTMLElement>}>0 m</b>
      </div>

      {/* Navigation */}
      <nav className="glass g-l landing-nav" id="nav" ref={navRef}>
        <a className="logo" href="#top">AQUANET <b>X</b></a>
        <div className="links">
          <a href="#challenge" onClick={closeMenu}>The Challenge</a>
          <a href="#platform" onClick={closeMenu}>Platform</a>
          <a href="#how" onClick={closeMenu}>How It Works</a>
          <a href="#offline" onClick={closeMenu}>About</a>
        </div>
        <div className="nb">
          <button className="btn hide" onClick={handleLogin}>Login</button>
          <button className="btn p" onClick={handleGetStarted}>Get Started</button>
          <button className="btn burger" id="bg" aria-label="Menu" aria-expanded="false" onClick={toggleMenu}>Menu</button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className="glass g-d" id="lp-menu" ref={menuRef}>
        <a href="#challenge" onClick={closeMenu}>The Challenge</a>
        <a href="#platform" onClick={closeMenu}>Platform</a>
        <a href="#how" onClick={closeMenu}>How It Works</a>
        <a href="#offline" onClick={closeMenu}>About</a>
        <button className="btn" onClick={() => { closeMenu(); handleLogin(); }}>Login</button>
      </div>

      <main id="top" style={{ position: 'relative', zIndex: 2, isolation: 'isolate' }}>
        {/* Hero */}
        <section id="hero">
          <div ref={heroContentRef}>
            <h1 className="hd" id="h1">
              <span><b>Predict floods.</b></span>
              <span><b>Prevent shortages.</b></span>
              <span><b>Recover every drop.</b></span>
            </h1>
            <p className="lead fade" style={{ transitionDelay: '0.9s' }}>
              An offline-first urban water intelligence and emergency safety platform for cities that need to see water clearly.
            </p>
            <div className="row fade" style={{ transitionDelay: '1.1s' }}>
              <button className="btn p" id="explore" onClick={handleExplore}>Explore AQUANET X</button>
              <button className="btn" onClick={handleGetStarted}>Get Started</button>
            </div>
          </div>
        </section>

        {/* Challenge section */}
        <section id="challenge">
          <h2 className="hd">
            <span><b>Water moves through a city.</b></span>
            <span><b>Intelligence should too.</b></span>
          </h2>
          <div className="grid g3">
            <div className="glass card rv" style={{ '--i': 0 } as React.CSSProperties}>
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="#B8F5EF" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M2 9c3-3 5 3 8 0s5 3 8 0 3 0 4 0M2 15c3-3 5 3 8 0s5 3 8 0 3 0 4 0" />
                </svg>
              </div>
              <h3>Flood Intelligence</h3>
              <p>Understand changing flood conditions and identify areas at risk.</p>
            </div>
            <div className="glass card rv" style={{ '--i': 1 } as React.CSSProperties}>
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="#B8F5EF" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
                </svg>
              </div>
              <h3>Water Intelligence</h3>
              <p>Monitor water availability, weather conditions, and water stress.</p>
            </div>
            <div className="glass card rv" style={{ '--i': 2 } as React.CSSProperties}>
              <div className="ic">
                <svg viewBox="0 0 24 24" fill="none" stroke="#B8F5EF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3>Emergency Safety</h3>
              <p>Support communities with offline-first emergency information.</p>
            </div>
          </div>
        </section>

        {/* Platform section */}
        <section id="platform">
          <h2 className="hd">
            <span><b>One platform.</b></span>
            <span><b>A clearer view of water.</b></span>
          </h2>
          <div className="grid g2">
            <div className="glass g-d card rv" style={{ '--i': 0 } as React.CSSProperties}>
              <svg viewBox="0 0 300 110">
                <path fill="rgba(102,232,224,.45)" d="M0 60C40 40 70 75 110 55S190 30 220 45 280 20 300 30V110H0z">
                  <animate attributeName="d" dur="5s" repeatCount="indefinite" values="M0 60C40 40 70 75 110 55S190 30 220 45 280 20 300 30V110H0z;M0 45C40 70 70 40 110 60S190 60 220 30 280 45 300 40V110H0z;M0 60C40 40 70 75 110 55S190 30 220 45 280 20 300 30V110H0z" />
                </path>
                <line x1="0" y1="38" x2="300" y2="38" stroke="#B8F5EF" strokeDasharray="4 5" opacity=".7" />
              </svg>
              <h3>Flood Intelligence</h3>
              <p>Rising-water patterns and at-risk zones, surfaced before they become emergencies.</p>
            </div>
            <div className="glass g-d card rv" style={{ '--i': 1 } as React.CSSProperties}>
              <svg viewBox="0 0 300 110">
                <rect x="125" y="6" width="50" height="98" rx="14" fill="none" stroke="#B8F5EF" opacity=".7" />
                <clipPath id="k"><rect x="127" y="8" width="46" height="94" rx="12" /></clipPath>
                <rect clipPath="url(#k)" x="127" y="40" width="46" height="70" fill="#39D8D0" opacity=".65">
                  <animate attributeName="y" values="34;66;34" dur="7s" repeatCount="indefinite" />
                </rect>
                <circle cx="60" cy="55" r="4" fill="#66E8E0">
                  <animate attributeName="r" values="4;22;4" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0;1" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="240" cy="55" r="4" fill="#66E8E0">
                  <animate attributeName="r" values="4;22;4" dur="3s" begin="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0;1" dur="3s" begin="1.5s" repeatCount="indefinite" />
                </circle>
              </svg>
              <h3>Water Stress</h3>
              <p>See how supply and demand are shifting across neighbourhoods.</p>
            </div>
            <div className="glass g-d card rv" style={{ '--i': 2 } as React.CSSProperties}>
              <svg viewBox="0 0 300 110">
                <g fill="#B8F5EF" opacity=".85">
                  <ellipse cx="130" cy="30" rx="48" ry="17" />
                  <ellipse cx="165" cy="24" rx="34" ry="19" />
                  <ellipse cx="190" cy="34" rx="30" ry="14" />
                </g>
                <g stroke="#66E8E0" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M115 62v10"><animateTransform attributeName="transform" type="translate" values="0 0;-6 36" dur="1.2s" repeatCount="indefinite" /></path>
                  <path d="M150 62v10"><animateTransform attributeName="transform" type="translate" values="0 0;-6 36" dur="1.5s" repeatCount="indefinite" /></path>
                  <path d="M185 62v10"><animateTransform attributeName="transform" type="translate" values="0 0;-6 36" dur="1.3s" repeatCount="indefinite" /></path>
                </g>
              </svg>
              <h3>Weather Intelligence</h3>
              <p>Rain, wind, and storm signals translated into plain, usable guidance.</p>
            </div>
            <div className="glass g-d card rv" style={{ '--i': 3 } as React.CSSProperties}>
              <svg viewBox="0 0 300 110">
                <g fill="none" stroke="#66E8E0" strokeWidth="3" strokeLinecap="round">
                  <path d="M112 62a40 40 0 0 1 66-26" />
                  <path d="M186 44a40 40 0 0 1-8 44" />
                  <path d="M166 98a40 40 0 0 1-54-30" />
                  <animateTransform attributeName="transform" type="rotate" from="0 150 58" to="360 150 58" dur="12s" repeatCount="indefinite" />
                </g>
                <path d="M150 40s14 15 14 25a14 14 0 0 1-28 0c0-10 14-25 14-25z" fill="#B8F5EF" opacity=".9" />
              </svg>
              <h3>Smart Recovery</h3>
              <p>Recover and reuse water, and plan the days after an event with confidence.</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how">
          <h2 className="hd">
            <span><b>From first signal</b></span>
            <span><b>to full recovery.</b></span>
          </h2>
          <div className="steps" id="steps" ref={stepsRef}>
            <div className="line"><i /></div>
            <div className="step">
              <div className="dot">1</div>
              <div className="glass g-l card"><h3>Observe</h3><p>Gather water and weather conditions.</p></div>
            </div>
            <div className="step">
              <div className="dot">2</div>
              <div className="glass g-l card"><h3>Predict</h3><p>Anticipate flood and stress risk.</p></div>
            </div>
            <div className="step">
              <div className="dot">3</div>
              <div className="glass g-l card"><h3>Respond</h3><p>Share clear safety guidance.</p></div>
            </div>
            <div className="step">
              <div className="dot">4</div>
              <div className="glass g-l card"><h3>Recover</h3><p>Restore and reuse every drop.</p></div>
            </div>
          </div>
        </section>

        {/* Offline / About */}
        <section id="offline">
          <div className="sonar"><i /><i /><i /><b /></div>
          <h2 className="hd">
            <span><b>Intelligence that</b></span>
            <span><b>stays with you.</b></span>
          </h2>
          <p className="lead fade">Because emergency information matters most when connectivity is weakest.</p>
          <div className="grid g3">
            <div className="glass card rv" style={{ '--i': 0 } as React.CSSProperties}>
              <h3>Offline Access</h3>
              <p>Designed so key information stays reachable when the network drops.</p>
            </div>
            <div className="glass card rv" style={{ '--i': 1 } as React.CSSProperties}>
              <h3>Emergency Readiness</h3>
              <p>Safety guidance built to be found fast, under pressure.</p>
            </div>
            <div className="glass card rv" style={{ '--i': 2 } as React.CSSProperties}>
              <h3>Low-Bandwidth Experience</h3>
              <p>Lightweight by design, so it works on slow connections.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <h2 className="hd">
            <span><b>Every drop matters.</b></span>
            <span><b>Every prediction counts.</b></span>
          </h2>
          <p className="fade">Build a safer, more water-wise city with intelligence that keeps moving.</p>
          <button className="btn p fade" onClick={handleGetStarted}>Get Started</button>
        </section>
      </main>

      <footer style={{ position: 'relative', zIndex: 2 }}>
        <div className="glass g-l">AQUANET X &copy; 2026. Urban water intelligence.</div>
      </footer>

      <div id="fx" ref={fxRef} />
    </>
  );
}

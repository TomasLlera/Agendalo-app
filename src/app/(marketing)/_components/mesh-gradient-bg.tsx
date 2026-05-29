"use client";

import { useEffect, useRef } from "react";

/**
 * Fondo animado con WebGL: un fragment shader dibuja 4 blobs de color que se
 * mueven en órbitas y se mezclan aditivamente sobre el fondo negro. Vibe tipo
 * Linear / Vercel.
 *
 * Sin dependencias: WebGL crudo, ~150 líneas. El canvas se renderiza a la
 * resolución del CSS dividido por 1.5 (downsample) — el blur natural del
 * mesh gradient esconde el upscale, así ahorramos un 55% de píxeles a
 * renderizar.
 *
 * - Respeta `prefers-reduced-motion`: render de un solo frame estático.
 * - Pausa el RAF cuando la pestaña está oculta.
 * - Limpieza completa en unmount (RAF + observer + WebGL).
 * - Fallback: si WebGL no está disponible, el canvas queda transparente y
 *   el `<div>` debajo muestra el fondo negro base + vignette CSS.
 */
export function MeshGradientBg() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext("webgl", { antialias: false, alpha: true }) ??
      canvas.getContext("experimental-webgl", {
        antialias: false,
        alpha: true,
      });
    if (!gl || !(gl instanceof WebGLRenderingContext)) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const vertSrc = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main() {
        v_uv = a_pos * 0.5 + 0.5;
        gl_Position = vec4(a_pos, 0.0, 1.0);
      }
    `;
    // Mesh gradient: 4 blobs orbitales con contribución aditiva, falloff
    // suave (smoothstep), vignette radial al borde. Colores tomados del
    // blueprint.
    const fragSrc = `
      precision highp float;
      varying vec2 v_uv;
      uniform vec2 u_res;
      uniform float u_time;

      vec3 blob(vec2 uv, vec2 center, vec3 color, float radius, float strength) {
        // Corrige aspecto para que los blobs sean redondos, no elipses.
        vec2 d = uv - center;
        d.x *= u_res.x / u_res.y;
        float dist = length(d);
        float falloff = smoothstep(radius, 0.0, dist);
        return color * falloff * strength;
      }

      void main() {
        vec2 uv = v_uv;
        float t = u_time;

        // Cuatro blobs orbitando con períodos y radios distintos.
        vec2 c1 = vec2(0.25 + 0.18 * sin(t * 0.22), 0.30 + 0.14 * cos(t * 0.18));
        vec2 c2 = vec2(0.78 + 0.12 * cos(t * 0.27), 0.72 + 0.18 * sin(t * 0.21));
        vec2 c3 = vec2(0.55 + 0.22 * sin(t * 0.16 + 1.5), 0.20 + 0.10 * cos(t * 0.25));
        vec2 c4 = vec2(0.40 + 0.16 * cos(t * 0.20 + 3.0), 0.85 + 0.10 * sin(t * 0.19));

        // Paleta blueprint: success (esmeralda), secondary (plata fría), warning
        // (ámbar), un violeta accent para profundidad.
        vec3 col = vec3(0.0);
        col += blob(uv, c1, vec3(0.063, 0.725, 0.506), 0.55, 0.85); // #10B981
        col += blob(uv, c2, vec3(0.753, 0.753, 0.753), 0.50, 0.30); // #C0C0C0 sutil
        col += blob(uv, c3, vec3(0.961, 0.620, 0.043), 0.45, 0.55); // #F59E0B
        col += blob(uv, c4, vec3(0.545, 0.361, 0.965), 0.50, 0.45); // #8b5cf6 violet

        // Vignette suave al borde para fundir con el fondo.
        vec2 q = v_uv - 0.5;
        float vig = 1.0 - smoothstep(0.45, 0.95, length(q));
        col *= vig;

        // Bajamos saturación global — sumas aditivas tienden a quemar.
        col = col / (col + vec3(1.0));

        // Alpha en función de la intensidad — deja pasar el negro debajo.
        float a = clamp(max(max(col.r, col.g), col.b) * 1.4, 0.0, 0.9);
        gl_FragColor = vec4(col, a);
      }
    `;

    const compile = (type: number, src: string): WebGLShader | null => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("[mesh-gradient] shader compile error:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, vertSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("[mesh-gradient] link error:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // Full-screen quad.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const DOWNSAMPLE = 1.5;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width / DOWNSAMPLE));
      const h = Math.max(1, Math.floor(rect.height / DOWNSAMPLE));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uRes, w, h);
      }
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const start = performance.now();
    let rafId = 0;
    let paused = false;

    const onVisibility = () => {
      paused = document.hidden;
      if (!paused && !reduceMotion) {
        // Resume.
        rafId = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const frame = () => {
      if (paused) return;
      const t = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(frame);
    };

    if (reduceMotion) {
      // Un solo frame estático.
      gl.uniform1f(uTime, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else {
      rafId = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibility);
      ro.disconnect();
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-background" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full"
        style={{ filter: "blur(40px)" }}
      />
      {/* Grid pattern muy sutil encima del mesh. */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at center, #000 30%, transparent 75%)",
        }}
      />
      {/* Vignette inferior para fundir hacia el contenido. */}
      <div
        className="absolute inset-x-0 bottom-0 h-64"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--color-background) 90%)",
        }}
      />
    </div>
  );
}

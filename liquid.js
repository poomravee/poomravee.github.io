'use strict';
// Original liquid-curtain implementation. Visual inspiration: Ksenia Kondrashova,
// "On-Scroll Gooey Overlay", https://codepen.io/ksenia-k/pen/NWmMxLg
window.createLiquidCurtain = function(canvas) {
  const gl = canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:true,powerPreference:'low-power'});
  if (!gl) return null;
  const vertex = 'attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}';
  const fragment = `
    precision mediump float;
    uniform vec2 size;
    uniform float progress;
    uniform float clock;
    float join(float a,float b,float k){
      float h=max(k-abs(a-b),0.)/k;
      return max(a,b)+h*h*k*.25;
    }
    void main(){
      vec2 uv=vec2(gl_FragCoord.x/size.x,1.-gl_FragCoord.y/size.y);
      float aspect=size.x/size.y;
      float edge=-.38+1.85*progress;
      float wave=.018*sin(uv.x*12.+clock*.52)+.012*sin(uv.x*25.-clock*.32);
      float field=edge+wave-uv.y;
      for(int i=0;i<9;i++){
        float n=float(i);
        float cx=(n+.45)/9.+.012*sin(n*2.7+clock*.3);
        float reach=.11+.10*(.5+.5*sin(n*3.13+1.4));
        float radius=.035+.015*(.5+.5*sin(n*2.41));
        float tip=edge+reach+.022*sin(clock*.8+n);
        float dx=(uv.x-cx)*aspect;
        float capsule=radius-length(vec2(dx,max(0.,uv.y-tip+radius)));
        field=join(field,capsule,.045);
        float dropY=tip+.085+.045*sin(n*1.7+clock*.7);
        float dropR=.009+.006*(.5+.5*sin(n+clock*.45));
        float drop=dropR-length(vec2(dx,uv.y-dropY));
        field=join(field,drop,.025);
      }
      float alpha=smoothstep(-.002,.002,field);
      if(progress<.001)alpha=0.;
      vec3 lime=vec3(.8392,.9725,.4353);
      float highlight=exp(-abs(field)*95.)*.095;
      vec3 color=lime+vec3(highlight*.55,highlight*.2,highlight);
      // Transparent pixels must contain no RGB, including in Chrome's compositor.
      gl_FragColor=vec4(color*alpha,alpha);
    }`;
  const compile=(type,source)=>{
    const shader=gl.createShader(type); gl.shaderSource(shader,source); gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;} return shader;
  };
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  if(!vs||!fs){if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);return null;}
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);return null;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const uniforms={size:gl.getUniformLocation(program,'size'),progress:gl.getUniformLocation(program,'progress'),clock:gl.getUniformLocation(program,'clock')};
  let disposed=false,lastProgress=0,lastTime=0;
  function resize(){
    const rect=canvas.getBoundingClientRect();
    const width=Math.max(rect.width,1),height=Math.max(rect.height,1);
    // A soft liquid edge doesn't need a high-DPI full-screen drawing buffer.
    const scale=Math.min(window.devicePixelRatio||1,1,1280/width,Math.sqrt(640000/(width*height)));
    const nextWidth=Math.max(1,Math.floor(width*scale)),nextHeight=Math.max(1,Math.floor(height*scale));
    if(canvas.width===nextWidth&&canvas.height===nextHeight)return;
    canvas.width=nextWidth;canvas.height=nextHeight;
    gl.viewport(0,0,canvas.width,canvas.height);
    render(lastProgress,lastTime);
  }
  function render(value,time){
    if(disposed||gl.isContextLost())return;
    const progress=Math.min(1,Math.max(0,value));
    lastProgress=progress;lastTime=time;
    // Keep the resting hero independent of GPU transparency/compositing behavior.
    canvas.style.visibility=progress<=.001?'hidden':'';
    if(progress<=.001){
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      return;
    }
    gl.uniform2f(uniforms.size,canvas.width,canvas.height);
    gl.uniform1f(uniforms.progress,progress);
    gl.uniform1f(uniforms.clock,time);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const onLost=event=>{event.preventDefault();window.dispatchEvent(new Event('liquid-unavailable'));};
  canvas.addEventListener('webglcontextlost',onLost);
  return {render,resize,destroy(){
    disposed=true;observer.disconnect();canvas.removeEventListener('webglcontextlost',onLost);
    gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    canvas.style.visibility='';
  }};
};

